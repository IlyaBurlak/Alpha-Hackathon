import { Loader } from '@alfalab/core-components/loader'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { Link } from 'react-router'

import { ApplicationRows, isActiveStatus, useApplicationListStore } from '@/entities/application'
import { useSelectedOrganization } from '@/entities/user'
import { ROUTES } from '@/shared/config'
import { Button, EmptyState, getButtonClassName } from '@/shared/ui'

import styles from './ApplicationsPage.module.css'

/** All applications of the selected company: active ones first, finished below. */
export const ApplicationsPage = observer(function ApplicationsPage() {
  const organization = useSelectedOrganization()
  const applicationList = useApplicationListStore()
  const { state } = applicationList

  useEffect(() => {
    void applicationList.refresh()
  }, [applicationList])

  const renderBody = () => {
    if (state.status === 'idle' || state.status === 'loading') return <Loader />
    if (state.status === 'error') {
      return (
        <EmptyState
          title="Не удалось загрузить заявки"
          text={state.message}
          action={
            <Button view="secondary" onClick={() => void applicationList.load()}>
              Повторить
            </Button>
          }
        />
      )
    }

    const applications = applicationList.getForOrganization(organization.id)
    if (applications.length === 0) {
      return (
        <EmptyState
          title="Заявок пока нет"
          text="Подбор займёт пару минут."
          action={
            <Link className={getButtonClassName()} to={ROUTES.cabinet}>
              Подобрать кредит
            </Link>
          }
        />
      )
    }

    const active = applications.filter(({ status }) => isActiveStatus(status))
    const finished = applications.filter(({ status }) => !isActiveStatus(status))
    return (
      <>
        {active.length > 0 && (
          <section className={styles.group}>
            <h3>Активные</h3>
            <div className={styles.rows}>
              <ApplicationRows applications={active} ariaLabel="Активные заявки" />
            </div>
          </section>
        )}
        {finished.length > 0 && (
          <section className={styles.group}>
            <h3>Завершённые</h3>
            <div className={styles.rows}>
              <ApplicationRows applications={finished} ariaLabel="Завершённые заявки" />
            </div>
          </section>
        )}
      </>
    )
  }

  return (
    <>
      <h1>Мои заявки</h1>
      <p className={styles.company}>{organization.name}</p>
      {renderBody()}
    </>
  )
})
