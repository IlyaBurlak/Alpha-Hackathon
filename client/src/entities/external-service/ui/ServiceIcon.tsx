import { BankMIcon } from '@alfalab/icons-glyph/BankMIcon'
import { ChartLineAscMIcon } from '@alfalab/icons-glyph/ChartLineAscMIcon'
import { DocumentCheckmarkMIcon } from '@alfalab/icons-glyph/DocumentCheckmarkMIcon'

import type { ExternalServiceId } from '../model/types'

interface ServiceIconProps {
  serviceId: ExternalServiceId
}

export function ServiceIcon({ serviceId }: ServiceIconProps) {
  switch (serviceId) {
    case 'bank':
      return <BankMIcon />
    case 'credit-bureau':
      return <ChartLineAscMIcon />
    case 'register':
      return <DocumentCheckmarkMIcon />
  }
}
