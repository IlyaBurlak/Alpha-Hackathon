import { Button } from '@alfalab/core-components/button'
import { Input } from '@alfalab/core-components/input'
import { PasswordInput } from '@alfalab/core-components/password-input'
import { Typography } from '@alfalab/core-components/typography'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { useSessionStore } from '@/entities/session'
import { useUserStore } from '@/entities/user'

import { LoginFormStore } from '../model/login-form-store'
import styles from './LoginForm.module.css'

export const LoginForm = observer(function LoginForm() {
  const session = useSessionStore()
  const user = useUserStore()
  const [form] = useState(() => new LoginFormStore(session, user))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void form.submit()
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <Input
        label="Логин"
        block
        autoComplete="username"
        value={form.login}
        onChange={(_event, { value }) => form.setLogin(value)}
      />
      <PasswordInput
        label="Пароль"
        block
        autoComplete="current-password"
        value={form.password}
        onChange={(_event, { value }) => form.setPassword(value)}
      />
      {form.errorMessage && (
        <Typography.Text role="alert" view="primary-small" color="negative">
          {form.errorMessage}
        </Typography.Text>
      )}
      <Button type="submit" view="accent" size={48} block loading={form.isSubmitting} disabled={!form.canSubmit}>
        Войти
      </Button>
    </form>
  )
})
