import { component$, $, noSerialize, useSignal } from '@builder.io/qwik'
import { type DocumentHead, useNavigate } from '@builder.io/qwik-city'
import { syncWebSocketData } from '~/lib/websocket'
import { API_URL } from '~/lib/url'
import { usePointingPokerSession } from '~/hooks/usePointingPokerSession'

export default component$(() => {
  const nav = useNavigate()
  const store = usePointingPokerSession()
  const input = useSignal('')

  const handleClick = $(async () => {
    if (!input.value) return
    const url = new URL(API_URL)
    url.searchParams.set('playerName', input.value)
    url.searchParams.set('channelId', store.channelId)
    url.searchParams.set('connectionType', 'CREATE')
    store.ws = noSerialize(new WebSocket(url))

    if (!store.ws) throw new Error('Failed to create websocket')
    store.ws.onmessage = async (event) => {
      syncWebSocketData(store, event)
      nav(`/${JSON.parse(event.data).channelId}`)
    }
  })

  return (
    <>
      <label for="name-input">Enter your name:</label>
      <input id="name-input" type="text" bind:value={input} />
      <button onClick$={handleClick}>Create a Room</button>
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
