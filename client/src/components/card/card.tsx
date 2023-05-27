import { component$ } from '@builder.io/qwik'
import styles from './card.module.css'

interface Props {
  value: number
  onClick: () => void
}

export default component$<Props>(({ value, onClick }) => {
  return (
    <div onClick$={onClick} class={styles.card}>
      <p>{value}</p>
    </div>
  )
})
