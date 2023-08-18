import {
  component$,
  $,
  useContext,
  noSerialize,
  // useVisibleTask$,
  useComputed$,
  // useSignal,
} from '@builder.io/qwik'
import { type DocumentHead, useNavigate } from '@builder.io/qwik-city'
import { syncWebSocketData } from '~/lib/websocket'
import { CTX } from '~/root'
import { API_URL } from '~/lib/url'


export default component$(() => {
  const nav = useNavigate()
  const store = useContext(CTX)
  const status = useComputed$(() => {
    if (store.ws?.readyState === 1) return 'Connected'
    if (store.ws?.readyState === 3) return 'Unable to open websocket'
    return 'Not connected'
  })

  const handleClick = $(async () => {
    if (!store.playerName) return
    const url = new URL(API_URL)
    url.searchParams.set('playerName', store.playerName)
    url.searchParams.set('connectionType', 'create')
    store.ws = noSerialize(new WebSocket(url))

    if (!store.ws) throw new Error('Failed to create websocket')
    store.ws.onmessage = async (event) => {
      syncWebSocketData(store, event)
      nav(`/${JSON.parse(event.data).channelId}`)
    }
  })

  return (
    <>
      <h1>Try again I guess</h1>
      <button onClick$={handleClick}>Create a Room</button>
      <input
        type="text"
        onInput$={(e: Event) =>
          (store.playerName = (e.target as HTMLInputElement).value)
        }
      />
      <p>{status.value}</p>
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
