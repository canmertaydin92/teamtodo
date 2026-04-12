import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, "../public/icon.svg");
const svg = readFileSync(svgPath);

const sizes = [
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
];

for (const { name, size } of sizes) {
  const outPath = join(__dirname, "../public", name);
  await sharp(svg).resize(size, size).png().toFile(outPath);
  console.log(`✓ ${name} (${size}x${size})`);
}

console.log("İkonlar oluşturuldu!");
