import { useNavigate } from 'react-router'

import { useEmployeeStore } from '@/entities/employee'
import { StaffLoginForm } from '@/features/staff-login'
import { ROUTES } from '@/shared/config'
import { classNames } from '@/shared/lib'
import { STAFF_DENSITY_CLASS_NAME, useToast } from '@/shared/ui'

import styles from './StaffLoginPage.module.css'

/** Sign-in of bank employees. */
export function StaffLoginPage() {
  const navigate = useNavigate()
  const showToast = useToast()
  const employeeStore = useEmployeeStore()

  const handleSignedIn = () => {
    const firstName = employeeStore.current?.name.split(' ')[0]
    showToast(firstName ? `Здравствуйте, ${firstName}` : 'Здравствуйте')
    void navigate(ROUTES.staff)
  }

  return (
    <main className={classNames(styles.page, STAFF_DENSITY_CLASS_NAME)}>
      <div className={styles.card}>
        <div className={styles.orb} aria-hidden="true" />
        <h1 className={styles.title}>Кабинет сотрудника</h1>
        <p className={styles.subtitle}>Рассмотрение кредитных заявок малого бизнеса</p>
        <StaffLoginForm onSignedIn={handleSignedIn} />
        <p className={styles.demo}>
          Демо: логин <code>ivanova</code>, пароль <code>demo2026</code>
        </p>
      </div>
    </main>
  )
}
