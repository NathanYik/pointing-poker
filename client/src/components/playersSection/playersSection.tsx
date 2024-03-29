import { $, component$, useSignal } from '@builder.io/qwik'
import styles from './playersSection.module.css'
import { usePointingPokerSession } from '~/hooks/usePointingPokerSession'
import CheckmarkIcon from '../checkmarkIcon/checkmarkIcon'
import InProgressIcon from '../inProgressIcon/inProgressIcon'
import NoVoteIcon from '../noVoteIcon/noVoteIcon'
import { useSendWebSocketMessage } from '~/hooks'

export default component$(() => {
  const store = usePointingPokerSession()
  const sendWebSocketMessage = useSendWebSocketMessage()
  const isHovering = useSignal<string | null>(null)

  return (
    <div class={styles['players-section']}>
      {store.isHost && <p>Hover over a player to transfer host privileges</p>}
      <h3 class={styles['players-title']}>Players:</h3>
      <ul class={styles['players-list']}>
        {store.players?.map((player, index) => (
          <div
            onMouseEnter$={$(() => {
              if (store.isHost) {
                isHovering.value = player.playerId
              }
            })}
            onMouseLeave$={$(() => {
              if (store.isHost) {
                isHovering.value = null
              }
            })}
            key={index}
          >
            <li
              class={`${styles['player-tag']} ${
                !player.connectionActive && styles['player-disconnected']
              }`}
              key={index}
            >
              <div class={styles['player-name']}>
                {player.isHost && '👑 '}
                {player.playerName}:{' '}
              </div>
              {store.isHidden ? (
                player.hasVoted ? (
                  <CheckmarkIcon />
                ) : (
                  <InProgressIcon />
                )
              ) : store.playerPoints?.[player.playerId] !== undefined ? (
                <div class={styles['player-points']}>
                  {store.playerPoints?.[player.playerId]}
                </div>
              ) : (
                <NoVoteIcon />
              )}
            </li>
            {isHovering.value === player.playerId && store.isHost && (
              <button
                class="hovering"
                onClick$={() => {
                  isHovering.value = null
                  sendWebSocketMessage({
                    type: 'CHANGE_HOST',
                    payload: { playerId: player.playerId },
                  })
                }}
              >
                Make Host
              </button>
            )}
          </div>
        ))}
      </ul>
    </div>
  )
})
