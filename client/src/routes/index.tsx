import {
  component$,
  $,
  useContext,
  noSerialize,
  useVisibleTask$,
} from '@builder.io/qwik'
import { type DocumentHead, useNavigate } from '@builder.io/qwik-city'
import { CTX } from '~/root'

export default component$(() => {
  const nav = useNavigate()
  const store = useContext(CTX)

  useVisibleTask$(() => {
    store.ws = noSerialize(new WebSocket(`ws://localhost:3000`))
    if (!store.ws) {
      throw new Error('Failed to create websocket')
    }
    store.ws.onmessage = async (event) => {
      console.log(event.data)
      await nav(`/${JSON.parse(event.data).roomId}`)
    }
  })

  const handleClick = $(async () => {
    if (!store.ws) throw new Error('Failed to create websocket')

    store.ws.send(JSON.stringify({ type: 'create' }))
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
