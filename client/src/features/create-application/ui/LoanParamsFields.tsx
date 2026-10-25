import { observer } from 'mobx-react-lite'

import { CREDIT_GOALS } from '@/entities/application'
import { SelectField, TextField } from '@/shared/ui'
import { formatMonths } from '@/shared/lib'

import type { CreateApplicationFormStore } from '../model/create-application-form-store'

const GOAL_OPTIONS = CREDIT_GOALS.map(({ id, label }) => ({ value: id, label }))

interface LoanParamsFieldsProps {
  form: CreateApplicationFormStore
  isOnSurface?: boolean
}

/** The three fields that describe a loan request: goal, sum and term. */
export const LoanParamsFields = observer(function LoanParamsFields({ form, isOnSurface }: LoanParamsFieldsProps) {
  return (
    <>
      <SelectField
        label="Для чего нужны деньги"
        value={form.goal ?? ''}
        options={GOAL_OPTIONS}
        isOnSurface={isOnSurface}
        onChange={(value) => form.setGoal(value)}
      />
      <TextField
        label="Сумма"
        suffix="₽"
        inputMode="numeric"
    hasDigitMask
        value={form.sumText}
        isOnSurface={isOnSurface}
        onChange={(value) => form.setSum(value)}
        onBlur={() => form.normalizeSum()}
      />
      <SelectField
        label="Срок"
        value={String(form.termInMonths)}
        options={form.termOptions.map((months) => ({ value: String(months), label: formatMonths(months) }))}
        isOnSurface={isOnSurface}
        onChange={(value) => form.setTermInMonths(Number(value))}
      />
    </>
  )
})
