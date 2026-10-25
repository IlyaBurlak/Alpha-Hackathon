import { useSessionStore } from '@/entities/session'
import { useUserStore } from '@/entities/user'
import { MenuItem } from '@/shared/ui'

/** Menu item that ends the session. */
export function LogoutButton() {
  const session = useSessionStore()
  const user = useUserStore()

  const handleClick = () => {
    session.signOut()
    user.reset()
  }

  return <MenuItem title="Выйти" onClick={handleClick} />
}
