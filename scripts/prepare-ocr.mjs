import { mkdir, copyFile, readdir } from 'node:fs/promises';
await mkdir('public/ocr', { recursive:true });
await copyFile('node_modules/tesseract.js/dist/worker.min.js','public/ocr/worker.min.js');
await copyFile('node_modules/pdfjs-dist/build/pdf.worker.min.mjs','public/ocr/pdf.worker.min.mjs');
for (const name of await readdir('node_modules/tesseract.js-core')) {
  if (name.endsWith('.wasm.js') || name.endsWith('.wasm')) await copyFile(`node_modules/tesseract.js-core/${name}`,`public/ocr/${name}`);
}
