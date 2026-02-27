import { Jimp } from 'jimp';
import path from 'path';

const PUBLIC_DIR = '/home/runner/work/headlesswp/headlesswp/public';

const primaryColor = 0x2563ebff;

async function createIcon(width, height, filename) {
  const image = new Jimp({ width, height, color: primaryColor });
  await image.write(path.join(PUBLIC_DIR, filename));
  console.log(`Created ${filename} (${width}x${height})`);
}

async function createOgImage() {
  const width = 1200;
  const height = 630;
  const image = new Jimp({ width, height, color: primaryColor });
  await image.write(path.join(PUBLIC_DIR, 'og-image.jpg'));
  console.log('Created og-image.jpg (1200x630)');
}

async function main() {
  await createIcon(192, 192, 'icon-192.png');
  await createIcon(512, 512, 'icon-512.png');
  await createIcon(180, 180, 'apple-touch-icon.png');
  await createIcon(512, 512, 'logo.png');
  await createOgImage();
  console.log('All icons created successfully!');
}

main().catch(console.error);
