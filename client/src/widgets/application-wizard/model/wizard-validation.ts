import { isCompletePhone, parseDigits } from '@/shared/lib'

import type { WizardForm } from './wizard-form'

export type FormField = 'phone' | 'email' | 'revenue' | 'otherLoans' | 'otherLoanPayments' | 'collateralType' | 'collateralValue'

export interface ValidationIssue {
  field: FormField
  message: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Problems of the data step in the order the fields appear on the screen. */
export function validateWizardForm(form: WizardForm, isSecured: boolean): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!isCompletePhone(form.phone)) {
    issues.push({ field: 'phone', message: 'Введите номер полностью, например +7 916 482-17-35' })
  }
  if (!EMAIL_PATTERN.test(form.email.trim())) {
    issues.push({ field: 'email', message: 'Проверьте адрес, например name@company.ru' })
  }
  if (parseDigits(form.revenue) <= 0) issues.push({ field: 'revenue', message: 'Укажите выручку за 12 месяцев' })
  if (form.otherLoans === null) {
    issues.push({ field: 'otherLoans', message: 'Выберите вариант' })
  } else if (form.otherLoans === 'yes' && parseDigits(form.otherLoanPayments) <= 0) {
    issues.push({ field: 'otherLoanPayments', message: 'Укажите сумму платежей в месяц' })
  }
  if (isSecured) {
    if (form.collateralType === null) issues.push({ field: 'collateralType', message: 'Выберите тип залога' })
    if (parseDigits(form.collateralValue) <= 0) issues.push({ field: 'collateralValue', message: 'Укажите примерную стоимость' })
  }
  return issues
}
