import { StoreProvider } from './model/StoreProvider'
import { AppRouter } from './router/router'

export function App() {
  return (
    <StoreProvider>
      <AppRouter />
    </StoreProvider>
  )
}
