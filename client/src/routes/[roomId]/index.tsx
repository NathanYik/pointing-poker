import {
  component$,
  $,
  useSignal,
  useContext,
  type QwikChangeEvent,
  useVisibleTask$,
  noSerialize,
} from '@builder.io/qwik'
import { useLocation } from '@builder.io/qwik-city'
import { CTX } from '~/root'

export default component$(() => {
  const store = useContext(CTX)
  const message = useSignal('')
  const location = useLocation()
  const playerName = useSignal('')
  const input = useSignal('')

  // useVisibleTask$(() => {
  //   console.log(store)
  //   if (!store.ws) {
  //     store.ws = noSerialize(new WebSocket('ws://localhost:3000'))
  //   }
  //   if (!store.ws) throw new Error('Failed to create websocket')
  //   store.ws.onmessage = (e) => {
  //     console.log(e.data)
  //     playerName.value = JSON.parse(e.data).playerName
  //   }
  //   const pollId = setInterval(() => {
  //     if (!store.ws) throw new Error('Failed to create websocket')
  //     console.log('polling')
  //     if (store.ws.readyState !== 1) return
  //     store.ws.send(
  //       JSON.stringify({
  //         type: 'join',
  //         playerName: input.value,
  //         roomId: location.url.pathname.split('/')[1],
  //       })
  //     )
  //     clearInterval(pollId)
  //   }, 200)
  // })

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
      store.playerName = JSON.parse(event.data).playerName
      store.players = JSON.parse(event.data).players
      store.playerId = JSON.parse(event.data).playerId
      store.error = JSON.parse(event.data).error
    }
  })

  const handleChange = $((e: QwikChangeEvent<HTMLInputElement>) => {
    input.value = e.target.value
    console.log(store)
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
    <>
      <h1>Welcome ${store.playerName}</h1>
      <h2>Players:</h2>
      <ul>
        {store.players.map((player, index) => {
          console.log(player)
          console.log('hi?')
          return <li key={index}>{player}</li>
        })}
      </ul>
    </>
  )
})
