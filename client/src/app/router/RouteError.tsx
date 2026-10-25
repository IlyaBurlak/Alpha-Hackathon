import { isRouteErrorResponse, useRouteError } from 'react-router'

import { Button, EmptyState } from '@/shared/ui'

const NOT_FOUND_STATUS = 404

/** Shown instead of a blank screen when a route fails to render, a lazy page fails to load or the address is unknown. */
export function RouteError() {
  const error = useRouteError()
  const isNotFound = isRouteErrorResponse(error) && error.status === NOT_FOUND_STATUS

  return isNotFound ? (
    <EmptyState
      title="Страница не найдена"
      text="Проверьте адрес или вернитесь на главную."
      action={<Button onClick={() => window.location.assign('/')}>На главную</Button>}
    />
  ) : (
    <EmptyState
      title="Что-то пошло не так"
      text="Не удалось показать страницу. Обновите её или вернитесь позже."
      action={<Button onClick={() => window.location.reload()}>Обновить страницу</Button>}
    />
  )
}
