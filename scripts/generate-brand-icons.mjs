import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const MASTER_SRC = fs.existsSync(path.join(ROOT_DIR, 'docs', 'brand', 'ZunDeck-master.png'))
  ? path.join(ROOT_DIR, 'docs', 'brand', 'ZunDeck-master.png')
  : path.join(ROOT_DIR, 'ZunDeck.png');

if (!fs.existsSync(MASTER_SRC)) {
  console.error('✕ Error: ZunDeck.png not found at root or docs/brand/ZunDeck-master.png');
  process.exit(1);
}

// Ensure target directories exist
const EXT_ICONS_DIR = path.join(ROOT_DIR, 'apps', 'extension', 'assets', 'icons');
const WEB_ASSETS_DIR = path.join(ROOT_DIR, 'apps', 'web', 'assets');
const DOCS_BRAND_DIR = path.join(ROOT_DIR, 'docs', 'brand');
const EXT_LEGACY_ICONS = path.join(ROOT_DIR, 'apps', 'extension', 'icons');

[EXT_ICONS_DIR, WEB_ASSETS_DIR, DOCS_BRAND_DIR, EXT_LEGACY_ICONS].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Copy master logo to docs/brand/ZunDeck-master.png
const brandMasterDest = path.join(DOCS_BRAND_DIR, 'ZunDeck-master.png');
if (!fs.existsSync(brandMasterDest) || fs.statSync(brandMasterDest).size !== fs.statSync(MASTER_SRC).size) {
  fs.copyFileSync(MASTER_SRC, brandMasterDest);
  console.log('✓ Preserved master logo in docs/brand/ZunDeck-master.png');
}

console.log('--- Generating High-DPI Circular Brand Icons from ZunDeck.png ---');

// Crop coordinates for circular medallion (trimming outer white margin)
const cropX = 112;
const cropY = 116;
const side = 663;

const targets = [
  { path: path.join(EXT_ICONS_DIR, 'icon16.png'), size: 16 },
  { path: path.join(EXT_ICONS_DIR, 'icon32.png'), size: 32 },
  { path: path.join(EXT_ICONS_DIR, 'icon48.png'), size: 48 },
  { path: path.join(EXT_ICONS_DIR, 'icon128.png'), size: 128 },
  { path: path.join(WEB_ASSETS_DIR, 'zundeck-logo.png'), size: 256 },
  { path: path.join(ROOT_DIR, 'apps', 'web', 'favicon.png'), size: 48 },
  // Also keep apps/extension/icons/ backwards-compatible
  { path: path.join(EXT_LEGACY_ICONS, 'icon-16.png'), size: 16 },
  { path: path.join(EXT_LEGACY_ICONS, 'icon-32.png'), size: 32 },
  { path: path.join(EXT_LEGACY_ICONS, 'icon-48.png'), size: 48 },
  { path: path.join(EXT_LEGACY_ICONS, 'icon-128.png'), size: 128 }
];

const psScript = `
Add-Type -AssemblyName System.Drawing

$srcPath = "${MASTER_SRC.replace(/\\/g, '\\\\')}"
$srcBmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$srcRect = New-Object System.Drawing.Rectangle (${cropX}, ${cropY}, ${side}, ${side})

$targets = @(
${targets.map((t) => `  @{ Path = "${t.path.replace(/\\/g, '\\\\')}"; Size = ${t.size} }`).join(',\n')}
)

foreach ($t in $targets) {
  $size = $t.Size
  $outPath = $t.Path

  $targetBmp = New-Object System.Drawing.Bitmap ($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($targetBmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)

  # Circular anti-aliased clipping path
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddEllipse(0, 0, $size, $size)
  $g.SetClip($path)

  $destRect = New-Object System.Drawing.Rectangle (0, 0, $size, $size)
  $g.DrawImage($srcBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

  $targetBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $g.Dispose()
  $targetBmp.Dispose()
  Write-Host "  -> Generated: $outPath ($size x $size)"
}

$srcBmp.Dispose()
`;

const tempPsFile = path.join(ROOT_DIR, 'scripts', '_temp_icon_gen.ps1');

try {
  fs.writeFileSync(tempPsFile, psScript, 'utf8');
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempPsFile}"`, {
    stdio: 'inherit'
  });
  console.log('✓ All circular brand icons generated successfully.');
} catch (err) {
  console.error('Error running icon generation PowerShell script:', err.message);
  process.exit(1);
} finally {
  if (fs.existsSync(tempPsFile)) {
    fs.unlinkSync(tempPsFile);
  }
}
