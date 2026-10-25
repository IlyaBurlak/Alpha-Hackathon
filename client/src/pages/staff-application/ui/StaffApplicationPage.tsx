import { Loader } from '@alfalab/core-components/loader'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { StaffApplicationDetailStore } from '@/entities/staff-application'
import { ROUTES } from '@/shared/config'
import { useRefreshOnReturn } from '@/shared/lib'
import { Button, EmptyState, getButtonClassName } from '@/shared/ui'
import { StaffApplicationReview } from '@/widgets/staff-application-review'

/** The page of one application: everything an employee needs to decide, and the decision itself. */
export const StaffApplicationPage = observer(function StaffApplicationPage() {
  const { applicationId } = useParams()
  const [store] = useState(() => new StaffApplicationDetailStore())
  const { state } = store

  useEffect(() => {
    if (applicationId) void store.load(applicationId)
  }, [store, applicationId])

  useRefreshOnReturn(() => {
    if (applicationId) void store.refresh(applicationId)
  })

  if (!applicationId) return <EmptyState title="Заявка не найдена" text="Некорректный номер заявки." />
  if (state.status === 'idle' || state.status === 'loading') return <Loader />
  if (state.status === 'error') {
    return (
      <EmptyState
        title="Не удалось открыть заявку"
        text={state.message}
        action={
          <>
            <Button view="secondary" onClick={() => void store.load(applicationId)}>
              Повторить
            </Button>{' '}
            <Link className={getButtonClassName({ view: 'secondary' })} to={ROUTES.staff}>
              К очереди
            </Link>
          </>
        }
      />
    )
  }

  return <StaffApplicationReview application={state.application} detail={store} />
})
