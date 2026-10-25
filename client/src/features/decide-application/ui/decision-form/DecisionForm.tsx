import { observer } from 'mobx-react-lite'

import { COMMENT_MAX_LENGTH, DECISION_OPTIONS } from '@/entities/staff-application'
import { Button, TextAreaField } from '@/shared/ui'

import type { DecisionFormStore } from '../../model/decision-form-store'
import { DecisionFields } from './DecisionFields'
import styles from './DecisionForm.module.css'

interface DecisionFormProps {
  store: DecisionFormStore
}

/** The fields of the chosen answer, a comment for the client and the button that sends it for confirmation. */
export const DecisionForm = observer(function DecisionForm({ store }: DecisionFormProps) {
  const option = DECISION_OPTIONS[store.type]

  return (
    <div className={styles.form}>
      <DecisionFields store={store} />
      <TextAreaField
        label={store.isCommentRequired ? 'Комментарий для клиента' : 'Комментарий, необязательно'}
        value={store.comment}
        maxLength={COMMENT_MAX_LENGTH}
        isInvalid={store.invalidField === 'comment'}
        onChange={(value) => store.setComment(value)}
      />
      <p className={styles.error} role="alert">
        {store.errorMessage}
      </p>
      <Button
        view={option.tone === 'negative' ? 'negative' : 'primary'}
        size="large"
        isBlock
        disabled={store.isSaving}
        onClick={() => store.requestConfirmation()}
      >
        {option.buttonLabel}
      </Button>
    </div>
  )
})
