/**
 * NISA (Nippon Individual Savings Account) Constants
 * Japanese tax-advantaged investment account system
 */

export const NISA_LIMITS = {
  // つみたて投資枠 (Tsumitate Investment Allowance)
  TSUMITATE_ANNUAL: 1_200_000, // ¥1,200,000 per year
  // 成長投資枠 (Growth Investment Allowance)
  GROWTH_ANNUAL: 2_400_000, // ¥2,400,000 per year
  // Combined annual limit
  COMBINED_ANNUAL: 3_600_000, // ¥3,600,000 per year
  // 非課税保有限度額 (Tax-exempt holding limit)
  LIFETIME_LIMIT: 18_000_000, // ¥18,000,000 total
  // Growth investment portion of lifetime limit
  GROWTH_LIFETIME_LIMIT: 12_000_000, // ¥12,000,000 for growth
} as const;

export const NISA_FEATURES = [
  {
    id: 'unlimited',
    icon: 'infinity',
  },
  {
    id: 'reusable',
    icon: 'refresh',
  },
  {
    id: 'combined',
    icon: 'layers',
  },
] as const;

export const NISA_ELIGIBLE_PRODUCTS = {
  TSUMITATE: [
    'fsa_compliant_funds',
    'low_cost_funds',
  ],
  GROWTH: [
    'domestic_stocks',
    'foreign_stocks',
    'etfs',
    'reits',
    'investment_trusts',
  ],
} as const;
