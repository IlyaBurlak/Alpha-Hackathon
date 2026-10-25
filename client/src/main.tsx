import '@alfalab/core-components/vars/index.css'
import '@alfalab/core-components/vars/typography.css'
import '@/shared/ui/theme/tokens.css'
import './app/styles/fonts.css'
import './app/styles/global.css'

import { configure } from 'mobx'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app'

configure({ enforceActions: 'always' })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
