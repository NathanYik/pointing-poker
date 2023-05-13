import {
  component$,
  $,
  useSignal,
  useContext,
  type QwikChangeEvent,
  useVisibleTask$,
  noSerialize
} from '@builder.io/qwik'
import { useLocation } from '@builder.io/qwik-city'
import { CTX } from '~/root'

export default component$(() => {
  const store = useContext(CTX)
  const message = useSignal('')
  const input = useSignal('')
  const location = useLocation()

  useVisibleTask$(() => {
    console.log(store)
    store.ws = noSerialize(
      new WebSocket(`ws://localhost:3000${location.url.pathname}`)
    )
    if (store.ws) {
      store.ws.onmessage = e => {
        console.log(e.data)
        message.value = e.data
      }
    }
  })

  const handleClick = $(() => {
    console.log('do something')
  })

  const handleChange = $((e: QwikChangeEvent<HTMLInputElement>) => {
    input.value = e.target.value
    console.log(store)
    store.ws?.send(input.value)
  })

  return (
    <>
      <label for="message-input"></label>
      <input
        type="text"
        name="message-input"
        value={message.value}
        onChange$={handleChange}
      />
      <button onClick$={handleClick}>CLick me plz</button>
      <h1>{message.value}</h1>
    </>
  )
})
