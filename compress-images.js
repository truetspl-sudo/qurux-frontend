const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function compressDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      await compressDir(fullPath);
    } else if (/\.(jpg|jpeg|png)$/i.test(file.name)) {
      const stat = fs.statSync(fullPath);
      if (stat.size > 100000) { // > 100KB
        try {
          const outPath = fullPath.replace(/\.(jpg|jpeg|png)$/i, '.jpg');
          await sharp(fullPath)
            .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 65 })
            .toFile(outPath + '.tmp');
          fs.renameSync(outPath + '.tmp', outPath);
          if (outPath !== fullPath && fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
          const newSize = fs.statSync(outPath).size;
          console.log(`Compressed: ${path.relative(process.cwd(), fullPath)} (${(stat.size/1024).toFixed(0)}KB → ${(newSize/1024).toFixed(0)}KB)`);
        } catch (e) {
          console.log(`Skip: ${file.name} - ${e.message}`);
        }
      }
    }
  }
}

(async () => {
  console.log('Compressing images in public/...');
  await compressDir('public');
  console.log('Done!');
})();
