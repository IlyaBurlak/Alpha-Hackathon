import { Button } from '@alfalab/core-components/button'
import { Input } from '@alfalab/core-components/input'
import { Tag } from '@alfalab/core-components/tag'
import { Typography } from '@alfalab/core-components/typography'

import styles from './HomePage.module.css'

const CONNECTED_COMPONENTS = ['Button', 'Input', 'Tag', 'Typography'] as const

export function HomePage() {
  return (
    <main className={styles.page}>
      <Typography.Title tag="h1" view="large">
        Дизайн-система подключена
      </Typography.Title>
      <Typography.Text view="primary-medium" color="secondary">
        Компоненты @alfalab/core-components и токены стилей готовы к использованию.
      </Typography.Text>

      <ul className={styles.components} aria-label="Подключённые компоненты">
        {CONNECTED_COMPONENTS.map((name) => (
          <li key={name}>
            <Tag size={32} view="filled" shape="rounded">
              {name}
            </Tag>
          </li>
        ))}
      </ul>

      <div className={styles.demo}>
        <Input label="Название компании" block />
        <Button view="accent" size={48}>
          Подобрать финансирование
        </Button>
      </div>
    </main>
  )
}
