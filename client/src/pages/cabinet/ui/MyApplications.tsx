import { Button } from '@alfalab/core-components/button'
import { Loader } from '@alfalab/core-components/loader'
import { Typography } from '@alfalab/core-components/typography'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { ApplicationCard, ApplicationListStore } from '@/entities/application'
import { getApplicationPath } from '@/shared/config'

import styles from './CabinetPage.module.css'

export const MyApplications = observer(function MyApplications() {
  const [store] = useState(() => new ApplicationListStore())
  const { state } = store

  useEffect(() => {
    void store.load()
  }, [store])

  if (state.status === 'idle' || state.status === 'loading') return <Loader />

  if (state.status === 'error') {
    return (
      <>
        <Typography.Text role="alert" view="primary-medium" color="negative">
          {state.message}
        </Typography.Text>
        <Button view="secondary" size={40} onClick={() => void store.load()}>
          Повторить
        </Button>
      </>
    )
  }

  if (state.applications.length === 0) {
    return <Typography.Text view="primary-medium">Заявок пока нет.</Typography.Text>
  }

  return (
    <ul className={styles.applications} aria-label="Мои заявки">
      {state.applications.map((application) => (
        <li key={application.id}>
          <ApplicationCard
            application={application}
            action={
              <Link to={getApplicationPath(application.id)}>
                {application.productChoice.kind === 'selected' ? 'Открыть' : 'Продолжить'}
              </Link>
            }
          />
        </li>
      ))}
    </ul>
  )
})
