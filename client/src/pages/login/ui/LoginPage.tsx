import { Typography } from '@alfalab/core-components/typography'

import { LoginForm } from '@/features/login'

import styles from './LoginPage.module.css'

export function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <Typography.Title id="login-title" tag="h1" view="medium" font="system">
          Вход в личный кабинет
        </Typography.Title>
        <LoginForm />
      </section>
    </main>
  )
}
