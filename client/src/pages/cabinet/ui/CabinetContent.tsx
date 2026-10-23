import { Typography } from '@alfalab/core-components/typography'
import { useNavigate } from 'react-router'

import type { Application } from '@/entities/application'
import type { User } from '@/entities/user'
import { CreateApplicationForm } from '@/features/create-application'
import { getApplicationPath } from '@/shared/config'

import styles from './CabinetPage.module.css'
import { MyApplications } from './MyApplications'

interface CabinetContentProps {
  user: User
}

export function CabinetContent({ user }: CabinetContentProps) {
  const navigate = useNavigate()

  const handleCreated = (application: Application) => {
    void navigate(getApplicationPath(application.id))
  }

  return (
    <>
      <Typography.Title tag="h1" view="medium" font="system">
        Здравствуйте, {user.fullName}
      </Typography.Title>
      <ul className={styles.organizations} aria-label="Ваши организации">
        {user.organizations.map((organization) => (
          <li key={organization.id}>
            <Typography.Text view="primary-medium">{organization.name}</Typography.Text>
          </li>
        ))}
      </ul>

      <Typography.Title tag="h2" view="small" font="system">
        Новая заявка
      </Typography.Title>
      <CreateApplicationForm organizations={user.organizations} onCreated={handleCreated} />

      <Typography.Title tag="h2" view="small" font="system">
        Мои заявки
      </Typography.Title>
      <MyApplications />
    </>
  )
}
