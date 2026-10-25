import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { getTermInMonths } from '@/entities/application'
import type { Application } from '@/entities/application'
import { Button } from '@/shared/ui'

import { CreateApplicationFormStore } from '../model/create-application-form-store'
import styles from './ChangeLoanParamsForm.module.css'
import { LoanParamsFields } from './LoanParamsFields'

interface ChangeLoanParamsFormProps {
  /** The draft being edited: its goal, sum and term fill the form. */
  application: Application
  /** Gets the new application created for the changed parameters. */
  onCreated: (application: Application) => void
}

/**
 * Changing the parameters of a draft. The backend cannot update a draft yet, so this creates a new application
 * (docs/frontend-mocks.md); the caller discards the old draft.
 */
export const ChangeLoanParamsForm = observer(function ChangeLoanParamsForm({
  application,
  onCreated,
}: ChangeLoanParamsFormProps) {
  const [form] = useState(
    () =>
      new CreateApplicationFormStore(application.organizationId, {
        goal: application.goal,
        sum: application.sum,
        termInMonths: getTermInMonths(application.creditTime),
      }),
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const created = await form.submit()
    if (created) onCreated(created)
  }

  return (
    <form className={styles.edit} onSubmit={(event) => void handleSubmit(event)} noValidate>
      <LoanParamsFields form={form} isOnSurface />
      <div className={styles.submit}>
        <Button type="submit" disabled={form.isSubmitting}>
          Пересчитать
        </Button>
      </div>
      {form.errorMessage && (
        <p className={styles.error} role="alert">
          {form.errorMessage}
        </p>
      )}
    </form>
  )
})
