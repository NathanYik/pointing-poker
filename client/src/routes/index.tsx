import {
  component$,
  $,
  noSerialize,
  useComputed$,
  useSignal,
} from '@builder.io/qwik'
import { type DocumentHead, useNavigate } from '@builder.io/qwik-city'
import { socketMessage, syncWebSocketData } from '~/lib/websocket'
import { API_URL } from '~/lib/url'
import { usePointingPokerSession } from '~/hooks/useStore'

export default component$(() => {
  const nav = useNavigate()
  const store = usePointingPokerSession()
  const input = useSignal('')
  const status = useComputed$(() => {
    if (store.ws?.readyState === 1) return 'Connected'
    if (store.ws?.readyState === 3) return 'Unable to open websocket'
    return 'Not connected'
  })

  // useVisibleTask$(({ track, cleanup }) => {
  //   track(() => pingTimeout.value)
  //   if (!pingTimeout.value) return
  //   pingTimeout.value = false

  //   const timeout = setTimeout(() => {
  //     store.ws?.close()
  //   }, 5000)
  //   console.log('hi?', timeout)
  //   cleanup(() => {
  //     console.log('cleanup')
  //     clearTimeout(timeout)
  //   })
  // })

  const handleClick = $(async () => {
    if (!input.value) return
    const url = new URL(API_URL)
    url.searchParams.set('playerName', input.value)
    url.searchParams.set('connectionType', 'create')
    store.ws = noSerialize(new WebSocket(url))

    if (!store.ws) throw new Error('Failed to create websocket')
    store.ws.onmessage = async (event) => {
      syncWebSocketData(store, event)
      const data = JSON.parse(event.data)
      if (data.ping) {
        console.log('pinged')
        store.triggerPing = !store.triggerPing
        store.ws?.send(socketMessage({ type: 'PONG' }))
      }
      if (data.shouldRedirect) {
        nav(`/${JSON.parse(event.data).channelId}`)
      }
    }
  })

  return (
    <>
      <h1>Hmm...</h1>
      <button onClick$={handleClick}>Create a Room</button>
      <input
        type="text"
        onInput$={(e: Event) =>
          (input.value = (e.target as HTMLInputElement).value)
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
