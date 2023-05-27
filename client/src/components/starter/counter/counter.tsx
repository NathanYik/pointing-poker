import { component$, useSignal } from '@builder.io/qwik'
import styles from './counter.module.css'

export default component$(() => {
  const value = useSignal(0)

  return <div class={styles.card}>{value}</div>
})
