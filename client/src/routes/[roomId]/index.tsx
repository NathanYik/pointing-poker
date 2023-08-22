import { $, component$, noSerialize, useSignal } from '@builder.io/qwik'
import { useLocation, type DocumentHead } from '@builder.io/qwik-city'
import styles from './index.module.css'
import Card from '~/components/card/card'
import { syncWebSocketData } from '~/lib/websocket'
import { API_URL } from '~/lib/url'
import { socketMessage } from '~/lib/websocket'
import { usePointingPokerSession } from '~/hooks/usePointingPokerSession'
import CheckmarkIcon from '~/components/checkmarkIcon/checkmarkIcon'
import InProgressIcon from '~/components/inProgressIcon/inProgressIcon'
import PieChart from '~/components/pieChart/pieChart'

export default component$(() => {
  const store = usePointingPokerSession()
  const location = useLocation()
  const cardValues = useSignal([0, 1, 2, 3, 5, 8, 13, 21, 34, 55])
  const input = useSignal('')
  const linkCopied = useSignal(false)

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
    $(() =>
      store.ws?.send(
        socketMessage({
          type: 'CHANGE_POINT_VALUE',
          payload: {
            playerId: store.playerId,
            cardValue,
          },
        })
      )
    )

  if (!store.playerName) {
    return (
      <>
        {store.error && (
          <div class={styles['error-section']}>
            <h2 class={styles['error-title']}>{store.error}</h2>
            <p>
              Check again if the link you copied was correct, or ask for another
              link!
            </p>
          </div>
        )}
        <div class={styles['name-input-section']}>
          <h2>Join the pointing poker session</h2>
          <p>Join the room by entering your name</p>
          <div class={styles['input-container']}>
            <input
              type="text"
              id="name-input"
              bind:value={input}
              required
              placeholder=""
            />
            <label for="name-input">Enter your name</label>
          </div>
          <button onClick$={handleClick}>JOIN ROOM</button>
        </div>
      </>
    )
  }

  return (
    <>
      <div class={styles['game-area']}>
        <div class={styles['players-section']}>
          <h3 class={styles['players-title']}>Players:</h3>
          <ul class={styles['players-list']}>
            {store.players?.map((player, index) => (
              <li key={index}>
                <div class={styles['player-tag']}>
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
                  ) : (
                    store.playerPoints?.[player.playerId]
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div class={styles['pointing-area']}>
          <div class={styles['share-link-section']}>
            <h4>
              {linkCopied.value
                ? 'Copied!'
                : 'Click this link to copy and paste to others:'}
            </h4>
            <p
              class={styles['share-link']}
              onClick$={$(() =>
                navigator.clipboard
                  .writeText(location.url.href)
                  .then(() => (linkCopied.value = true))
                  .catch(() => console.log('boo'))
              )}
            >
              {location.url.href}
            </p>
          </div>
          {store.isHidden ? (
            <div class={styles['cards-area']}>
              {cardValues.value.map((value, index) => (
                <Card key={index} value={value} onClick={onClick(value)} />
              ))}
            </div>
          ) : (
            <div class={styles['pie-chart']}>
              <PieChart />
            </div>
          )}
          {store.isHost && (
            <>
              {store.isHidden ? (
                <button
                  onClick$={() => {
                    store.ws?.send(
                      socketMessage({
                        type: 'REVEAL_VOTES',
                      })
                    )
                  }}
                >
                  REVEAL ESTIMATES
                </button>
              ) : (
                <button
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
    </>
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
