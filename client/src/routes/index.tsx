import {
  component$,
  $,
  useSignal,
  useVisibleTask$,
  noSerialize,
  type NoSerialize,
  type QwikChangeEvent
} from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'

export default component$(() => {
  const message = useSignal('')
  const input = useSignal('')
  const ws = useSignal<NoSerialize<WebSocket>>()

  useVisibleTask$(() => {
    ws.value = noSerialize(new WebSocket('ws://localhost:3000'))
    if (!ws.value) return
    ws.value.onopen = () => {
      console.log('connected')
    }
    ws.value.onmessage = e => {
      console.log(e.data)
      message.value = e.data
    }
  })

  const handleClick = $(() => {
    if (!ws.value) return

    ws.value.send(input.value)
  })

  const handleChange = $((e: QwikChangeEvent<HTMLInputElement>) => {
    if (!ws.value) return

    input.value = e.target.value
    ws.value.send(input.value)
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

export const head: DocumentHead = {
  title: 'Welcome to Qwik',
  meta: [
    {
      name: 'description',
      content: 'Qwik site description'
    }
  ]
}
