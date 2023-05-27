import {
  $,
  component$,
  noSerialize,
  useContext,
  useSignal,
  type QwikChangeEvent,
} from '@builder.io/qwik'
import { useLocation } from '@builder.io/qwik-city'
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
      console.log(store)
      store.playerName = JSON.parse(event.data).playerName
      store.players = JSON.parse(event.data).players
      store.playerId = JSON.parse(event.data).playerId
      store.playerPoints = JSON.parse(event.data).cardValue
      store.error = JSON.parse(event.data).error
    }
  })

  const handleChange = $((e: QwikChangeEvent<HTMLInputElement>) => {
    input.value = e.target.value
    console.log(store)
  })

  const onClick = (cardValue: number) =>
    $(() => {
      console.log('clicked')
      // playerPoints.value = cardValue

      return store.ws?.send(
        JSON.stringify({
          playerId: store.playerId,
          cardValue,
        })
      )
    })

  if (store.error) {
    return <h1>{store.error}</h1>
  }

  if (!store.playerName) {
    return (
      <>
        <label for="message-input">Enter your name:</label>
        <input
          type="text"
          name="message-input"
          value={message.value}
          onChange$={handleChange}
        />
        <button onClick$={handleClick}>Submit</button>
        <h1>{playerName.value}</h1>
      </>
    )
  }

  return (
    <div class={styles.gameArea}>
      <div class={styles.playersList}>
        <ul>
          {store.players?.map((player, index) => (
            <li key={index}>{player}</li>
          ))}
        </ul>
      </div>
      <div class={styles.pointingArea}>
        {cardValues.value.map((value, index) => (
          <Card key={index} value={value} onClick={onClick(value)} />
        ))}
      </div>
      <p>{store.playerPoints[store.playerId]}</p>
    </div>
  )
})
