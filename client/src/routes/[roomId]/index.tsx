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
  console.log(store)

  useVisibleTask$(() => {
    console.log(store)
    if (!store.ws) {
      store.ws = noSerialize(new WebSocket('ws://localhost:3000'))
    }
    if (!store.ws) throw new Error('Failed to create websocket')
    store.ws.onmessage = (e) => {
      console.log(e.data)
      playerName.value = JSON.parse(e.data).playerName
    }
  })

  const handleClick = $(() => {
    console.log(store)
  })

  const handleChange = $((e: QwikChangeEvent<HTMLInputElement>) => {
    input.value = e.target.value
    console.log(store)
    store.ws?.send(
      JSON.stringify({
        type: 'join',
        playerName: input.value,
        roomId: location.url.pathname.split('/')[1],
      })
    )
  })

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
})
