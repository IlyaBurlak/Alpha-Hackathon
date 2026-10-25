import { useState } from 'react'
import { Link } from 'react-router'

import { APPLICATION_STATUSES, calculateLoan, formatCreditTime, getPaymentDate } from '@/entities/application'
import type { Application } from '@/entities/application'
import { ROUTES } from '@/shared/config'
import { classNames, formatLongDate, formatMoney, formatPercent } from '@/shared/lib'
import { Button, Icon, getButtonClassName } from '@/shared/ui'

import styles from './StatusBlock.module.css'

const REVIEW_STAGE_TITLES = [
  'Проверяем заполненные данные',
  'Запрашиваем кредитную историю в БКИ',
  'Оцениваем риск и готовим решение',
] as const
const REVIEW_STAGE_COUNT = REVIEW_STAGE_TITLES.length
const PERCENT = 100
const ACCOUNT_FALLBACK = 'расчётный счёт компании'

interface StatusBlockProps {
  application: Application
  /** Masked account of the company; the money comes to it. */
  account: string | null
  onSign: () => void
  /** Answers other conditions offered by the bank. */
  onAnswerOffer: (isAccepted: boolean) => void
}

function ReviewState({ application }: Pick<StatusBlockProps, 'application'>) {
  const { reviewStage } = application
  return (
    <div className={styles.state}>
      <span className={styles.stateKind}>На рассмотрении</span>
      <h2 className={styles.stateTitle}>{reviewStage === null ? 'Заявка принята в работу' : REVIEW_STAGE_TITLES[reviewStage]}</h2>
      <p className={styles.stateText}>
        Обычно решение занимает до одного рабочего дня. Статус обновится здесь, звонить и ехать в офис не нужно.
      </p>
      {reviewStage !== null && (
        <div className={styles.progress}>
          <i className={styles.progressFill} style={{ width: `${((reviewStage + 1) / REVIEW_STAGE_COUNT) * PERCENT}%` }} />
        </div>
      )}
    </div>
  )
}

function ApprovedState({ application, account, onSign }: StatusBlockProps) {
  const { productChoice } = application
  const terms = `${formatMoney(application.sum)} на ${formatCreditTime(application.creditTime)}`
  return (
    <div className={classNames(styles.state, styles.statePositive)}>
      <span className={styles.stateKind}>Кредит одобрен</span>
      <h2 className={styles.stateTitle}>
        {productChoice.kind === 'selected' ? `${terms} под ${formatPercent(productChoice.product.interestRate)}` : terms}
      </h2>
      <p className={styles.stateText}>
        Подпишите договор в кабинете. Деньги придут на {account ? `счёт ${account}` : ACCOUNT_FALLBACK} в течение 2 часов.
      </p>
      {application.operatorComment && <p className={styles.stateText}>Комментарий банка: {application.operatorComment}</p>}
      <div className={styles.actions}>
        <Button view="accent" size="large" onClick={onSign}>
          <Icon name="pen" size={20} />
          Подписать договор
        </Button>
      </div>
    </div>
  )
}

function OfferedState({ application, onAnswerOffer }: Pick<StatusBlockProps, 'application' | 'onAnswerOffer'>) {
  const { specialOffer, operatorComment } = application
  if (!specialOffer) return null
  const { monthlyPayment } = calculateLoan(specialOffer)
  return (
    <div className={styles.state}>
      <span className={styles.stateKind}>Другие условия</span>
      <h2 className={styles.stateTitle}>
        {formatMoney(specialOffer.sum)} на {formatCreditTime(specialOffer.creditTime)} под {formatPercent(specialOffer.interestRate)}
      </h2>
      <p className={styles.stateText}>
        Банк не может выдать кредит на запрошенных условиях и предлагает другие. Платёж в месяц {formatMoney(monthlyPayment)}.
        {operatorComment ? ` ${operatorComment}` : ''}
      </p>
      <div className={styles.actions}>
        <Button view="accent" size="large" onClick={() => onAnswerOffer(true)}>
          Принять
        </Button>
        <Button view="secondary" size="large" onClick={() => onAnswerOffer(false)}>
          Отказаться
        </Button>
      </div>
    </div>
  )
}

function OfferDeclinedState() {
  return (
    <div className={styles.state}>
      <span className={classNames(styles.stateKind, styles.stateKindMuted)}>Вы отказались</span>
      <h2 className={styles.stateTitle}>Другие условия не приняты</h2>
      <p className={styles.stateText}>Можно подать новую заявку с другой суммой или сроком.</p>
      <div className={styles.actions}>
        <Link className={getButtonClassName({ view: 'secondary' })} to={ROUTES.cabinet}>
          Подать новую заявку
        </Link>
      </div>
    </div>
  )
}

function PayoutState({ application, account }: Pick<StatusBlockProps, 'application' | 'account'>) {
  return (
    <div className={classNames(styles.state, styles.statePositive)}>
      <span className={styles.stateKind}>Договор подписан</span>
      <h2 className={styles.stateTitle}>Перечисляем деньги</h2>
      <p className={styles.stateText}>
        Отправляем {formatMoney(application.sum)} на {account ? `счёт ${account}` : ACCOUNT_FALLBACK}.
      </p>
      <div className={styles.progress}>
        <i className={styles.progressAnimated} />
      </div>
    </div>
  )
}

function IssuedState({ application, account }: Pick<StatusBlockProps, 'application' | 'account'>) {
  const { productChoice, issuedAt } = application
  const issuedOn = issuedAt ?? application.createdAt
  const [now] = useState(() => Date.now())
  const nextPayment =
    productChoice.kind === 'selected'
      ? calculateLoan({
          sum: application.sum,
          interestRate: productChoice.product.interestRate,
          creditTime: application.creditTime,
        }).schedule
          .map((row) => ({ payment: row.payment, date: getPaymentDate(issuedOn, row.month) }))
          .find(({ date }) => date.getTime() > now)
      : undefined

  return (
    <div className={styles.state}>
      <span className={classNames(styles.stateKind, styles.stateKindDark)}>Кредит выдан {formatLongDate(issuedOn)}</span>
      <h2 className={styles.stateTitle}>{nextPayment ? `Ближайший платёж ${formatMoney(nextPayment.payment)}` : 'Деньги на счёте'}</h2>
      {nextPayment && (
        <p className={styles.stateText}>
          Спишем {formatLongDate(nextPayment.date)} со {account ? `счёта ${account}` : 'счёта компании'}. Держите на счёте нужную
          сумму.
        </p>
      )}
    </div>
  )
}

function RejectedState({ application }: Pick<StatusBlockProps, 'application'>) {
  const { operatorComment } = application
  // What the employee wrote is the real reason; the estimated factors only stand in while the bank wrote nothing.
  const reasons = operatorComment ? [] : (application.scoring?.factors.filter(({ points }) => points < 0) ?? [])
  return (
    <div className={classNames(styles.state, styles.stateNegative)}>
      <span className={styles.stateKind}>Отказ</span>
      <h2 className={styles.stateTitle}>Сейчас банк не может выдать кредит</h2>
      <p className={styles.stateText}>
        {reasons.length > 0
          ? 'Причины ниже. Их можно исправить и подать заявку снова.'
          : 'Можно подать новую заявку с другими условиями.'}
      </p>
      {operatorComment && <p className={styles.stateText}>Причина: {operatorComment}</p>}
      {reasons.length > 0 && (
        <ul className={styles.reasons}>
          {reasons.map(({ title, description, advice }) => (
            <li key={title} className={styles.reason}>
              <b className={styles.reasonTitle}>
                {title}: {description.toLowerCase()}
              </b>
              {advice && <span className={styles.reasonAdvice}>{advice}</span>}
            </li>
          ))}
        </ul>
      )}
      <div className={styles.actions}>
        <Link className={getButtonClassName({ view: 'secondary' })} to={ROUTES.cabinet}>
          Подать новую заявку
        </Link>
      </div>
    </div>
  )
}

/** The big card under the title: what is happening with the application and what comes next. */
export function StatusBlock({ application, account, onSign, onAnswerOffer }: StatusBlockProps) {
  switch (application.status) {
    case APPLICATION_STATUSES.submitted:
      return <ReviewState application={application} />
    case APPLICATION_STATUSES.offered:
      return <OfferedState application={application} onAnswerOffer={onAnswerOffer} />
    case APPLICATION_STATUSES.offerDeclined:
      return <OfferDeclinedState />
    case APPLICATION_STATUSES.approved:
    case APPLICATION_STATUSES.offerAccepted:
      return <ApprovedState application={application} account={account} onSign={onSign} onAnswerOffer={onAnswerOffer} />
    case APPLICATION_STATUSES.payout:
      return <PayoutState application={application} account={account} />
    case APPLICATION_STATUSES.issued:
      return <IssuedState application={application} account={account} />
    case APPLICATION_STATUSES.rejected:
      return <RejectedState application={application} />
    default:
      return null
  }
}
