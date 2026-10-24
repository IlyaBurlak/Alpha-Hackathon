import { Loader } from '@alfalab/core-components/loader'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'

import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_TONES, ApplicationDetailStore, getApplicationTitle, useApplicationListStore } from '@/entities/application'
import type { Application } from '@/entities/application'
import { useSelectedOrganization } from '@/entities/user'
import { ROUTES, getApplicationEditPath } from '@/shared/config'
import { Button, EmptyState, Icon, StatusDot, useToast } from '@/shared/ui'
import { formatWhen } from '@/shared/lib'

import styles from './ApplicationPage.module.css'
import { ConditionsBox } from './conditions-box/ConditionsBox'
import { SignModal } from './sign-modal/SignModal'
import { StatusBlock } from './status-block/StatusBlock'
import { StatusTimeline } from './status-timeline/StatusTimeline'
import { WithdrawModal } from './withdraw-modal/WithdrawModal'

const REVIEW_POLL_INTERVAL_MS = 5000
const PAYOUT_POLL_INTERVAL_MS = 1000

type OpenModal = 'withdraw' | 'sign' | null

function getPollInterval(application: Application | null): number | null {
  if (application?.status === APPLICATION_STATUSES.submitted) return REVIEW_POLL_INTERVAL_MS
  if (application?.status === APPLICATION_STATUSES.payout) return PAYOUT_POLL_INTERVAL_MS
  return null
}

/** A sent application: status, what is happening now, the steps ahead and the loan conditions. */
export const ApplicationPage = observer(function ApplicationPage() {
  const { applicationId } = useParams()
  const organization = useSelectedOrganization()
  const showToast = useToast()
  const applicationList = useApplicationListStore()
  const [store] = useState(() => new ApplicationDetailStore())
  const [openModal, setOpenModal] = useState<OpenModal>(null)
  const id = Number(applicationId)
  const isValidId = Number.isInteger(id)
  const { state } = store
  const pollInterval = getPollInterval(state.status === 'success' ? state.application : null)

  useEffect(() => {
    if (isValidId) void store.load(id)
  }, [store, id, isValidId])

  useEffect(() => {
    if (pollInterval === null) return undefined
    const timer = window.setInterval(() => {
      void store.refresh(id)
      void applicationList.refresh()
    }, pollInterval)
    return () => window.clearInterval(timer)
  }, [store, applicationList, id, pollInterval])

  const handleWithdraw = () => {
    setOpenModal(null)
    void store
      .withdraw(id)
      .then(() => applicationList.refresh())
      .then(() => showToast('Заявка отозвана'))
  }

  const handleSign = () => {
    setOpenModal(null)
    void store
      .sign(id)
      .then(() => applicationList.refresh())
      .then(() => showToast('Договор подписан'))
  }

  const renderBody = () => {
    if (!isValidId) return <EmptyState title="Заявка не найдена" text="Некорректный номер заявки." />
    if (state.status === 'idle' || state.status === 'loading') return <Loader />
    if (state.status === 'error') {
      return (
        <EmptyState
          title="Не удалось загрузить заявку"
          text={state.message}
          action={
            <Button view="secondary" onClick={() => void store.load(id)}>
              Повторить
            </Button>
          }
        />
      )
    }

    const { application } = state
    if (application.status === APPLICATION_STATUSES.draft) return <Navigate to={getApplicationEditPath(application.id)} replace />

    return (
      <>
        <div className={styles.header}>
          <div>
            <h1>{getApplicationTitle(application)}</h1>
            <div className={styles.meta}>
              <StatusDot tone={APPLICATION_STATUS_TONES[application.status]}>{APPLICATION_STATUS_LABELS[application.status]}</StatusDot>
              <span>№&nbsp;{application.id}</span>
              <span>Подана {formatWhen(application.submittedAt ?? application.createdAt)}</span>
            </div>
          </div>
          {application.status === APPLICATION_STATUSES.submitted && (
            <Button view="secondary" size="small" onClick={() => setOpenModal('withdraw')}>
              Отозвать
            </Button>
          )}
        </div>
        <StatusBlock application={application} account={organization.account} onSign={() => setOpenModal('sign')} />
        <div className={styles.columns}>
          <section>
            <h2>Статус</h2>
            <StatusTimeline
              status={application.status}
              completedAt={[application.submittedAt, null, null, application.signedAt, application.issuedAt]}
            />
          </section>
          <ConditionsBox application={application} />
        </div>
        {openModal === 'withdraw' && <WithdrawModal onClose={() => setOpenModal(null)} onConfirm={handleWithdraw} />}
        {openModal === 'sign' && (
          <SignModal application={application} onClose={() => setOpenModal(null)} onConfirm={handleSign} />
        )}
      </>
    )
  }

  return (
    <>
      <Link className={styles.crumb} to={ROUTES.applications}>
        <Icon name="left" size={18} />
        Мои заявки
      </Link>
      {renderBody()}
    </>
  )
})
