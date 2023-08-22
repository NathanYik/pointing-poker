import { component$ } from '@builder.io/qwik'
import styles from './card.module.css'
import { usePointingPokerSession } from '~/hooks/usePointingPokerSession'

interface Props {
  value: number
  onClick: () => void
}

export default component$<Props>(({ value, onClick }) => {
  const store = usePointingPokerSession()
  const isSelected =
    store.players.find((player) => player.playerId === store.playerId)
      ?.selectedCardValue === value
  return (
    <div
      onClick$={onClick}
      class={`${styles.card} ${isSelected && styles['selected']}`}
    >
      <p>{value}</p>
    </div>
  )
})
