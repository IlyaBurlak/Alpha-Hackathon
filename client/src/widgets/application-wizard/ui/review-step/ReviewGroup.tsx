import type { ReactNode } from 'react'

import { KeyValueList, TextButton } from '@/shared/ui'
import type { KeyValueItem } from '@/shared/ui'

import type { WizardStep } from '../../model/application-wizard-store'
import styles from './ReviewGroup.module.css'

interface ReviewGroupProps {
  title: string
  step: WizardStep
  items: readonly KeyValueItem[]
  onEdit: (step: WizardStep) => void
}

export function ReviewGroup({ title, step, items, onEdit }: ReviewGroupProps): ReactNode {
  return (
    <section className={styles.group}>
      <div className={styles.groupHeader}>
        <h3>{title}</h3>
        <TextButton onClick={() => onEdit(step)}>Изменить</TextButton>
      </div>
      <KeyValueList items={items} />
    </section>
  )
}
