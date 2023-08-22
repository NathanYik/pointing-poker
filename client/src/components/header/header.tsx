import { component$ } from '@builder.io/qwik'
import { usePointingPokerSession } from '~/hooks/usePointingPokerSession'
import styles from './header.module.css'
import HpLogo from '../hpLogo/hpLogo'

export default component$(() => {
  const store = usePointingPokerSession()
  return (
    <header>
      <div class={styles['header-section']}>
        <HpLogo />
        <h2>HP Instant Ink Pointing Poker</h2>
        {store.playerName && (
          <h2 class={styles['player-name-section']}>{store.playerName}</h2>
        )}
      </div>
    </header>
  )
})
