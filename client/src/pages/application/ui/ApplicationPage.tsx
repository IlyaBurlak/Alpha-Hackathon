import { Loader } from '@alfalab/core-components/loader'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'

import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_TONES, ApplicationDetailStore, getApplicationTitle, useApplicationListStore } from '@/entities/application'
import type { Application } from '@/entities/application'
import { useSelectedOrganization } from '@/entities/user'
import { ROUTES, getApplicationEditPath } from '@/shared/config'
import { getErrorMessage } from '@/shared/api'
import { Button, EmptyState, Icon, StatusDot, useToast } from '@/shared/ui'
import { formatWhen, useRefreshOnReturn } from '@/shared/lib'

import styles from './ApplicationPage.module.css'
import { ConditionsBox } from './conditions-box/ConditionsBox'
import { SignModal } from './sign-modal/SignModal'
import { StatusBlock } from './status-block/StatusBlock'
import { StatusTimeline } from './status-timeline/StatusTimeline'

/** The payout is a timer on the client: it ends without any request to the server. */
const PAYOUT_SETTLE_DELAY_MS = 300

type OpenModal = 'sign' | null

function getPayoutEnd(application: Application | null): Date | null {
  return application?.status === APPLICATION_STATUSES.payout ? application.issuedAt : null
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
  const shownApplication = state.status === 'success' ? state.application : null
  const payoutEnd = getPayoutEnd(shownApplication)

  useEffect(() => {
    if (isValidId) void store.load(id)
  }, [store, id, isValidId])

  // The status is asked for when the page opens and when the user comes back to the tab, never on a timer.
  useRefreshOnReturn(() => {
    if (!isValidId) return
    void store.refresh(id).then(() => applicationList.refresh())
  })

  useEffect(() => {
    if (payoutEnd === null) return undefined
    const timer = window.setTimeout(() => {
      store.settlePayout()
      applicationList.settlePayouts()
    }, Math.max(0, payoutEnd.getTime() - Date.now()) + PAYOUT_SETTLE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [store, applicationList, payoutEnd])

  const handleSign = () => {
    setOpenModal(null)
    void store
      .sign(id)
      .then(() => applicationList.refresh())
      .then(() => showToast('Договор подписан'))
      .catch((error: unknown) => showToast(getErrorMessage(error)))
  }

  const handleAnswerOffer = (isAccepted: boolean) => {
    void store
      .answerOffer(id, isAccepted)
      .then(() => applicationList.refresh())
      .then(() => showToast(isAccepted ? 'Условия приняты' : 'Вы отказались от других условий'))
      .catch((error: unknown) => showToast(getErrorMessage(error)))
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
        </div>
        <StatusBlock application={application} account={organization.account} onSign={() => setOpenModal('sign')} onAnswerOffer={handleAnswerOffer} />
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
