import type { StaffApplication } from '@/entities/staff-application'
import { AUTO_APPROVAL_SCORE_FROM, BASE_SCORE, REFUSAL_SCORE_BELOW } from '@/entities/staff-application'
import { formatLongDate, formatPercent } from '@/shared/lib'

import { ReviewSection } from '../review-section/ReviewSection'
import { FactorRows } from './factor-rows/FactorRows'
import styles from './ScoringSection.module.css'
import { StaffScoreGauge } from './score-gauge/StaffScoreGauge'

const PERCENT = 100

interface ScoringSectionProps {
  scoring: StaffApplication['scoring']
}

/** The result of the model: the score and its zone, the probability of default, the risk class and the factors. */
export function ScoringSection({ scoring }: ScoringSectionProps) {
  if (!scoring) {
    return (
      <ReviewSection id="s-ml" title="ML-скоринг">
        <div className={styles.pending}>
          <h3>Скоринг выполняется</h3>
          <p>Обычно до 15 минут. Страница обновится сама.</p>
        </div>
      </ReviewSection>
    )
  }

  return (
    <ReviewSection
      id="s-ml"
      title="ML-скоринг"
      source={`Модель ${scoring.modelVersion}, обновлена ${formatLongDate(scoring.updatedAt)}`}
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
      <p className={styles.factorsHint}>Как каждый признак сдвинул итоговый балл от базового уровня {BASE_SCORE}.</p>
      <FactorRows factors={scoring.factors} />
    </ReviewSection>
  )
}
