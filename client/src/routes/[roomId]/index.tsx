import { $, component$, noSerialize, useSignal } from '@builder.io/qwik'
import { useLocation, type DocumentHead } from '@builder.io/qwik-city'
import styles from './index.module.css'
import Card from '~/components/card/card'
import { syncWebSocketData } from '~/lib/websocket'
import { API_URL } from '~/lib/url'
import { socketMessage } from '~/lib/websocket'
import { usePointingPokerSession } from '~/hooks/usePointingPokerSession'

export default component$(() => {
  const store = usePointingPokerSession()
  const location = useLocation()
  const cardValues = useSignal([0, 1, 2, 3, 5, 8, 13, 21, 34, 55])
  const input = useSignal('')

  const handleClick = $(() => {
    if (!input.value) return

    const url = new URL(API_URL)
    url.searchParams.set('playerName', input.value)
    url.searchParams.set('channelId', location.url.pathname.split('/')[1])
    url.searchParams.set('connectionType', 'JOIN')

    store.ws = noSerialize(new WebSocket(url))

    if (!store.ws) throw new Error('Failed to create websocket')
    store.ws.onmessage = async (event) => {
      syncWebSocketData(store, event)
    }
  })

  const onClick = (cardValue: number) =>
    $(() => {
      store.ws?.send(
        socketMessage({
          type: 'CHANGE_POINT_VALUE',
          payload: {
            playerId: store.playerId,
            cardValue,
          },
        })
      )
    })

  if (store.error) {
    return <h1>{store.error}</h1>
  }

  if (!store.playerName) {
    return (
      <>
        <label for="name-input">Enter your name:</label>
        <input type="text" id="name-input" bind:value={input} />
        <button onClick$={handleClick}>Join room</button>
      </>
    )
  }

  return (
    <div class={styles['game-area']}>
      <div class={styles['players-list']}>
        <h3>Players:</h3>
        <ul>
          {store.players?.map((player, index) => (
            <li key={index}>
              <div class={styles['player-tag']}>
                <div class={styles['player-name']}>
                  {player.isHost && '👑 '}
                  {player.playerName}:{' '}
                </div>
                {store.isHidden ? (
                  player.hasVoted ? (
                    <svg
                      class="MuiSvgIcon-root jss64"
                      focusable="false"
                      viewBox="0 0 24 24"
                      width="24px"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.29 16.29L5.7 12.7a.9959.9959 0 010-1.41c.39-.39 1.02-.39 1.41 0L10 14.17l6.88-6.88c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41l-7.59 7.59c-.38.39-1.02.39-1.41 0z"></path>
                    </svg>
                  ) : (
                    <svg
                      class="MuiSvgIcon-root jss201"
                      focusable="false"
                      viewBox="0 0 24 24"
                      width="24px"
                    >
                      <path d="M16.24 7.76C15.07 6.59 13.54 6 12 6v6l-4.24 4.24c2.34 2.34 6.14 2.34 8.49 0 2.34-2.34 2.34-6.14-.01-8.48zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path>
                    </svg>
                  )
                ) : (
                  store.playerPoints?.[store.channelId]?.[player.playerId]
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div class={styles['pointing-area']}>
        <div class={styles['cards-area']}>
          {cardValues.value.map((value, index) => (
            <Card key={index} value={value} onClick={onClick(value)} />
          ))}
        </div>
        {store.isHost && (
          <>
            {store.isHidden ? (
              <button
                class={styles['host-button']}
                onClick$={() =>
                  store.ws?.send(
                    socketMessage({
                      type: 'REVEAL_VOTES',
                    })
                  )
                }
              >
                REVEAL ESTIMATES
              </button>
            ) : (
              <button
                class={styles['host-button']}
                onClick$={() => {
                  store.ws?.send(
                    socketMessage({
                      type: 'RESET_VOTES',
                    })
                  )
                }}
              >
                START NEW ESTIMATION ROUND
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
})

export const head: DocumentHead = {
  title: "HP's very own pointing poker!",
  meta: [
    {
      name: 'description',
      content:
        'Awesome SEO metadata that will surely get this site many hits on Google',
    },
  ],
}
