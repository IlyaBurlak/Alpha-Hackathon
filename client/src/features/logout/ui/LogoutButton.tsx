import { Button } from '@alfalab/core-components/button'

import { useSessionStore } from '@/entities/session'
import { useUserStore } from '@/entities/user'

export function LogoutButton() {
  const session = useSessionStore()
  const user = useUserStore()

  const handleClick = () => {
    session.signOut()
    user.reset()
  }

  return (
    <Button view="secondary" size={40} onClick={handleClick}>
      Выйти
    </Button>
  )
}
