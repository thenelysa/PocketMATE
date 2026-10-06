export async function readDocument(file: File, progress: (message: string) => void) {
  if (file.size > 15 * 1024 * 1024) throw new Error('Choose a file smaller than 15 MB.');
  if (!['image/png','image/jpeg','image/webp','application/pdf'].includes(file.type)) throw new Error('Choose a PNG, JPEG, WebP, or PDF file.');
  let worker: Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>> | undefined;
  const recognize = async (source: File | HTMLCanvasElement) => {
    if (!worker) { const { createWorker } = await import('tesseract.js');worker = await createWorker('eng', 1, { workerPath:'/ocr/worker.min.js', corePath:'/ocr', logger: message => progress(`${message.status} ${Math.round((message.progress || 0)*100)}%`) }); }
    return (await worker.recognize(source)).data.text;
  };
  try {
    if (file.type !== 'application/pdf') return await recognize(file);
    progress('Reading PDF…');
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = '/ocr/pdf.worker.min.mjs';
    const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
    const document = await task.promise;
    try {
      if (document.numPages > 5) throw new Error('Choose a bill with five pages or fewer.');
      let text = '';
      for (let i = 1; i <= document.numPages; i++) {
        progress(`Reading page ${i} of ${document.numPages}…`);
        const page = await document.getPage(i), content = await page.getTextContent();
        let extracted = content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('');
        if (extracted.trim().length < 30) {
          const viewport = page.getViewport({ scale: 1.5 });
          if (viewport.width * viewport.height > 12000000) throw new Error('This PDF page is too large to scan. Upload a smaller image.');
          const canvas = window.document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;
          await page.render({ canvas, viewport }).promise;
          extracted = await recognize(canvas);
        }
        text += extracted + '\n';
      }
      return text;
    } finally { await task.destroy(); }
  } finally { await worker?.terminate(); }
}
