/**
 * MOCK: the bank products have no description and decision time yet (docs/backend-requirements.md, 2.3.1 and 2.3.2).
 * Keyed by the product id of the external-systems mock bank.
 */
interface ProductExtras {
  description: string
  decisionTime: string
}

const EXTRAS_BY_PRODUCT_ID: Record<number, ProductExtras> = {
  1: { description: 'Залог недвижимости или техники. Ниже ставка, больше сумма', decisionTime: 'До 5 дней' },
  2: { description: 'Без залога и подтверждения целей', decisionTime: 'За 1 день' },
  3: { description: 'Для индивидуальных предпринимателей, небольшая сумма', decisionTime: 'До 2 дней' },
  4: { description: 'Программа поддержки МСП, без залога', decisionTime: 'До 3 дней' },
}

export function getMockProductExtras(productId: number): ProductExtras | null {
  return EXTRAS_BY_PRODUCT_ID[productId] ?? null
}
