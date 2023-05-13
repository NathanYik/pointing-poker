import { component$, useSignal } from '@builder.io/qwik'
import styles from './counter.module.css'
import Gauge from '../gauge'

export default component$(() => {
  const count = useSignal(70)

  return (
    <div class={styles['counter-wrapper']}>
      <button class="button-dark button-small" onClick$={() => count.value--}>
        -
      </button>
      <Gauge value={count.value} />
      <button class="button-dark button-small" onClick$={() => count.value++}>
        +
      </button>
    </div>
  )
})
