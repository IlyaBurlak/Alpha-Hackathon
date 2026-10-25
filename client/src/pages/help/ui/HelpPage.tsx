import { Icon } from '@/shared/ui'

import styles from './HelpPage.module.css'

const QUESTIONS = [
  {
    question: 'Что нужно заполнить самому?',
    answer:
      'Цель, сумму и срок. Реквизиты подтягиваем из профиля банка и ЕГРЮЛ, выручку предзаполняем по оборотам на счёте. Вы проверяете контакты, уточняете выручку и рассказываете о кредитах в других банках.',
  },
  {
    question: 'Почему я вижу такие варианты?',
    answer:
      'Показываем те, что доступны для вашей заявки: их может быть больше или меньше двух. Без залога быстрее и проще, с залогом ниже ставка и выше шанс одобрения.',
  },
  {
    question: 'Что такое шанс одобрения?',
    answer:
      'Предварительная оценка по выручке, долгам, возрасту бизнеса и кредитной истории. Это не решение: окончательно заявку проверяет банк.',
  },
  { question: 'Сколько ждать решения?', answer: 'Обычно до одного рабочего дня. Статус виден в заявке.' },
  { question: 'Как подписать договор?', answer: 'Простой электронной подписью прямо в кабинете.' },
  { question: 'Можно отозвать заявку?', answer: 'Пока нельзя. Эту возможность мы добавим позже.' },
] as const

export function HelpPage() {
  return (
    <>
      <h1>Помощь</h1>
      <p className={styles.subtitle}>Коротко о том, как устроено оформление кредита</p>
      <div className={styles.faq}>
        {QUESTIONS.map(({ question, answer }) => (
          <details key={question} className={styles.item}>
            <summary className={styles.question}>
              {question}
              <Icon name="down" size={20} />
            </summary>
            <p className={styles.answer}>{answer}</p>
          </details>
        ))}
      </div>
      <p className={styles.note}>Демо-версия. Данные синтетические, реестры, БКИ и скоринг смоделированы.</p>
    </>
  )
}
