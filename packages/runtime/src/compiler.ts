import ts from 'typescript';
import { build } from 'esbuild';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { Diagnostic } from './contracts.js';

export async function compile(source: string, root: string) {
  const filename = path.join(root, '__canvas__.tsx');
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
  const diagnostics: Diagnostic[] = [];
  const report = (node: ts.Node, message: string) => {
    const pos = tree.getLineAndCharacterOfPosition(node.getStart(tree));
    diagnostics.push({ phase: 'policy', message, file: 'canvas.tsx', line: pos.line + 1, column: pos.character + 1 });
  };
  function visit(node: ts.Node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      if (!ts.isStringLiteral(node.moduleSpecifier) || node.moduleSpecifier.text !== '@codex-canvas/sdk') report(node, '只允许从 @codex-canvas/sdk 导入。');
    }
    if (ts.isImportEqualsDeclaration(node) || ts.isImportTypeNode(node) ||
        (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && ['require', 'eval', 'Function'].includes(node.expression.text))))) report(node, '不允许动态导入、require 或动态代码执行。');
    ts.forEachChild(node, visit);
  }
  visit(tree);
  if (tree.referencedFiles.length || tree.typeReferenceDirectives.length || tree.libReferenceDirectives.length) report(tree, '不允许 triple-slash 引用。');
  if (diagnostics.length) return { diagnostics };
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX, strict: true, noEmit: true, skipLibCheck: true, esModuleInterop: true,
    types: ['react'], typeRoots: [path.join(root, 'node_modules/@types')],
    paths: { '@codex-canvas/sdk': [path.join(root, 'packages/sdk/src/index.tsx')] },
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  };
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (file, language, error, fresh) => path.resolve(file) === filename ? tree : original(file, language, error, fresh);
  const program = ts.createProgram([filename], options, host);
  for (const item of ts.getPreEmitDiagnostics(program).slice(0, 30)) {
    const pos = item.file && item.start !== undefined ? item.file.getLineAndCharacterOfPosition(item.start) : undefined;
    diagnostics.push({ phase: 'typecheck', message: ts.flattenDiagnosticMessageText(item.messageText, '\n'),
      file: item.file && path.resolve(item.file.fileName) === filename ? 'canvas.tsx' : path.relative(root, item.file?.fileName ?? filename),
      ...(pos ? { line: pos.line + 1, column: pos.character + 1 } : {}) });
  }
  if (diagnostics.length) return { diagnostics };
  try {
    const result = await build({
      stdin: { contents: `import Canvas from 'canvas-source'; import { mount } from './packages/renderer/src/mount'; mount(Canvas);`, resolveDir: root, loader: 'tsx' },
      absWorkingDir: root, bundle: true, write: false, outdir: 'canvas-output', platform: 'browser',
      format: 'iife', target: 'es2022', jsx: 'automatic', minify: true, logLevel: 'silent',
      define: { 'process.env.NODE_ENV': '"production"' },
      alias: { '@codex-canvas/sdk': path.join(root, 'packages/sdk/src/index.tsx') },
      plugins: [{ name: 'canvas-source', setup(b) {
        b.onResolve({ filter: /^canvas-source$/ }, () => ({ path: 'canvas.tsx', namespace: 'canvas' }));
        b.onLoad({ filter: /.*/, namespace: 'canvas' }, () => ({ contents: source, loader: 'tsx', resolveDir: root }));
      }}],
    });
    const bundle = result.outputFiles.find(f => f.path.endsWith('.js'))!.text;
    const css = result.outputFiles.find(f => f.path.endsWith('.css'))?.text ?? '';
    const buildHash = createHash('sha256').update(bundle).update(css).digest('hex');
    return { diagnostics, bundle, css, buildHash };
  } catch (error: unknown) {
    return { diagnostics: [{ phase: 'bundle', file: 'canvas.tsx', message: error instanceof Error ? error.message : String(error) } satisfies Diagnostic] };
  }
}
