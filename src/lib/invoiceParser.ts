// Invoice PDF Parser - Simple approach with fallback to manual

export interface ParsedInvoice {
  name: string;
  provider: string;
  amount: number;
  dueDate: string;
  invoiceNumber?: string;
  notes?: string;
}

// Parse amount string to number
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/[^0-9.,]/g, '').replace(/,/g, '');
  return parseFloat(cleaned) || 0;
}

// Parse date string to ISO format
function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date.toISOString();

    const parts = dateStr.match(/([A-Za-z]+)\s+(\d+),?\s*(\d+)/);
    if (parts) {
      const monthStr = parts[1].substring(0, 3);
      const day = parseInt(parts[2]);
      const year = parseInt(parts[3] || new Date().getFullYear().toString());
      const month = new Date(`${monthStr} 1, 2000`).getMonth();
      return new Date(year, month, day).toISOString();
    }
    return new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// Extract text from PDF
export async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);

        // Dynamic import of pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist');

        // Configure worker
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

        const pdf = await pdfjsLib.getDocument({
          data: typedarray,
        }).promise;

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();

          const pageText = content.items
            .map((item: any) => item.str || '')
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          fullText += pageText + '\n';
        }

        resolve(fullText);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Parse invoice text
function parseInvoice(text: string): ParsedInvoice | null {
  const lines = text.split('\n').filter(l => l.trim());
  const fullText = text.replace(/\s+/g, ' ');

  let name = 'Invoice';
  let provider = 'Unknown';
  let amount = 0;
  let dueDate = new Date().toISOString();
  let invoiceNumber = '';

  // Invoice number patterns
  const invMatch = fullText.match(/(?:Invoice\s*(?:number|#|No\.?)?:?\s*)([A-Z0-9-]+)/i);
  if (invMatch) invoiceNumber = invMatch[1];

  // Date patterns - look for date due
  const dateMatch = fullText.match(/Date\s+(?:due|of\s+issue)[:\s]+([A-Za-z]+[\s]+\d+,?\s*\d{4})/i);
  if (dateMatch) dueDate = parseDate(dateMatch[1]);

  // Amount patterns - look for amount due
  const amountMatch = fullText.match(/(?:Total|Amount\s+(?:due|to\s+pay))[:\s]*\$?\s*([\d,]+\.?\d*)\s*(?:USD)?/i);
  if (amountMatch) amount = parseAmount(amountMatch[1]);

  // Provider/Bill to
  const billToMatch = fullText.match(/Bill\s+to[:\s]+([A-Za-z][^\n]+?)(?:\n|$)/i);
  if (billToMatch) provider = billToMatch[1].trim().substring(0, 50);

  // Description - look for first substantial line after headers
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 5 &&
        trimmed.length < 80 &&
        /^[A-Za-z]/.test(trimmed) &&
        !trimmed.includes('$') &&
        !trimmed.includes('http') &&
        !trimmed.includes('@') &&
        !trimmed.includes('Invoice') &&
        !trimmed.includes('Bill to') &&
        !trimmed.includes('Date')) {
      name = trimmed.substring(0, 50);
      break;
    }
  }

  if (amount > 0) {
    return { name, provider, amount, dueDate, invoiceNumber };
  }

  return null;
}

// Main parse function
export async function parseInvoicePDF(file: File): Promise<ParsedInvoice | null> {
  try {
    console.log('Parsing PDF:', file.name, file.size, 'bytes');

    const text = await extractTextFromPDF(file);
    console.log('Extracted text length:', text.length);
    console.log('Sample text:', text.substring(0, 300));

    if (!text || text.length < 10) {
      console.error('Failed to extract text from PDF');
      return null;
    }

    const parsed = parseInvoice(text);

    if (parsed) {
      console.log('Successfully parsed:', parsed);
    } else {
      console.error('Failed to parse invoice from text');
    }

    return parsed;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return null;
  }
}
