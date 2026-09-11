/* Run with: npm run test:unit */
import assert from 'node:assert/strict';
import { money, ordinal } from './format';

assert.equal(money(84.2), '$84.20');
assert.equal(money('1250.5'), '$1250.50');
assert.equal(money(0), '$0.00');

for (const [day, expected] of Object.entries({
  1: '1st', 2: '2nd', 3: '3rd', 4: '4th',
  11: '11th', 12: '12th', 13: '13th',   // the exceptions
  21: '21st', 22: '22nd', 23: '23rd', 31: '31st',
})) {
  assert.equal(ordinal(Number(day)), expected, `ordinal(${day})`);
}

console.log('format: ok');
