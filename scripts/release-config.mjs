// One generated runtime manifest is shared by the lock updater and packager.
export function runtimePackage(pkg, renderer) {
  return { name: 'codex-canvas-release', version: pkg.version, private: true, type: 'module', license: pkg.license,
    engines: pkg.engines, scripts: { build: 'node scripts/build.mjs', start: 'node dist/server.mjs --serve', canvas: 'node dist/cli.mjs', mcp: 'node scripts/start-mcp.mjs' },
    dependencies: { ...pkg.dependencies, ...renderer.dependencies, ...pkg.devDependencies } };
}
