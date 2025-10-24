// Generate PWA icons using jimp
import { Jimp } from 'jimp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function generateIcon(size) {
  // Create a new image with gradient-like background
  const image = new Jimp({ width: size, height: size, color: 0x3b82f6ff });

  // Create a gradient effect by darkening bottom half
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const darkening = Math.floor((y / size) * 40);
      const r = 0x3b - darkening;
      const g = 0x82 - darkening;
      const b = 0xf6 - darkening;
      const color = (r << 24) | (g << 16) | (b << 8) | 0xff;
      image.setPixelColor(color, x, y);
    }
  }

  // Draw a simple checkmark
  const lineWidth = Math.max(2, Math.floor(size / 20));
  const scale = size / 100;

  // Draw checkmark using rectangles to simulate lines
  // First line of checkmark (going down-right)
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(25 * scale + i * 0.5);
    const y = Math.floor(50 * scale + i * 0.75);
    for (let dx = 0; dx < lineWidth; dx++) {
      for (let dy = 0; dy < lineWidth; dy++) {
        if (x + dx < size && y + dy < size) {
          image.setPixelColor(0xffffffff, x + dx, y + dy);
        }
      }
    }
  }

  // Second line of checkmark (going up-right)
  for (let i = 0; i < 50; i++) {
    const x = Math.floor(40 * scale + i * 0.7);
    const y = Math.floor(65 * scale - i * 0.7);
    for (let dx = 0; dx < lineWidth; dx++) {
      for (let dy = 0; dy < lineWidth; dy++) {
        if (x + dx < size && y + dy < size && x + dx >= 0 && y + dy >= 0) {
          image.setPixelColor(0xffffffff, x + dx, y + dy);
        }
      }
    }
  }

  // Round corners
  const cornerRadius = Math.floor(size * 0.15);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Check if pixel is in corner regions
      const inTopLeft = x < cornerRadius && y < cornerRadius;
      const inTopRight = x >= size - cornerRadius && y < cornerRadius;
      const inBottomLeft = x < cornerRadius && y >= size - cornerRadius;
      const inBottomRight = x >= size - cornerRadius && y >= size - cornerRadius;

      if (inTopLeft || inTopRight || inBottomLeft || inBottomRight) {
        let cx, cy;
        if (inTopLeft) { cx = cornerRadius; cy = cornerRadius; }
        else if (inTopRight) { cx = size - cornerRadius; cy = cornerRadius; }
        else if (inBottomLeft) { cx = cornerRadius; cy = size - cornerRadius; }
        else { cx = size - cornerRadius; cy = size - cornerRadius; }

        const distance = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
        if (distance > cornerRadius) {
          image.setPixelColor(0x00000000, x, y); // Transparent
        }
      }
    }
  }

  const filename = join(__dirname, 'public', `icon-${size}.png`);
  await image.write(filename);
  console.log(`Generated ${filename}`);
}

// Generate both sizes
await generateIcon(192);
await generateIcon(512);
console.log('Icons generated successfully!');
