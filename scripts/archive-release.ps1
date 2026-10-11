$ErrorActionPreference = 'Stop'
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$releaseInfo = Get-Content -LiteralPath (Join-Path $repoRoot '.local/latest-release.json') -Raw | ConvertFrom-Json
if ($releaseInfo.local) { throw 'Do not publish a machine-specific package. Run pnpm package:release first.' }
$releaseRoot = [IO.Path]::GetFullPath($releaseInfo.releaseRoot)
$expectedRoot = [IO.Path]::GetFullPath((Join-Path $repoRoot '.local/releases')) + [IO.Path]::DirectorySeparatorChar
if (-not $releaseRoot.StartsWith($expectedRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unexpected staging directory.' }
$outputDir = Join-Path $repoRoot ".local/public/$($releaseInfo.version)"
[IO.Directory]::CreateDirectory($outputDir) | Out-Null
$archiveName = "codex-canvas-$($releaseInfo.version)-portable.zip"
$archivePath = Join-Path $outputDir $archiveName
if (Test-Path -LiteralPath $archivePath) { throw "Archive already exists: $archivePath" }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::Open($archivePath, [IO.Compression.ZipArchiveMode]::Create)
try {
    $files = @((Get-Item -LiteralPath (Join-Path $releaseRoot 'INSTALL.md')))
    $files += Get-ChildItem -LiteralPath (Join-Path $releaseRoot '.agents') -Recurse -File -Force
    $files += Get-ChildItem -LiteralPath (Join-Path $releaseRoot 'plugins') -Recurse -File -Force | Where-Object {
        $_.FullName -notmatch '[\\/]node_modules[\\/]'
    }
    foreach ($file in $files) {
        $entry = [IO.Path]::GetRelativePath($releaseRoot, $file.FullName).Replace('\', '/')
        if ($entry -match '(^|/)(\.canvas-data|\.local|\.git|\.env|node_modules)(/|$)' -or $entry.StartsWith('../')) {
            throw "Private or unexpected archive entry: $entry"
        }
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $entry, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally { $archive.Dispose() }

$verify = [IO.Compression.ZipFile]::OpenRead($archivePath)
try {
    foreach ($required in @('INSTALL.md', '.agents/plugins/marketplace.json', 'plugins/codex-canvas/LICENSE', 'plugins/codex-canvas/dist/app.html', 'plugins/codex-canvas/package-lock.json')) {
        if (-not $verify.GetEntry($required)) { throw "Missing archive entry: $required" }
    }
    $entryCount = $verify.Entries.Count
} finally { $verify.Dispose() }
$checksum = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
[IO.File]::WriteAllText((Join-Path $outputDir 'SHA256SUMS.txt'), "$checksum  $archiveName`n", [Text.UTF8Encoding]::new($false))
Write-Output "Created $archivePath ($entryCount entries); SHA256SUMS.txt written."
