import { format, isValid, parse } from 'date-fns';
import type { StatementRow } from './types';
export function parseBillText(text: string) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const provider = (lines.find(line => /[a-z]{3}/i.test(line) && !/invoice|statement|bill\s*no/i.test(line)) || '').slice(0,100);
  const amountLine = lines.find(line => /(?:total|amount|balance)\s*(?:amount\s*)?(?:due|payable)/i.test(line)) || lines.find(line => /grand total|^total\b/i.test(line)) || '';
  const amountMatch = amountLine.match(/(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?(?!\d)/g);
  const amount = amountMatch?.at(-1)?.replaceAll(',','') || '';
  const dueLine = lines.find(line => /due\s*(?:date|on)|pay\s*by/i.test(line)) || '';
  const iso = dueLine.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  let dueDate = iso && isValid(new Date(iso)) ? iso : '';
  if (!dueDate) {
    const named = dueLine.match(/[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}/)?.[0];
    if (named) for (const pattern of ['MMMM d, yyyy','MMM d, yyyy','MMMM d yyyy','MMM d yyyy']) {
      const date = parse(named, pattern, new Date());
      if (isValid(date)) { dueDate = format(date,'yyyy-MM-dd');break; }
    }
  }
  return { provider, name: provider ? `${provider} bill` : '', amount, dueDate };
}

export function parseStatement(csv: string): StatementRow[] {
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (char === '"') { if (quoted && csv[i+1] === '"') { field += '"';i++; } else quoted = !quoted; }
    else if (char === ',' && !quoted) { row.push(field.trim());field=''; }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && csv[i+1] === '\n') i++; row.push(field.trim());if(row.some(Boolean)) rows.push(row);row=[];field=''; }
    else field += char;
  }
  if (quoted) throw new Error('A quoted field is unfinished. Check your CSV file.');
  row.push(field.trim());if(row.some(Boolean)) rows.push(row);
  const headers = rows.shift()?.map(value => value.replace(/^\uFEFF/,'').toLowerCase()) || [];
  const di = headers.indexOf('date'), mi = headers.findIndex(value => ['merchant','description'].includes(value)), ai = headers.indexOf('amount');
  if (di < 0 || mi < 0 || ai < 0) throw new Error('Use columns named date, merchant (or description), and amount. Dates must be YYYY-MM-DD.');
  if (rows.length > 5000) throw new Error('Import up to 5,000 rows at a time.');
  const occurrences = new Map<string, number>();
  return rows.map((values,index) => {
    const date = values[di], merchant = values[mi], raw = values[ai]?.replaceAll(',','');
    const amount = Number(raw);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !isValid(parse(date,'yyyy-MM-dd',new Date())) || !merchant || merchant.length > 200 || !raw || !Number.isFinite(amount) || Math.abs(amount) > 999999999) throw new Error(`Check row ${index+2}: use a valid date, merchant, and numeric amount.`);
    const key = `${date}|${merchant.toLowerCase()}|${Math.round(amount*100)}`;
    const occurrence = (occurrences.get(key) || 0) + 1;occurrences.set(key,occurrence);
    // Stable fingerprint preserves identical same-day charges while deduplicating re-imports.
    return { id: JSON.stringify([date,merchant.toLowerCase(),Math.round(amount*100),occurrence]), date, merchant, amount: Math.round(amount*100)/100 };
  });
}
