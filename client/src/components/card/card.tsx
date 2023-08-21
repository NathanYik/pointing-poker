import { component$ } from '@builder.io/qwik'
import styles from './card.module.css'
import { usePointingPokerSession } from '~/hooks/usePointingPokerSession'

interface Props {
  value: number
  onClick: () => void
}

export default component$<Props>(({ value, onClick }) => {
  const store = usePointingPokerSession()
  return (
    <div
      onClick$={onClick}
      class={
        store.players.find((player) => player.playerId === store.playerId)
          ?.selectedCardValue === value
          ? styles['selected-card']
          : styles.card
      }
    >
      <p>{value}</p>
    </div>
  )
})
