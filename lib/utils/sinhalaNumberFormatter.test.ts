// Removed import; using local implementations below.

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

function calculateEmi(args: { loan_amount: number; annual_rate_percent: number; tenure_months: number }) {
  const { loan_amount, annual_rate_percent, tenure_months } = args;
  
  // Validate inputs
  if (loan_amount < 50000) {
    return {
      result: `සමාවෙන්න, සම්පත් බැංකුව රුපියල් 50,000 ට වඩා අඩු ණය ඉල්ලීම් සලකා බලන්නේ නැහැ.`,
      sources: [],
      grounding_chunks: []
    };
  }

  // Calculate EMI using the standard formula
  const monthlyRate = annual_rate_percent / (12 * 100);
  const emi = monthlyRate === 0 
    ? loan_amount / tenure_months 
    : (loan_amount * monthlyRate * Math.pow(1 + monthlyRate, tenure_months)) / 
      (Math.pow(1 + monthlyRate, tenure_months) - 1);
  
  const totalPayment = emi * tenure_months;
  const totalInterest = totalPayment - loan_amount;

  // Format amounts in Sinhala
  const emiSinhala = rupeesToSinhala(Math.round(emi));
  const totalPaymentSinhala = rupeesToSinhala(Math.round(totalPayment));
  const totalInterestSinhala = rupeesToSinhala(Math.round(totalInterest));
  const loanAmountSinhala = rupeesToSinhala(loan_amount);
  const rateSinhala = percentToSinhala(annual_rate_percent);

  return {
    result: `හරි, ඔයාගේ ${loanAmountSinhala} ණය මුදලට, ${rateSinhala} වාර්ෂික පොලී අනුපාතයකින්, ${numberToSinhalaText(tenure_months)} මාස කාලයකට, මාසික වාරිකය ${emiSinhala} විතර වෙනවා. මුළු ගෙවීම ${totalPaymentSinhala}, මුළු පොලිය ${totalInterestSinhala}. මේ ගණන් දළ ඇස්තමේන්තු විදියට සලකන්න.`,
    sources: ['EMI Calculator'],
    grounding_chunks: []
  };
}

export function numberToSinhalaText(num: number): string {
  if (num === 0) return "බිංදුව";
  
  const units = ["", "එක", "දෙක", "තුන", "හතර", "පහ", "හය", "හත", "අට", "නවය"];
  const teens = ["දහය", "එකොළහ", "දොළහ", "තෙරළහ", "හතරළහ", "පහළව", "දහසය", "දාහත", "දහඅට", "දහනවය"];
  const tens = ["", "දහය", "විසි", "තිස්", "හතළිස්", "පනස්", "හැට", "හැත්තෑ", "අසූ", "අනූ"];

  if (num < 10) return units[num];
  if (num >= 10 && num < 20) return teens[num - 10];
  
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    return unit === 0 ? tens[ten] : `${tens[ten]} ${units[unit]}`;
  }

  if (num < 1000) {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    const hundredText = hundred === 1 ? "එක්සියය" : `${units[hundred]} සියය`;
    return remainder === 0 ? hundredText : `${hundredText} ${numberToSinhalaText(remainder)}`;
  }

  if (num < 100000) {
    const thousand = Math.floor(num / 1000);
    const remainder = num % 1000;
    const thousandText = thousand === 1 ? "දහස" : `${numberToSinhalaText(thousand)} දහස`;
    return remainder === 0 ? thousandText : `${thousandText} ${numberToSinhalaText(remainder)}`;
  }

  if (num < 10000000) {
    const lakh = Math.floor(num / 100000);
    const remainder = num % 100000;
    const lakhText = lakh === 1 ? "ලක්ෂය" : `${numberToSinhalaText(lakh)} ලක්ෂ`;
    return remainder === 0 ? lakhText : `${lakhText} ${numberToSinhalaText(remainder)}`;
  }

  if (num < 1000000000) {
    const million = Math.floor(num / 10000000);
    const remainder = num % 10000000;
    const millionText = million === 1 ? "කෝටිය" : `${numberToSinhalaText(million)} කෝටි`;
    return remainder === 0 ? millionText : `${millionText} ${numberToSinhalaText(remainder)}`;
  }

  return num.toString(); // fallback for very large numbers
}

export function rupeesToSinhala(amount: number): string {
  return `රුපියල් ${numberToSinhalaText(Math.round(amount))}`;
}

export function percentToSinhala(percent: number): string {
  return `සියයට ${numberToSinhalaText(percent)}`;
}
