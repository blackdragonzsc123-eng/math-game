import fs from 'fs';
import zlib from 'zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const toCrc = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  buf.writeUInt32BE(crc32(toCrc), 8 + len);
  return buf;
}

function generatePng(width, height, isMaskable = false) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk: width(4), height(4), bitDepth(1)=8, colorType(1)=6(RGBA), compression(1)=0, filter(1)=0, interlace(1)=0
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines: each row has 1 filter byte (0) + width * 4 bytes
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowBytes);

  const cx = width / 2;
  const cy = height / 2;
  const rBrain = width * (isMaskable ? 0.32 : 0.38);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient: indigo #4f46e5 to purple #7c3aed to cyan #06b6d4
      const t = (x + y) / (width + height);
      let r = Math.floor(79 * (1 - t) + 6 * t);
      let g = Math.floor(70 * (1 - t) + 182 * t);
      let b = Math.floor(229 * (1 - t) + 212 * t);
      let a = 255;

      // Stylized brain circle highlight
      if (dist < rBrain) {
        const brainFactor = 1 - (dist / rBrain);
        r = Math.min(255, Math.floor(r + 140 * brainFactor));
        g = Math.min(255, Math.floor(g + 140 * brainFactor));
        b = 255;
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Generate files
fs.writeFileSync('public/pwa-192x192.png', generatePng(192, 192, false));
fs.writeFileSync('public/pwa-512x512.png', generatePng(512, 512, false));
fs.writeFileSync('public/pwa-maskable-512x512.png', generatePng(512, 512, true));
fs.writeFileSync('public/apple-touch-icon.png', generatePng(180, 180, false));
fs.writeFileSync('public/favicon.ico', generatePng(32, 32, false));

console.log('PWA icons created successfully');
