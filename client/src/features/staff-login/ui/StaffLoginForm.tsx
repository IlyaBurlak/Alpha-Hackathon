import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { useEmployeeStore } from '@/entities/employee'
import { useSessionStore } from '@/entities/session'
import { Button, Checkbox, PasswordField, TextField } from '@/shared/ui'

import { StaffLoginFormStore } from '../model/staff-login-form-store'
import styles from './StaffLoginForm.module.css'

const SESSION_HINT = 'Сессия 24 часа'

interface StaffLoginFormProps {
  /** Called after the employee is signed in. */
  onSignedIn: () => void
}

export const StaffLoginForm = observer(function StaffLoginForm({ onSignedIn }: StaffLoginFormProps) {
  const session = useSessionStore()
  const employee = useEmployeeStore()
  const [form] = useState(() => new StaffLoginFormStore(session, employee))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (await form.submit()) onSignedIn()
  }

  return (
    <form className={styles.form} onSubmit={(event) => void handleSubmit(event)} noValidate>
      <TextField
        label="Логин"
        name="username"
        autoComplete="username"
        value={form.login}
        isInvalid={form.invalidFields.includes('login')}
        onChange={(value) => form.setLogin(value)}
      />
      <PasswordField
        label="Пароль"
        value={form.password}
        isInvalid={form.invalidFields.includes('password')}
        onChange={(value) => form.setPassword(value)}
      />
      <p className={styles.error} role="alert">
        {form.errorMessage}
      </p>
      <div className={styles.row}>
        <Checkbox
          label="Запомнить меня"
          size="compact"
          hasVerticalSpace={false}
          isChecked={form.isRemembered}
          onChange={(isRemembered) => form.setRemembered(isRemembered)}
        />
        <span className={styles.hint}>{SESSION_HINT}</span>
      </div>
      <div className={styles.submit}>
        <Button type="submit" view="accent" disabled={form.isSubmitting}>
          Войти
        </Button>
      </div>
    </form>
  )
})
