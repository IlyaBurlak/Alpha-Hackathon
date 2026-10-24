import { Button } from '@alfalab/core-components/button'
import { Typography } from '@alfalab/core-components/typography'

import { LoanTerms } from '@/entities/application'
import type { Application } from '@/entities/application'
import { ProductOffers } from '@/features/select-product'

interface ProductSectionProps {
  application: Application
  onSelected: (application: Application) => void
  onRetry: () => void
}

export function ProductSection({ application, onSelected, onRetry }: ProductSectionProps) {
  const { productChoice } = application

  if (productChoice.kind === 'selected') {
    return (
      <>
        <Typography.Title tag="h2" view="small" font="system">
          Выбранный продукт
        </Typography.Title>
        <Typography.Text view="primary-medium">{productChoice.product.name}</Typography.Text>
        <Typography.Text view="primary-small">Ставка: {productChoice.product.interestRate}%</Typography.Text>
        <Typography.Text view="primary-small" color="secondary">
          Выплаты: {productChoice.product.payments}
        </Typography.Text>
        <LoanTerms
          sum={application.sum}
          interestRate={productChoice.product.interestRate}
          creditTime={application.creditTime}
        />
      </>
    )
  }

  if (productChoice.kind === 'offers') {
    return (
      <>
        <Typography.Title tag="h2" view="small" font="system">
          Выберите продукт
        </Typography.Title>
        <ProductOffers applicationId={application.id} offers={productChoice.items} onSelected={onSelected} />
      </>
    )
  }

  return (
    <>
      <Typography.Text view="primary-medium">
        Сервисы банка сейчас недоступны, продукты показать не получилось. Попробуйте позже.
      </Typography.Text>
      <Button view="secondary" size={40} onClick={onRetry}>
        Повторить
      </Button>
    </>
  )
}
