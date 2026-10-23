import { Button } from '@alfalab/core-components/button'
import { Loader } from '@alfalab/core-components/loader'
import { Typography } from '@alfalab/core-components/typography'
import { observer } from 'mobx-react-lite'

import { useUserStore } from '@/entities/user'
import { LogoutButton } from '@/features/logout'

import { CabinetContent } from './CabinetContent'
import styles from './CabinetPage.module.css'

export const CabinetPage = observer(function CabinetPage() {
  const userStore = useUserStore()
  const { state } = userStore

  return (
    <main className={styles.page}>
      {(state.status === 'idle' || state.status === 'loading') && <Loader />}
      {state.status === 'error' && (
        <>
          <Typography.Text role="alert" view="primary-medium" color="negative">
            {state.message}
          </Typography.Text>
          <Button view="secondary" size={40} onClick={() => void userStore.load()}>
            Повторить
          </Button>
        </>
      )}
      {state.status === 'success' && <CabinetContent user={state.user} />}
      <LogoutButton />
    </main>
  )
})
