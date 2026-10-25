import { observer } from 'mobx-react-lite'

import { DECISION_TYPES, DOCUMENT_REQUESTS, MIN_OFFER_AMOUNT, REJECTION_REASONS, TERM_OPTIONS_IN_MONTHS } from '@/entities/staff-application'
import { calculateAnnuityPayment, formatMoney, formatMonths, formatPercent } from '@/shared/lib'
import { Checkbox, KeyValueList, SelectField, TextField } from '@/shared/ui'

import type { DecisionFormStore } from '../../model/decision-form-store'
import styles from './DecisionFields.module.css'

const TERM_SELECT_OPTIONS = TERM_OPTIONS_IN_MONTHS.map((months) => ({
  value: String(months),
  label: formatMonths(months),
}))
const REASON_SELECT_OPTIONS = REJECTION_REASONS.map((reason) => ({
  value: reason,
  label: reason,
}))
const PAYMENT_PLACEHOLDER = '—'

interface DecisionFieldsProps {
  store: DecisionFormStore
}

/** The part of the form that depends on the chosen answer: the terms, the documents or the reason. */
export const DecisionFields = observer(function DecisionFields({ store }: DecisionFieldsProps) {
  const { application } = store

  if (store.type === DECISION_TYPES.approve) {
    const rate = application.scoring?.rate ?? 0
    return (
      <div className={styles.summary}>
        <KeyValueList
          items={[
            { label: 'Сумма', value: formatMoney(application.amount) },
            { label: 'Срок', value: formatMonths(application.termInMonths) },
            { label: 'Ставка', value: formatPercent(rate) },
            {
              label: 'Платёж',
              value: formatMoney(calculateAnnuityPayment(application.amount, rate, application.termInMonths)),
            },
          ]}
        />
      </div>
    )
  }

  if (store.type === DECISION_TYPES.offer) {
    return (
      <>
        <TextField
          label="Сумма"
          suffix="₽"
          inputMode="numeric"
          hasDigitMask
          value={store.amountText}
          onChange={(value) => store.setAmount(value)}
          onBlur={() => store.normalizeAmount()}
        />
        <div className={styles.pair}>
          <SelectField
            label="Срок"
            value={String(store.termInMonths)}
            options={TERM_SELECT_OPTIONS}
            onChange={(value) => store.setTerm(Number(value))}
          />
          <TextField label="Ставка" suffix="%" inputMode="decimal" value={store.rateText} onChange={(value) => store.setRate(value)} />
        </div>
        <p className={store.invalidField === 'offer' ? styles.limitsInvalid : styles.limits}>
          Сумма не меньше {formatMoney(MIN_OFFER_AMOUNT)}, ставка больше 0 %, срок до 60 месяцев
        </p>
        <div className={styles.calc}>
          Платёж <b>{store.offerPayment === null ? PAYMENT_PLACEHOLDER : formatMoney(store.offerPayment)}</b>
        </div>
      </>
    )
  }

  if (store.type === DECISION_TYPES.clarify) {
    return (
      <div className={styles.documents}>
        {DOCUMENT_REQUESTS.map((document) => (
          <Checkbox
            key={document}
            size="compact"
            label={document}
            isChecked={store.documents.includes(document)}
            onChange={(isRequested) => store.toggleDocument(document, isRequested)}
          />
        ))}
      </div>
    )
  }

  return (
    <SelectField
      label="Причина отказа"
      value={store.reason}
      options={REASON_SELECT_OPTIONS}
      isInvalid={store.invalidField === 'reason'}
      onChange={(value) => store.setReason(value)}
    />
  )
})
