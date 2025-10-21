import { numberToSinhalaText, rupeesToSinhala, percentToSinhala } from './sinhalaNumberFormatter';

const testCases = [
  { input: 2, expected: 'දහස දෙකයි' },
  { input: 100000, expected: 'ලක්ෂ එකයි' },
  { input: 1500000, expected: 'මිලියන එකයි ලක්ෂ පනස්' },
  { input: 1.5, expected: 'එකයි' },
  { input: 0.25, expected: 'අටයි' },
];

const currencyTestCases = [
  { input: 2, expected: 'රුපියල් දෙකයි' },
  { input: 100000, expected: 'රුපියල් ලක්ෂ එකයි' },
];

const percentageTestCases = [
  { input: 12, expected: 'සියයට දෙකයි' },
  { input: 0.25, expected: 'සියයට අටයි' },
];

console.log('Testing numberToSinhalaText:');
testCases.forEach(({ input, expected }) => {
  const output = numberToSinhalaText(input);
  console.log(`Input: ${input}, Output: ${output}, Expected: ${expected}, Pass: ${output === expected}`);
});

console.log('Testing rupeesToSinhala:');
currencyTestCases.forEach(({ input, expected }) => {
  const output = rupeesToSinhala(input);
  console.log(`Input: ${input}, Output: ${output}, Expected: ${expected}, Pass: ${output === expected}`);
});

console.log('Testing percentToSinhala:');
percentageTestCases.forEach(({ input, expected }) => {
  const output = percentToSinhala(input);
  console.log(`Input: ${input}, Output: ${output}, Expected: ${expected}, Pass: ${output === expected}`);
});
