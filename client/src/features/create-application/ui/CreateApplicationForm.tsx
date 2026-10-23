import { Button } from '@alfalab/core-components/button'
import { Input } from '@alfalab/core-components/input'
import { Select } from '@alfalab/core-components/select'
import { Typography } from '@alfalab/core-components/typography'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { CREDIT_TIME_UNIT_LABELS, CREDIT_TIME_UNITS } from '@/entities/application'
import type { Application, CreditTimeUnit } from '@/entities/application'

import { CreateApplicationFormStore } from '../model/create-application-form-store'
import styles from './CreateApplicationForm.module.css'

interface CreateApplicationFormProps {
  /** The form is bound to one organization: remount it (`key`) when the organization changes. */
  organizationId: number
  onCreated: (application: Application) => void
}

const TERM_UNIT_OPTIONS = Object.values(CREDIT_TIME_UNITS).map((unit) => ({
  key: unit,
  content: CREDIT_TIME_UNIT_LABELS[unit],
}))

function isCreditTimeUnit(value: string): value is CreditTimeUnit {
  return Object.values<string>(CREDIT_TIME_UNITS).includes(value)
}

export const CreateApplicationForm = observer(function CreateApplicationForm({
  organizationId,
  onCreated,
}: CreateApplicationFormProps) {
  const [form] = useState(() => new CreateApplicationFormStore(organizationId))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const application = await form.submit()
    if (application) onCreated(application)
  }

  return (
    <form className={styles.form} onSubmit={(event) => void handleSubmit(event)} noValidate>
      <Input
        label="Сумма, ₽"
        block
        inputMode="numeric"
        value={form.sum}
        onChange={(_event, { value }) => form.setSum(value)}
      />
      <div className={styles.term}>
        <Input
          label="Срок"
          block
          inputMode="numeric"
          value={form.termValue}
          onChange={(_event, { value }) => form.setTermValue(value)}
        />
        <Select
          label="Единица"
          block
          options={TERM_UNIT_OPTIONS}
          selected={form.termUnit}
          onChange={({ selected }) => selected && isCreditTimeUnit(selected.key) && form.setTermUnit(selected.key)}
        />
      </div>
      {form.errorMessage && (
        <Typography.Text role="alert" view="primary-small" color="negative">
          {form.errorMessage}
        </Typography.Text>
      )}
      <Button type="submit" view="accent" size={48} block loading={form.isSubmitting} disabled={!form.canSubmit}>
        Создать заявку
      </Button>
    </form>
  )
})
