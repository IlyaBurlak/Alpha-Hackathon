import { Button } from '@alfalab/core-components/button'
import { Typography } from '@alfalab/core-components/typography'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'

import { ProductOfferCard } from '@/entities/application'
import type { Application, ProductOffer } from '@/entities/application'

import { SelectProductStore } from '../model/select-product-store'
import styles from './ProductOffers.module.css'

interface ProductOffersProps {
  applicationId: number
  offers: ProductOffer[]
  onSelected: (application: Application) => void
}

export const ProductOffers = observer(function ProductOffers({ applicationId, offers, onSelected }: ProductOffersProps) {
  const [store] = useState(() => new SelectProductStore())

  const handleSelect = async (productId: number) => {
    const application = await store.select(applicationId, productId)
    if (application) onSelected(application)
  }

  if (offers.length === 0) {
    return <Typography.Text view="primary-medium">Подходящих продуктов для этой заявки нет.</Typography.Text>
  }

  return (
    <div className={styles.offers}>
      <ul className={styles.list} aria-label="Доступные продукты">
        {offers.map((offer) => (
          <li key={offer.id}>
            <ProductOfferCard
              offer={offer}
              action={
                <Button
                  view="accent"
                  size={40}
                  loading={store.pendingProductId === offer.id}
                  disabled={store.isSubmitting}
                  onClick={() => void handleSelect(offer.id)}
                >
                  Выбрать
                </Button>
              }
            />
          </li>
        ))}
      </ul>
      {store.errorMessage && (
        <Typography.Text role="alert" view="primary-small" color="negative">
          {store.errorMessage}
        </Typography.Text>
      )}
    </div>
  )
})
