const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '.next');

if (fs.existsSync(src)) {
  const destinations = [
    path.join(__dirname, 'dist'),
    path.join(__dirname, 'artifacts', 'mahathi-tailor-shop', 'dist'),
    path.join(__dirname, '..', '..', 'artifacts', 'mahathi-tailor-shop', 'dist'),
  ];

  for (const dest of destinations) {
    try {
      fs.mkdirSync(dest, { recursive: true });
      fs.cpSync(src, dest, { recursive: true });
    } catch (err) {
      // Ignore if cannot write
    }
  }

  console.log('Postbuild: Mirrored Next.js build output across all target directories for Vercel.');
}
