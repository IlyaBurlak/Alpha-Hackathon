import type { ReactNode } from 'react'

import type { StaffApplication } from '@/entities/staff-application'
import { AUTO_APPROVAL_SCORE_FROM, REFUSAL_SCORE_BELOW, SCORING_STATUSES } from '@/entities/staff-application'
import { formatLongDate, formatPercent } from '@/shared/lib'

import { ReviewSection } from '../review-section/ReviewSection'
import { FactorRows } from './factor-rows/FactorRows'
import styles from './ScoringSection.module.css'
import { StaffScoreGauge } from './score-gauge/StaffScoreGauge'

const PERCENT = 100

interface ScoringSectionProps {
  scoring: StaffApplication['scoring']
  scoringStatus: StaffApplication['scoringStatus']
  /** Why the finished scoring has no result. */
  scoringIssue: StaffApplication['scoringIssue']
  /** An action next to the title, e.g. the restart of the scoring. */
  action?: ReactNode
}

/** The result of the model: the score and its zone, the probability of default, the risk class and the factors. */
export function ScoringSection({ scoring, scoringStatus, scoringIssue, action }: ScoringSectionProps) {
  if (scoringStatus === SCORING_STATUSES.unavailable || (scoringStatus === SCORING_STATUSES.ready && !scoring)) {
    return (
      <ReviewSection id="s-ml" title="ML-скоринг" aside={action}>
        <div className={styles.pending}>
          <h3>Результат скоринга не получен</h3>
          <p>{scoringIssue ?? 'Модель не вернула оценку.'} Оценку можно получить перезапуском скоринга.</p>
        </div>
      </ReviewSection>
    )
  }

  if (!scoring) {
    return (
      <ReviewSection id="s-ml" title="ML-скоринг" aside={action}>
        <div className={styles.pending}>
          <h3>Скоринг выполняется</h3>
          <p>Обычно до 15 минут. Результат появится после обновления страницы.</p>
        </div>
      </ReviewSection>
    )
  }

  return (
    <ReviewSection
      id="s-ml"
      title="ML-скоринг"
      source={`Модель ${scoring.modelVersion}, обновлена ${formatLongDate(scoring.updatedAt)}`}
      aside={action}
    >
      <div className={styles.model}>
        <StaffScoreGauge score={scoring.score} />
        <div>
          <div className={styles.metrics}>
            <div>
              <small>Вероятность дефолта</small>
              <b>{formatPercent(scoring.probabilityOfDefault * PERCENT)}</b>
            </div>
            <div>
              <small>Класс риска</small>
              <b>{scoring.riskClass}</b>
            </div>
            <div>
              <small>Ставка по модели</small>
              <b>{formatPercent(scoring.rate)}</b>
            </div>
          </div>
          <div className={styles.threshold}>
            <i style={{ left: `${scoring.score}%` }} />
          </div>
          <div className={styles.thresholdLabels}>
            <span>Отказ до {REFUSAL_SCORE_BELOW}</span>
            <span>
              Ручное {REFUSAL_SCORE_BELOW}–{AUTO_APPROVAL_SCORE_FROM - 1}
            </span>
            <span>Авто от {AUTO_APPROVAL_SCORE_FROM}</span>
          </div>
        </div>
      </div>
      <h3 className={styles.factorsTitle}>Вклад факторов</h3>
      <p className={styles.factorsHint}>Как каждый признак повлиял на итоговый балл: плюс повышает его, минус понижает.</p>
      <FactorRows factors={scoring.factors} />
    </ReviewSection>
  )
}
