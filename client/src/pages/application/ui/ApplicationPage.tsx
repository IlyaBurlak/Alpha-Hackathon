import { Button } from '@alfalab/core-components/button'
import { Loader } from '@alfalab/core-components/loader'
import { Typography } from '@alfalab/core-components/typography'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { ApplicationCard, ApplicationDetailStore } from '@/entities/application'
import { ROUTES } from '@/shared/config'

import styles from './ApplicationPage.module.css'
import { ProductSection } from './ProductSection'

export const ApplicationPage = observer(function ApplicationPage() {
  const { applicationId } = useParams()
  const [store] = useState(() => new ApplicationDetailStore())
  const id = Number(applicationId)
  const { state } = store

  useEffect(() => {
    if (Number.isInteger(id)) void store.load(id)
  }, [store, id])

  return (
    <main className={styles.page}>
      <Link to={ROUTES.cabinet}>← К заявкам</Link>
      {!Number.isInteger(id) && (
        <Typography.Text role="alert" view="primary-medium" color="negative">
          Некорректный номер заявки.
        </Typography.Text>
      )}
      {(state.status === 'idle' || state.status === 'loading') && <Loader />}
      {state.status === 'error' && (
        <>
          <Typography.Text role="alert" view="primary-medium" color="negative">
            {state.message}
          </Typography.Text>
          <Button view="secondary" size={40} onClick={() => void store.load(id)}>
            Повторить
          </Button>
        </>
      )}
      {state.status === 'success' && (
        <>
          <ApplicationCard application={state.application} />
          <ProductSection
            application={state.application}
            onSelected={(application) => store.update(application)}
            onRetry={() => void store.load(id)}
          />
        </>
      )}
    </main>
  )
})
