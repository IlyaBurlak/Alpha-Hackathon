import { Select } from '@alfalab/core-components/select'
import { Typography } from '@alfalab/core-components/typography'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router'

import type { Application } from '@/entities/application'
import { useUserStore } from '@/entities/user'
import type { User } from '@/entities/user'
import { CreateApplicationForm } from '@/features/create-application'
import { getApplicationPath } from '@/shared/config'

import { MyApplications } from './MyApplications'

interface CabinetContentProps {
  user: User
}

export const CabinetContent = observer(function CabinetContent({ user }: CabinetContentProps) {
  const navigate = useNavigate()
  const userStore = useUserStore()
  const { selectedOrganization } = userStore

  const organizationOptions = user.organizations.map((organization) => ({
    key: String(organization.id),
    content: organization.name,
  }))

  const handleCreated = (application: Application) => {
    void navigate(getApplicationPath(application.id))
  }

  return (
    <>
      <Typography.Title tag="h1" view="medium" font="system">
        Здравствуйте, {user.fullName}
      </Typography.Title>
      {selectedOrganization === null ? (
        <Typography.Text view="primary-medium">У вас пока нет организаций, подать заявку нельзя.</Typography.Text>
      ) : (
        <>
          <Select
            label="Компания"
            block
            options={organizationOptions}
            selected={String(selectedOrganization.id)}
            onChange={({ selected }) => selected && userStore.selectOrganization(Number(selected.key))}
          />

          <Typography.Title tag="h2" view="small" font="system">
            Новая заявка
          </Typography.Title>
          <CreateApplicationForm
            key={selectedOrganization.id}
            organizationId={selectedOrganization.id}
            onCreated={handleCreated}
          />

          <Typography.Title tag="h2" view="small" font="system">
            Мои заявки
          </Typography.Title>
          <MyApplications organizationId={selectedOrganization.id} />
        </>
      )}
    </>
  )
})
