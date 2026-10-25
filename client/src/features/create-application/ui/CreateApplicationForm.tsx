import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import type { FormEvent } from 'react'

import type { Application } from '@/entities/application'
import { Button } from '@/shared/ui'

import { CreateApplicationFormStore } from '../model/create-application-form-store'
import styles from './CreateApplicationForm.module.css'
import { LoanParamsFields } from './LoanParamsFields'

interface CreateApplicationFormProps {
  /** The form is bound to one organization: remount it (`key`) when the organization changes. */
  organizationId: number
  /** The kind of the company decides which products, and so which sums, the bank offers. */
  isLegalEntity: boolean
  onCreated: (application: Application) => void
}

/** The "what do you need money for" panel: goal, sum and term lead to the offers. */
export const CreateApplicationForm = observer(function CreateApplicationForm({
  organizationId,
  isLegalEntity,
  onCreated,
}: CreateApplicationFormProps) {
  const [form] = useState(() => new CreateApplicationFormStore(organizationId, undefined, { isLegalEntity }))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const application = await form.submit()
    if (application) onCreated(application)
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} noValidate>
      <div className={styles.ask}>
        <div className={styles.fields}>
          <LoanParamsFields form={form} />
          <div className={styles.submit}>
            <Button type="submit" view="accent" disabled={form.isSubmitting}>
              Подобрать
            </Button>
          </div>
        </div>
      </div>
      <p className={styles.error} role="alert">
        {form.errorMessage}
      </p>
    </form>
  )
})
