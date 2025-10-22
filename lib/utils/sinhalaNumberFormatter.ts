// Sinhala spoken number and currency converter
export function numberToSinhalaText(num: number): string {
  if (num === 0) return "බිංදුවයි";
  
  const units = [
    "", "එකයි", "දෙකයි", "තුනයි", "හතරයි", "පහයි", "හයයි", "හතයි", "අටයි", "නවයයි"
  ];
  
  const tensMap = [
    "", "දහයි", "විස්සයි", "තිස්යි", "හතලිහයි", "පනහයි", "හැටයි", "හැත්තෑවයි", "අසූවයි", "අනූවයි"
  ];

  // Round to nearest integer
  num = Math.round(num);

  // Handle single digits
  if (num < 10) return units[num];

  // Handle 10-99
  if (num < 100) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    if (ones === 0) return tensMap[tens];
    // For compound numbers like 21 = විස්සයි එකයි
    return `${tensMap[tens]} ${units[ones]}`.trim();
  }

  // Handle 100-999 (hundreds)
  if (num < 1000) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    const hundredNames = ["", "එකසීය", "දෙසීය", "තුන්සීය", "හාරසීය", "පන්සීය", "හයසීය", "හත්සීය", "අටසීය", "නවසීය"];
    if (remainder === 0) return `${hundredNames[hundreds]}යි`;
    return `${hundredNames[hundreds]} ${numberToSinhalaText(remainder)}`.trim();
  }

  // Handle 1,000-9,999 (thousands)
  if (num < 10000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    const thousandWord = thousands === 1 ? "දහසයි" : `${units[thousands].replace("යි", "")} දහසයි`;
    if (remainder === 0) return thousandWord;
    return `${thousandWord} ${numberToSinhalaText(remainder)}`.trim();
  }

  // Handle 10,000-99,999 (ten thousands - දහදාහ)
  if (num < 100000) {
    const tenThousands = Math.floor(num / 10000);
    const remainder = num % 10000;
    let tenThousandWord;
    
    if (tenThousands === 1) {
      tenThousandWord = "දහදාහයි";
    } else if (tenThousands < 10) {
      tenThousandWord = `${units[tenThousands].replace("යි", "")} දහදාහයි`;
    } else {
      // 20,000 = විස්ස දහසයි, 30,000 = තිස් දහසයි
      const tens = Math.floor(tenThousands / 10);
      const ones = tenThousands % 10;
      if (ones === 0) {
        tenThousandWord = `${tensMap[tens].replace("යි", "")} දහසයි`;
      } else {
        tenThousandWord = `${tensMap[tens].replace("යි", "")} ${units[ones].replace("යි", "")} දහසයි`;
      }
    }
    
    if (remainder === 0) return tenThousandWord;
    return `${tenThousandWord} ${numberToSinhalaText(remainder)}`.trim();
  }

  // Handle 100,000-999,999 (lakhs)
  if (num < 1000000) {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    const lakhNames = ["", "එක්", "දෙ", "තුන්", "හාර", "පන්", "හය", "හත්", "අට", "නව"];
    const lakhWord = lakhs === 1 ? "ලක්ෂයයි" : `${lakhNames[lakhs]} ලක්ෂයයි`;
    
    if (remainder === 0) return lakhWord;
    return `${lakhWord} ${numberToSinhalaText(remainder)}`.trim();
  }

  // Handle 1,000,000-9,999,999 (millions)
  if (num < 10000000) {
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    const millionNames = ["", "එක්", "දෙ", "තුන්", "හාර", "පන්", "හය", "හත්", "අට", "නව"];
    const millionWord = millions === 1 ? "මිලියනයයි" : `${millionNames[millions]} මිලියනයයි`;
    
    if (remainder === 0) return millionWord;
    return `${millionWord} ${numberToSinhalaText(remainder)}`.trim();
  }

  // Handle very large numbers (10M+)
  if (num >= 10000000) {
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    const millionWord = `${numberToSinhalaText(millions).replace("යි", "")} මිලියනයයි`;
    
    if (remainder === 0) return millionWord;
    return `${millionWord} ${numberToSinhalaText(remainder)}`.trim();
  }

  return num.toString(); // fallback
}

// Currency formatting helper
export function rupeesToSinhala(amount: number): string {
  const rounded = Math.round(amount);
  return `රුපියල් ${numberToSinhalaText(rounded)}`;
}

// Percentage formatter
export function percentToSinhala(percent: number): string {
  return `සියයට ${numberToSinhalaText(percent)}`;
}
