import {
  $,
  component$,
  noSerialize,
  useContext,
  useSignal,
  // type QwikChangeEvent,
} from '@builder.io/qwik'
import { useLocation, type DocumentHead } from '@builder.io/qwik-city'
import { CTX } from '~/root'
import styles from './index.module.css'
import Card from '~/components/card/card'

export default component$(() => {
  const store = useContext(CTX)
  const message = useSignal('')
  const location = useLocation()
  const playerName = useSignal('')
  const cardValues = useSignal([0, 1, 2, 3, 5, 8, 13, 21, 34, 55])
  const input = useSignal('')
  const cardsHidden = useSignal(true)
  const error = useSignal('')

  const handleClick = $(() => {
    if (!input.value) return

    const url = new URL('ws://localhost:3000')
    url.searchParams.set('playerName', input.value)
    url.searchParams.set('channelId', location.url.pathname.split('/')[1])
    url.searchParams.set('connectionType', 'join')

    store.ws = noSerialize(new WebSocket(url))

    if (!store.ws) throw new Error('Failed to create websocket')
    store.ws.onmessage = async (event) => {
      console.log(event.data)
      store.channelId = JSON.parse(event.data).channelId || store.channelId
      store.playerName = JSON.parse(event.data).playerName || store.playerName
      store.players = JSON.parse(event.data).players || store.players
      store.playerId = JSON.parse(event.data).playerId || store.playerId
      store.playerPoints =
        JSON.parse(event.data).playerPoints || store.playerPoints
      store.isHost = JSON.parse(event.data).isHost || store.isHost
      error.value = JSON.parse(event.data).error || error.value
    }
  })

  const onClick = (cardValue: number) =>
    $(() =>
      store.ws?.send(
        JSON.stringify({
          playerId: store.playerId,
          cardValue,
        })
      )
    )

  return (
    <>
      {error.value ? (
        <h1>{error.value}</h1>
      ) : store.playerName ? (
        <div class={styles['game-area']}>
          <div class={styles['players-list']}>
            <ul>
              {store.players?.map((player, index) => (
                <li key={index}>
                  {player.playerName}:{' '}
                  {cardsHidden.value
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
                  <button onClick$={() => (cardsHidden.value = false)}>
                    Reveal Estimates
                  </button>
                  <button onClick$={() => (cardsHidden.value = true)}>
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
            name="message-input"
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
