import { addDays, format, isValid, parse } from 'date-fns';
export function parseQuickBill(text:string, today=new Date()) {
  const match=text.trim().match(/^(?:add\s+)?(.+?)\s+([\d,]+(?:\.\d{1,2})?)\s+(?:due\s+)?(today|tomorrow|\d{4}-\d{2}-\d{2})$/i);
  if(!match)return null;
  const amount=Number(match[2].replaceAll(',',''));
  const raw=match[3].toLowerCase(), date=raw==='today'?today:raw==='tomorrow'?addDays(today,1):parse(raw,'yyyy-MM-dd',today);
  if(!amount||amount<0||amount>999999999||!isValid(date))return null;
  return {name:match[1],amount,dueDate:format(date,'yyyy-MM-dd')};
}
