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
  const disabled = useSignal(false)

  const handleSubmit = $(async () => {
    if (!input.value) return
    disabled.value = true
    const url = new URL(API_URL)
    url.searchParams.set('playerName', input.value)
    url.searchParams.set('connectionType', 'CREATE')
    store.ws = noSerialize(new WebSocket(url))
    store.channelId = ''

    if (!store.ws) throw new Error('Failed to create websocket')
    store.ws.onmessage = (event) => {
      syncWebSocketData(store, event)
    }
    const intervalID = setInterval(() => {
      if (store?.ws?.readyState === 1 && !store.error && store.channelId) {
        clearInterval(intervalID)
        disabled.value = false
        nav(store.channelId)
      }
    }, 5)
  })

  return (
    <div class={styles['name-input-section']}>
      <h2 class={styles['input-title']}>
        Whoo we have our own pointing poker app now!
      </h2>
      <p>Create a room by entering your name</p>
      {store.error && (
        <div class={styles['error-section']}>
          <h2 class={styles['error-title']}>{store.error}</h2>
        </div>
      )}
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
      <button disabled={disabled.value} form="input-container" type="submit">
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
