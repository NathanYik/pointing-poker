import { component$, $, noSerialize, useSignal } from '@builder.io/qwik'
import { type DocumentHead, useNavigate } from '@builder.io/qwik-city'
import { syncWebSocketData } from '~/lib/websocket'
import { API_URL } from '~/lib/url'
import styles from './index.module.css'
import { usePointingPokerSession } from '~/hooks/usePointingPokerSession'

export default component$(() => {
  const nav = useNavigate()
  const store = usePointingPokerSession()
  const input = useSignal('')

  const handleSubmit = $(async () => {
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
    <div class={styles['name-input-section']}>
      <h2 class={styles['input-title']}>
        Whoo we have our own pointing poker app now!
      </h2>
      <p>Create a room by entering your name</p>
      <form
        id="input-container"
        preventdefault:submit
        onSubmit$={handleSubmit}
        class={styles['input-container']}
      >
        <input
          class={styles['name-input']}
          id="name-input"
          type="text"
          bind:value={input}
          placeholder=""
          required
        />
        <label class={styles['name-label']} for="name-input">
          Enter your name
        </label>
      </form>
      <button form="input-container" type="submit">
        CREATE ROOM
      </button>
    </div>
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
