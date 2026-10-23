import { Typography } from '@alfalab/core-components/typography'

import type { User } from '@/entities/user'

import styles from './CabinetPage.module.css'

interface CabinetContentProps {
  user: User
}

export function CabinetContent({ user }: CabinetContentProps) {
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
    </>
  )
}
