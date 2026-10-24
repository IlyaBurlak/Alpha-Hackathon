import { Loader } from '@alfalab/core-components/loader'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'

import {
  APPLICATION_STATUSES,
  ApplicationDetailStore,
  createApplication,
  discardApplication,
  formatMoneyShort,
} from '@/entities/application'
import type { Application } from '@/entities/application'
import { useLoadedUser, useSelectedOrganization } from '@/entities/user'
import { getErrorMessage } from '@/shared/api'
import { ROUTES, getApplicationEditPath, getApplicationPath } from '@/shared/config'
import { Button, EmptyState, useToast } from '@/shared/ui'
import { ApplicationWizard } from '@/widgets/application-wizard'

/** A draft: the wizard where the user picks a variant, checks the data and sends the application. */
export const ApplicationEditPage = observer(function ApplicationEditPage() {
  const { applicationId } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const user = useLoadedUser()
  const organization = useSelectedOrganization()
  const [store] = useState(() => new ApplicationDetailStore())
  const id = Number(applicationId)
  const isValidId = Number.isInteger(id)
  const { state } = store

  useEffect(() => {
    if (isValidId) void store.load(id)
  }, [store, id, isValidId])

  const handleSubmitted = (application: Application) => {
    showToast('Заявка отправлена в банк')
    void navigate(getApplicationPath(application.id))
  }

  const handleDiscard = () => {
    discardApplication(id)
    showToast('Черновик удалён')
    void navigate(ROUTES.cabinet)
  }

  /** The backend cannot edit a draft: the changed request becomes a new application and the old draft is dropped. */
  const handleParamsChanged = (changed: Application) => {
    discardApplication(id)
    void navigate(getApplicationEditPath(changed.id), { replace: true })
  }

  const handleApplySuggestedSum = async (current: Application, sum: number) => {
    try {
      const recalculated = await createApplication({
        organizationId: current.organizationId,
        sum,
        creditTime: current.creditTime,
        goal: current.goal ?? 'other',
      })
      handleParamsChanged(recalculated)
      showToast(`Пересчитали на ${formatMoneyShort(sum)}`)
    } catch (error) {
      showToast(getErrorMessage(error))
    }
  }

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
  if (application.status !== APPLICATION_STATUSES.draft) return <Navigate to={getApplicationPath(application.id)} replace />
  if (application.organizationId !== organization.id) return <Navigate to={ROUTES.applications} replace />

  if (application.productChoice.kind !== 'offers') {
    return (
      <EmptyState
        title="Сервисы банка недоступны"
        text="Продукты показать не получилось. Попробуйте позже."
        action={
          <Button view="secondary" onClick={() => void store.load(id)}>
            Повторить
          </Button>
        }
      />
    )
  }

  return (
    <ApplicationWizard
      application={application}
      offers={application.productChoice.items}
      organization={organization}
      applicantName={user.fullName}
      defaults={{
        role: organization.role,
        phone: user.phone,
        email: user.email,
        revenue: organization.annualRevenue,
        employees: organization.employeesCount,
      }}
      onSubmitted={handleSubmitted}
      onDiscard={handleDiscard}
      onParamsChanged={handleParamsChanged}
      onApplySuggestedSum={(sum) => void handleApplySuggestedSum(application, sum)}
    />
  )
})
