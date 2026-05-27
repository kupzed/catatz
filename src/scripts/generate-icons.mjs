import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

const brandColor = "#ffffff";
const iconSizes = [32, 72, 96, 128, 144, 152, 180, 192, 384, 512];
const maskableSizes = [192, 512];

const svgSourcePath = path.join(projectRoot, "public/catatz.svg");
const pngFallbackPath = path.join(projectRoot, "public/catatz-source.png");
const iconsDir = path.join(projectRoot, "public/icons");

async function loadSource() {
  if (existsSync(svgSourcePath)) {
    try {
      // Prefer the SVG logo so generated icons remain crisp at every size.
      await sharp(svgSourcePath).metadata();
      return { input: svgSourcePath, sourceName: "public/catatz.svg" };
    } catch (error) {
      console.warn(
        `Unable to read public/catatz.svg with sharp: ${error.message}`,
      );
    }
  }

  if (existsSync(pngFallbackPath)) {
    const metadata = await sharp(pngFallbackPath).metadata();

    if (metadata.width !== 512 || metadata.height !== 512) {
      throw new Error(
        "Fallback public/catatz-source.png must be exactly 512x512 pixels.",
      );
    }

    return { input: pngFallbackPath, sourceName: "public/catatz-source.png" };
  }

  throw new Error(
    "Icon source not available. Make sure public/catatz.svg can be read by sharp, or manually provide public/catatz-source.png as a 512x512 PNG fallback.",
  );
}

async function generateStandardIcons(source) {
  for (const size of iconSizes) {
    await sharp(source.input)
      .resize(size, size, { fit: "contain" })
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
  }

  // iOS expects this conventional filename for home screen icons.
  await sharp(source.input)
    .resize(180, 180, { fit: "contain" })
    .png()
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));
}

async function generateMaskableIcons(source) {
  for (const size of maskableSizes) {
    const safeAreaSize = Math.round(size * 0.6);
    const iconBuffer = await sharp(source.input)
      .resize(safeAreaSize, safeAreaSize, { fit: "contain" })
      .png()
      .toBuffer();

    // Maskable icons keep the logo inside the safe area on shaped launchers.
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: brandColor,
      },
    })
      .composite([{ input: iconBuffer, gravity: "center" }])
      .png()
      .toFile(path.join(iconsDir, `maskable-icon-${size}x${size}.png`));
  }
}

async function main() {
  await mkdir(iconsDir, { recursive: true });

  const source = await loadSource();
  await generateStandardIcons(source);
  await generateMaskableIcons(source);

  console.log(`Generated CatatZ PWA icons from ${source.sourceName}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
