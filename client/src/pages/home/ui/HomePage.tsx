import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'

import { ApplicationRows, useApplicationListStore } from '@/entities/application'
import type { Application } from '@/entities/application'
import { ORGANIZATION_TYPES, getFirstName, useLoadedUser, useSelectedOrganization } from '@/entities/user'
import { CreateApplicationForm } from '@/features/create-application'
import { ROUTES, getApplicationEditPath } from '@/shared/config'

import { getGreeting } from '../lib/greeting'
import styles from './HomePage.module.css'

const RECENT_APPLICATIONS_COUNT = 3

const HOW_IT_WORKS = [
  { title: 'Опишите задачу', text: 'Цель, сумма и срок. Это всё, что нужно для подбора' },
  { title: 'Выберите вариант', text: 'Покажем доступные варианты и шанс одобрения' },
  { title: 'Проверьте данные', text: 'Почти всё уже заполнено из профиля компании' },
  { title: 'Получите решение', text: 'Статус в кабинете, договор подписываете онлайн' },
] as const

/** Entry screen: pick a loan by goal, sum and term, see how it works and the latest applications. */
export const HomePage = observer(function HomePage() {
  const navigate = useNavigate()
  const user = useLoadedUser()
  const organization = useSelectedOrganization()
  const applications = useApplicationListStore()

  useEffect(() => {
    void applications.refresh()
  }, [applications])

  const recentApplications = applications.getForOrganization(organization.id).slice(0, RECENT_APPLICATIONS_COUNT)

  const handleCreated = (application: Application) => {
    void navigate(getApplicationEditPath(application.id))
  }

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.orb} aria-hidden="true" />
        <p className={styles.hello}>
          {getGreeting(new Date().getHours())}, {getFirstName(user.fullName)}
        </p>
        <h1 className={styles.title}>Подберём кредит для бизнеса</h1>
        <p className={styles.subtitle}>Укажите задачу. Покажем подходящие варианты с платежом и шансом одобрения.</p>
        <CreateApplicationForm
          key={organization.id}
          organizationId={organization.id}
          isLegalEntity={organization.type === ORGANIZATION_TYPES.legalEntity}
          onCreated={handleCreated} />
      </section>
      <ol className={styles.how} aria-label="Как это работает">
        {HOW_IT_WORKS.map(({ title, text }, index) => (
          <li key={title}>
            <span className={styles.number}>{index + 1}</span>
            <span>
              <b className={styles.stepTitle}>{title}</b>
              <p className={styles.stepText}>{text}</p>
            </span>
          </li>
        ))}
      </ol>
      {recentApplications.length > 0 && (
        <section className={styles.recent}>
          <div className={styles.recentHeader}>
            <h2>Мои заявки</h2>
            <Link className={styles.allLink} to={ROUTES.applications}>
              Все
            </Link>
          </div>
          <ApplicationRows applications={recentApplications} ariaLabel="Последние заявки" />
        </section>
      )}
    </>
  )
})
