import {
  component$,
  $,
  useContext,
  noSerialize,
  useVisibleTask$,
  useSignal,
} from '@builder.io/qwik'
import { type DocumentHead, useNavigate } from '@builder.io/qwik-city'
import { CTX } from '~/root'

export default component$(() => {
  const nav = useNavigate()
  const store = useContext(CTX)
  const roomId = useSignal<string | null>(null)

  useVisibleTask$(() => {
    store.ws = noSerialize(new WebSocket(`ws://localhost:3000`))
    if (!store.ws) {
      throw new Error('Failed to create websocket')
    }
    store.ws.onmessage = async (event) => {
      console.log(event.data)
      await nav(`/${JSON.parse(event.data).roomId}`)
      console.log(roomId.value)
    }
  })

  const handleClick = $(async () => {
    if (!store.ws) {
      throw new Error('Failed to create websocket')
    }
    roomId.value = Math.random().toString(36).substring(2, 36)
    store.ws.send(JSON.stringify({ roomId: roomId.value, type: 'create' }))
  })

  return (
    <>
      <button onClick$={handleClick}>Create Room</button>
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
