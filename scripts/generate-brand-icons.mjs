import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Find master source: ZunDeck-7.jpg at root or in docs/brand/
const rootSource = path.join(ROOT_DIR, 'ZunDeck-7.jpg');
const brandSource = path.join(ROOT_DIR, 'docs', 'brand', 'ZunDeck-7.jpg');

let masterSrc = null;
if (fs.existsSync(rootSource)) {
  masterSrc = rootSource;
} else if (fs.existsSync(brandSource)) {
  masterSrc = brandSource;
} else {
  console.error('✕ Error: ZunDeck-7.jpg not found in root or docs/brand/');
  process.exit(1);
}

const EXT_ICONS_DIR = path.join(ROOT_DIR, 'apps', 'extension', 'assets', 'icons');
const WEB_ASSETS_DIR = path.join(ROOT_DIR, 'apps', 'web', 'assets');
const DOCS_BRAND_DIR = path.join(ROOT_DIR, 'docs', 'brand');
const EXT_LEGACY_ICONS = path.join(ROOT_DIR, 'apps', 'extension', 'icons');

[EXT_ICONS_DIR, WEB_ASSETS_DIR, DOCS_BRAND_DIR, EXT_LEGACY_ICONS].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

console.log('--- Processing Vibrant Flat Geometric ZunDeck-7 Logo ---');

const psScript = `
Add-Type -AssemblyName System.Drawing

$csharpSource = @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Collections.Generic;

public class BrandIconGenerator
{
    public static void Generate(string srcPath, string extIconsDir, string extLegacyDir, string webAssetsDir, string faviconPath)
    {
        using (Bitmap src = new Bitmap(srcPath))
        {
            int w = src.Width;
            int h = src.Height;

            BitmapData srcData = src.LockBits(
                new Rectangle(0, 0, w, h),
                ImageLockMode.ReadOnly,
                PixelFormat.Format24bppRgb
            );
            int stride = Math.Abs(srcData.Stride);
            byte[] rgb = new byte[stride * h];
            System.Runtime.InteropServices.Marshal.Copy(srcData.Scan0, rgb, 0, rgb.Length);
            src.UnlockBits(srcData);

            // BFS flood fill for outer white background
            byte[] bg = new byte[w * h];
            Queue<int> q = new Queue<int>(w * 4);

            for (int x = 0; x < w; x++)
            {
                q.Enqueue(x);
                bg[x] = 1;
                int b = (h - 1) * w + x;
                q.Enqueue(b);
                bg[b] = 1;
            }
            for (int y = 1; y < h - 1; y++)
            {
                int l = y * w;
                q.Enqueue(l);
                bg[l] = 1;
                int r = y * w + (w - 1);
                q.Enqueue(r);
                bg[r] = 1;
            }

            int[] dx = { -1, 1, 0, 0 };
            int[] dy = { 0, 0, -1, 1 };

            while (q.Count > 0)
            {
                int curr = q.Dequeue();
                int cx = curr % w;
                int cy = curr / w;

                for (int i = 0; i < 4; i++)
                {
                    int nx = cx + dx[i];
                    int ny = cy + dy[i];
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h)
                    {
                        int nidx = ny * w + nx;
                        if (bg[nidx] == 0)
                        {
                            int byteIdx = ny * stride + nx * 3;
                            byte b = rgb[byteIdx];
                            byte g = rgb[byteIdx + 1];
                            byte r = rgb[byteIdx + 2];

                            // Flood fill threshold for outer white background
                            if (r >= 240 && g >= 240 && b >= 240)
                            {
                                bg[nidx] = 1;
                                q.Enqueue(nidx);
                            }
                        }
                    }
                }
            }

            // Create full-size 32bpp ARGB transparent image
            using (Bitmap transparentFull = new Bitmap(w, h, PixelFormat.Format32bppArgb))
            {
                BitmapData resData = transparentFull.LockBits(
                    new Rectangle(0, 0, w, h),
                    ImageLockMode.WriteOnly,
                    PixelFormat.Format32bppArgb
                );
                int resStride = Math.Abs(resData.Stride);
                byte[] resBytes = new byte[resStride * h];

                int minX = w, maxX = 0, minY = h, maxY = 0;

                for (int y = 0; y < h; y++)
                {
                    for (int x = 0; x < w; x++)
                    {
                        int idx = y * w + x;
                        int srcIdx = y * stride + x * 3;
                        int resIdx = y * resStride + x * 4;

                        byte b = rgb[srcIdx];
                        byte g = rgb[srcIdx + 1];
                        byte r = rgb[srcIdx + 2];

                        if (bg[idx] == 1)
                        {
                            resBytes[resIdx] = 0;
                            resBytes[resIdx + 1] = 0;
                            resBytes[resIdx + 2] = 0;
                            resBytes[resIdx + 3] = 0;
                        }
                        else
                        {
                            bool touchesBg = false;
                            for (int i = 0; i < 4; i++)
                            {
                                int nx = x + dx[i];
                                int ny = y + dy[i];
                                if (nx >= 0 && nx < w && ny >= 0 && ny < h)
                                {
                                    if (bg[ny * w + nx] == 1)
                                    {
                                        touchesBg = true;
                                        break;
                                    }
                                }
                            }

                            byte alpha = 255;
                            if (touchesBg)
                            {
                                double dist = Math.Sqrt((255 - r) * (255 - r) + (255 - g) * (255 - g) + (255 - b) * (255 - b));
                                if (dist < 40.0)
                                {
                                    alpha = (byte)Math.Max(0, (int)(dist / 40.0 * 255.0));
                                }
                                else
                                {
                                    alpha = 255;
                                }

                                if (alpha > 0 && alpha < 255)
                                {
                                    double a = alpha / 255.0;
                                    int ur = (int)Math.Round((r - (1.0 - a) * 255.0) / a);
                                    int ug = (int)Math.Round((g - (1.0 - a) * 255.0) / a);
                                    int ub = (int)Math.Round((b - (1.0 - a) * 255.0) / a);
                                    r = (byte)Math.Max(0, Math.Min(255, ur));
                                    g = (byte)Math.Max(0, Math.Min(255, ug));
                                    b = (byte)Math.Max(0, Math.Min(255, ub));
                                }
                            }

                            resBytes[resIdx] = b;
                            resBytes[resIdx + 1] = g;
                            resBytes[resIdx + 2] = r;
                            resBytes[resIdx + 3] = alpha;

                            if (alpha > 10)
                            {
                                if (x < minX) minX = x;
                                if (x > maxX) maxX = x;
                                if (y < minY) minY = y;
                                if (y > maxY) maxY = y;
                            }
                        }
                    }
                }

                System.Runtime.InteropServices.Marshal.Copy(resBytes, 0, resData.Scan0, resBytes.Length);
                transparentFull.UnlockBits(resData);

                // Tight crop to the non-transparent emblem bounding box
                int cropW = maxX - minX + 1;
                int cropH = maxY - minY + 1;

                using (Bitmap cropped = new Bitmap(cropW, cropH, PixelFormat.Format32bppArgb))
                {
                    using (Graphics g = Graphics.FromImage(cropped))
                    {
                        g.CompositingMode = CompositingMode.SourceCopy;
                        g.DrawImage(transparentFull,
                            new Rectangle(0, 0, cropW, cropH),
                            new Rectangle(minX, minY, cropW, cropH),
                            GraphicsUnit.Pixel);
                    }

                    // 1. Export main web logo: 256px height (preserving aspect ratio, width = 388px)
                    int webLogoH = 256;
                    int webLogoW = (int)Math.Round((double)webLogoH * cropW / cropH);
                    using (Bitmap webLogo = new Bitmap(webLogoW, webLogoH, PixelFormat.Format32bppArgb))
                    {
                        using (Graphics g = Graphics.FromImage(webLogo))
                        {
                            ConfigureGraphics(g);
                            g.DrawImage(cropped, new Rectangle(0, 0, webLogoW, webLogoH));
                        }
                        string webLogoPath = System.IO.Path.Combine(webAssetsDir, "zundeck-logo.png");
                        webLogo.Save(webLogoPath, ImageFormat.Png);
                        Console.WriteLine("✓ Generated web logo: " + webLogoPath + " (" + webLogoW + "x" + webLogoH + ")");
                    }

                    // 2. Export Square Icons (16, 32, 48, 128) for extension and favicon
                    int[] sizes = { 16, 32, 48, 128 };
                    foreach (int size in sizes)
                    {
                        using (Bitmap icon = new Bitmap(size, size, PixelFormat.Format32bppArgb))
                        {
                            using (Graphics g = Graphics.FromImage(icon))
                            {
                                ConfigureGraphics(g);
                                g.Clear(Color.Transparent);

                                // Fit proportionally inside square canvas
                                int targetW, targetH;
                                if (cropW >= cropH)
                                {
                                    targetW = size;
                                    targetH = Math.Max(1, (int)Math.Round((double)size * cropH / cropW));
                                }
                                else
                                {
                                    targetH = size;
                                    targetW = Math.Max(1, (int)Math.Round((double)size * cropW / cropH));
                                }
                                int offsetX = (size - targetW) / 2;
                                int offsetY = (size - targetH) / 2;

                                g.DrawImage(cropped, new Rectangle(offsetX, offsetY, targetW, targetH));
                            }

                            // Apply subtle sharpening for low-res icons
                            if (size <= 48)
                            {
                                ApplySubtleSharpen(icon);
                            }

                            // Save to apps/extension/assets/icons/
                            string outExtPath = System.IO.Path.Combine(extIconsDir, "icon" + size + ".png");
                            icon.Save(outExtPath, ImageFormat.Png);
                            Console.WriteLine("✓ Generated icon: " + outExtPath + " (" + size + "x" + size + ")");

                            // Save legacy apps/extension/icons/
                            string outLegacyPath = System.IO.Path.Combine(extLegacyDir, "icon-" + size + ".png");
                            icon.Save(outLegacyPath, ImageFormat.Png);

                            // Favicon (48x48)
                            if (size == 48)
                            {
                                icon.Save(faviconPath, ImageFormat.Png);
                                Console.WriteLine("✓ Generated favicon: " + faviconPath + " (48x48)");
                            }
                        }
                    }
                }
            }
        }
    }

    private static void ConfigureGraphics(Graphics g)
    {
        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
        g.SmoothingMode = SmoothingMode.HighQuality;
        g.PixelOffsetMode = PixelOffsetMode.HighQuality;
        g.CompositingQuality = CompositingQuality.HighQuality;
    }

    private static void ApplySubtleSharpen(Bitmap bmp)
    {
        int w = bmp.Width;
        int h = bmp.Height;
        BitmapData data = bmp.LockBits(
            new Rectangle(0, 0, w, h),
            ImageLockMode.ReadWrite,
            PixelFormat.Format32bppArgb
        );

        int stride = Math.Abs(data.Stride);
        byte[] original = new byte[stride * h];
        System.Runtime.InteropServices.Marshal.Copy(data.Scan0, original, 0, original.Length);
        byte[] sharpened = (byte[])original.Clone();

        // Subtle 3x3 sharpen kernel: center 1.3, neighbors -0.075
        float center = 1.3f;
        float neighbor = -0.075f;

        for (int y = 1; y < h - 1; y++)
        {
            for (int x = 1; x < w - 1; x++)
            {
                int idx = y * stride + x * 4;
                byte a = original[idx + 3];
                if (a == 0) continue;

                for (int c = 0; c < 3; c++) // B, G, R
                {
                    float val = original[idx + c] * center
                        + original[(y - 1) * stride + x * 4 + c] * neighbor
                        + original[(y + 1) * stride + x * 4 + c] * neighbor
                        + original[y * stride + (x - 1) * 4 + c] * neighbor
                        + original[y * stride + (x + 1) * 4 + c] * neighbor;

                    sharpened[idx + c] = (byte)Math.Max(0, Math.Min(255, (int)Math.Round(val)));
                }
            }
        }

        System.Runtime.InteropServices.Marshal.Copy(sharpened, 0, data.Scan0, sharpened.Length);
        bmp.UnlockBits(data);
    }
}
"@

Add-Type -TypeDefinition $csharpSource -ReferencedAssemblies System.Drawing

$src = "${masterSrc.replace(/\\/g, '\\\\')}"
$extIcons = "${EXT_ICONS_DIR.replace(/\\/g, '\\\\')}"
$extLegacy = "${EXT_LEGACY_ICONS.replace(/\\/g, '\\\\')}"
$webAssets = "${WEB_ASSETS_DIR.replace(/\\/g, '\\\\')}"
$favicon = "${path.join(ROOT_DIR, 'apps', 'web', 'favicon.png').replace(/\\/g, '\\\\')}"

[BrandIconGenerator]::Generate($src, $extIcons, $extLegacy, $webAssets, $favicon)
`;

const tempPs = path.join(ROOT_DIR, 'scripts', '_run_icon_gen.ps1');
fs.writeFileSync(tempPs, psScript, 'utf8');

try {
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempPs}"`, {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  });
} finally {
  if (fs.existsSync(tempPs)) fs.unlinkSync(tempPs);
}

// Move master image to docs/brand/ZunDeck-7.jpg if at root
if (fs.existsSync(rootSource)) {
  fs.copyFileSync(rootSource, brandSource);
  fs.unlinkSync(rootSource);
  console.log('✓ Moved ZunDeck-7.jpg to docs/brand/ZunDeck-7.jpg');
}

console.log('--- Brand Icon Processing Complete ---');
