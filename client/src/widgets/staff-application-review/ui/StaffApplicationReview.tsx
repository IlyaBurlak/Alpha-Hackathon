import { observer } from 'mobx-react-lite'
import { useState } from 'react'

import { useCurrentEmployee } from '@/entities/employee'
import type { StaffApplication, StaffApplicationDetailStore } from '@/entities/staff-application'
import { useStaffApplicationListStore } from '@/entities/staff-application'
import { AssigneeMenu, AssignmentStore, TakeApplicationButton } from '@/features/assign-application'
import { DecisionPanel } from '@/features/decide-application'
import { RestartScoringButton, RestartScoringStore } from '@/features/restart-scoring'
import { useNow } from '@/shared/lib'
import { useToast } from '@/shared/ui'

import { ApplicationSection } from './application-section/ApplicationSection'
import { ChecksSection } from './checks-section/ChecksSection'
import { CompanySection } from './company-section/CompanySection'
import { FinanceSection } from './finance-section/FinanceSection'
import { HistorySection } from './history-section/HistorySection'
import { ReviewHeader } from './review-header/ReviewHeader'
import styles from './ReviewLayout.module.css'
import { ScoringSection } from './scoring-section/ScoringSection'

const CLOCK_INTERVAL_MS = 30_000

const SECTIONS = [
  { id: 's-app', title: 'Заявка' },
  { id: 's-co', title: 'Компания' },
  { id: 's-fin', title: 'Финансы' },
  { id: 's-chk', title: 'Проверки' },
  { id: 's-ml', title: 'ML-скоринг' },
  { id: 's-hist', title: 'История' },
] as const

function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

interface StaffApplicationReviewProps {
  application: StaffApplication
  detail: StaffApplicationDetailStore
}

/** The whole page of an application: its parts on the left, the decision on the right. */
export const StaffApplicationReview = observer(function StaffApplicationReview({ application, detail }: StaffApplicationReviewProps) {
  const employee = useCurrentEmployee()
  const list = useStaffApplicationListStore()
  const showToast = useToast()
  const [assignment] = useState(() => new AssignmentStore(list, detail))
  const [restartScoring] = useState(() => new RestartScoringStore(list, detail))
  const now = useNow(CLOCK_INTERVAL_MS)

  return (
    <>
      <ReviewHeader
        application={application}
        now={now}
        assignee={
          <AssigneeMenu
            applicationId={application.id}
            assigneeId={application.assigneeId}
            currentEmployee={employee}
            store={assignment}
            onChanged={showToast}
          />
        }
      />
      <nav className={styles.anchors} aria-label="Разделы заявки">
        {SECTIONS.map(({ id, title }) => (
          <button key={id} type="button" className={styles.anchor} onClick={() => scrollToSection(id)}>
            {title}
          </button>
        ))}
      </nav>
      <div className={styles.layout}>
        <div>
          <ApplicationSection application={application} />
          <CompanySection company={application.company} now={now} />
          <FinanceSection application={application} />
          <ChecksSection checks={application.checks} />
          <ScoringSection
            scoring={application.scoring}
            scoringStatus={application.scoringStatus}
            scoringIssue={application.scoringIssue}
            action={<RestartScoringButton application={application} store={restartScoring} />}
          />
          <HistorySection history={application.history} />
        </div>
        <aside className={styles.decision}>
          <DecisionPanel
            application={application}
            list={list}
            detail={detail}
            onDecided={showToast}
            takeAction={
              <TakeApplicationButton
                applicationId={application.id}
                employee={employee}
                store={assignment}
                onTaken={() => showToast('Заявка в работе у вас')}
              />
            }
          />
        </aside>
      </div>
    </>
  )
})
