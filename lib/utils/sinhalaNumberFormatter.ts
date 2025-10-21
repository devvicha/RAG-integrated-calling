// Sinhala spoken number and currency converter
export function numberToSinhalaText(num: number): string {
  const units = [
    "", "එකයි", "දෙකයි", "තුනයි", "හතරයි", "පහයි", "හයයි", "හතයි", "අටයි", "නවයයි"
  ];

  if (num < 10) return units[num];

  // Simple chunking for demonstration — you can expand this to lakhs/millions
  const numStr = num.toString();
  const len = numStr.length;

  // Handle thousands
  if (len <= 4) {
    if (len === 4) {
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      return `දහස ${numberToSinhalaText(remainder)}`;
    }
    if (len === 3) {
      const hundreds = Math.floor(num / 100);
      const remainder = num % 100;
      return `සියය ${numberToSinhalaText(remainder)}`;
    }
    if (len === 2) {
      const tens = Math.floor(num / 10);
      const ones = num % 10;
      const tensMap = [
        "", "දහය", "විසි", "තිස්", "හලස්", "පනස්", "හැට", "හැත්තෑ", "අසූ", "අනූ"
      ];
      return `${tensMap[tens]} ${units[ones]}`.trim();
    }
  }

  // Handle large numbers roughly
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    return `මිලියන ${numberToSinhalaText(millions)} ${numberToSinhalaText(remainder)}`;
  }

  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    return `ලක්ෂ ${numberToSinhalaText(lakhs)} ${numberToSinhalaText(remainder)}`;
  }

  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return `${numberToSinhalaText(thousands)} දහස ${numberToSinhalaText(remainder)}`;
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
