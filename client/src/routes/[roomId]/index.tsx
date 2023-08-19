import {
  $,
  component$,
  noSerialize,
  useSignal,
  useTask$,
} from '@builder.io/qwik'
import { useLocation, type DocumentHead } from '@builder.io/qwik-city'
import styles from './index.module.css'
import Card from '~/components/card/card'
import { syncWebSocketData } from '~/lib/websocket'
import { API_URL } from '~/lib/url'
import { socketMessage } from '~/lib/websocket'
import { usePointingPokerSession } from '~/hooks/usePointingPokerSession'

export default component$(() => {
  const store = usePointingPokerSession()
  const message = useSignal('')
  const location = useLocation()
  const playerName = useSignal('')
  const cardValues = useSignal([0, 1, 2, 3, 5, 8, 13, 21, 34, 55])
  const input = useSignal('')

  useTask$(({ track, cleanup }) => {
    track(() => store.triggerPing)
    const timeout = setTimeout(() => {
      console.log(
        `Websocket timed out for player ID: ${store.playerId}, closing connection`
      )
      return store.ws?.close()
    }, 60000)
    cleanup(() => clearTimeout(timeout))
  })

  const handleClick = $(() => {
    if (!input.value) return

    const url = new URL(API_URL)
    url.searchParams.set('playerName', input.value)
    url.searchParams.set('channelId', location.url.pathname.split('/')[1])
    url.searchParams.set('connectionType', 'join')

    store.ws = noSerialize(new WebSocket(url))

    if (!store.ws) throw new Error('Failed to create websocket')
    store.ws.onmessage = async (event) => {
      const data = JSON.parse(event.data)
      if (data.ping) {
        console.log('Received incoming ping')
        store.triggerPing = !store.triggerPing
        store.ws?.send(socketMessage({ type: 'PONG' }))
      }
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

  return (
    <>
      {store.error ? (
        <h1>{store.error}</h1>
      ) : store.playerName ? (
        <div class={styles['game-area']}>
          <div class={styles['players-list']}>
            <ul>
              {store.players?.map((player, index) => (
                <li key={index}>
                  {player.playerName}:{' '}
                  {store.isHidden
                    ? 'Hidden'
                    : store.playerPoints?.[store.channelId]?.[player.playerId]}
                </li>
              ))}
            </ul>
          </div>
          <div class={styles['pointing-area']}>
            <>
              <div class={styles['cards-area']}>
                {cardValues.value.map((value, index) => (
                  <Card key={index} value={value} onClick={onClick(value)} />
                ))}
              </div>
              <p>{store.playerPoints?.[store.channelId]?.[store.playerId]}</p>
              {store.isHost && (
                <>
                  <button
                    onClick$={() =>
                      store.ws?.send(
                        socketMessage({
                          type: 'REVEAL_VOTES',
                        })
                      )
                    }
                  >
                    Reveal Estimates
                  </button>
                  <button
                    onClick$={() =>
                      store.ws?.send(
                        socketMessage({
                          type: 'RESET_VOTES',
                        })
                      )
                    }
                  >
                    Reset Votes
                  </button>
                </>
              )}
            </>
          </div>
        </div>
      ) : (
        <>
          <label for="message-input">Enter your name:</label>
          <input
            type="text"
            id="message-input"
            value={message.value}
            bind:value={input}
          />
          <button onClick$={handleClick}>Submit</button>
          <h1>{playerName.value}</h1>
        </>
      )}
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
