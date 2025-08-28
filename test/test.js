import sharp from "sharp";
import fs from "fs";

const src = process.argv[2];
if (!src || !fs.existsSync(src)) {
  console.error("Usage: node mosaic8x8.js path/to/image");
  process.exit(1);
}

// Your custom palette
const paletteList = [
  'rgb(255, 1, 0)', 'rgb(255, 1, 0)', 'rgb(255, 145, 140)', 'rgb(235, 123, 12)',
  'rgb(254, 212, 156)', 'rgb(232, 206, 93)', 'rgb(234, 239, 175)', 'rgb(255, 224, 92)',
  'rgb(243, 243, 6)', 'rgb(205, 255, 3)', 'rgb(170, 241, 29)', 'rgb(4, 255, 137)',
  'rgb(31, 206, 38)', 'rgb(193, 249, 205)', 'rgb(3, 255, 163)', 'rgb(145, 255, 232)',
  'rgb(24, 217, 217)', 'rgb(33, 167, 213)', 'rgb(75, 78, 255)', 'rgb(163, 121, 255)',
  'rgb(156, 48, 237)', 'rgb(205, 180, 255)', 'rgb(224, 57, 224)', 'rgb(255, 121, 255)',
  'rgb(255, 0, 163)', 'rgb(255, 68, 133)', 'rgb(255, 255, 255)', 'rgb(121, 121, 121)',
  'rgb(79, 79, 79)',
];

const palette = paletteList.map(c => {
  const [r, g, b] = c.match(/\d+/g).map(Number);
  return { str: c, rgb: [r, g, b] };
});

const nearestColor = (r, g, b) => {
  let best = 1e9, choice = palette[0];
  for (const p of palette) {
    const [pr, pg, pb] = p.rgb;
    const dr = r - pr, dg = g - pg, db = b - pb;
    const d = dr*dr + dg*dg + db*db;
    if (d < best) { best = d; choice = p; }
  }
  return choice;
};

// Apply Floyd–Steinberg dithering in-place
const dither = (data, width, height) => {
  const outColors = [];

  const idx = (x,y) => (y*width + x)*3;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x,y);
      let r = data[i], g = data[i+1], b = data[i+2];

      const nearest = nearestColor(r,g,b);
      const [nr, ng, nb] = nearest.rgb;

      outColors.push(nearest.str);

      // error
      const errR = r - nr, errG = g - ng, errB = b - nb;

      // distribute error
      const spread = (dx, dy, factor) => {
        const xi = x + dx, yi = y + dy;
        if (xi >= 0 && xi < width && yi >= 0 && yi < height) {
          const j = idx(xi, yi);
          data[j]   = Math.max(0, Math.min(255, data[j]   + errR*factor));
          data[j+1] = Math.max(0, Math.min(255, data[j+1] + errG*factor));
          data[j+2] = Math.max(0, Math.min(255, data[j+2] + errB*factor));
        }
      };

      spread(1, 0, 7/16);
      spread(-1, 1, 3/16);
      spread(0, 1, 5/16);
      spread(1, 1, 1/16);

      // replace current with nearest
      data[i] = nr; data[i+1] = ng; data[i+2] = nb;
    }
  }

  return outColors;
};

const main = async () => {
  const { data, info } = await sharp(src)
    .resize(8, 8, { fit: "fill", kernel: "nearest" })
    .modulate({ saturation: 1.4, brightness: 1.1 }) // boost visibility
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = dither(data, info.width, info.height);

  // log as flat array
  console.log("[" + out.map(c => `'${c}'`).join(",") + "]");

  // generate preview export.png
  const scale = 32;
  const imgW = info.width * scale, imgH = info.height * scale;
  const exportData = Buffer.alloc(imgW * imgH * 3);

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = y*info.width + x;
      const [r,g,b] = palette.find(p => p.str === out[idx]).rgb;
      for (let yy = 0; yy < scale; yy++) {
        for (let xx = 0; xx < scale; xx++) {
          const px = (y*scale + yy) * imgW + (x*scale + xx);
          exportData[px*3]   = r;
          exportData[px*3+1] = g;
          exportData[px*3+2] = b;
        }
      }
    }
  }

  await sharp(exportData, {
    raw: { width: imgW, height: imgH, channels: 3 }
  }).png().toFile("export.png");

  console.log("Saved export.png (preview).");
};

main().catch(err => { console.error(err); process.exit(1); });
