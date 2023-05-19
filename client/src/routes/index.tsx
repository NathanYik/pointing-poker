import {
  component$,
  $,
  useContext,
  noSerialize,
  // useVisibleTask$,
  type QwikChangeEvent,
  // useSignal,
} from '@builder.io/qwik'
import { type DocumentHead, useNavigate } from '@builder.io/qwik-city'
import { CTX } from '~/root'

export default component$(() => {
  const nav = useNavigate()
  const store = useContext(CTX)

  // useVisibleTask$(() => {})

  const handleClick = $(async () => {
    if (!store.playerName) return

    const url = new URL('ws://localhost:3000')
    url.searchParams.set('playerName', store.playerName)
    url.searchParams.set('connectionType', 'create')
    store.ws = noSerialize(new WebSocket(url))

    if (!store.ws) throw new Error('Failed to create websocket')
    store.ws.onmessage = async (event) => {
      console.log(event.data)
      store.players = JSON.parse(event.data).players
      await nav(`/${JSON.parse(event.data).channelId}`)
    }
  })

  return (
    <>
      <button onClick$={handleClick}>Create Room</button>
      <input
        type="text"
        onChange$={$(
          (e: QwikChangeEvent<HTMLInputElement>) =>
            (store.playerName = e.target.value)
        )}
      />
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
