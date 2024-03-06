import { component$, $, useSignal } from '@builder.io/qwik'
import { type DocumentHead } from '@builder.io/qwik-city'
import styles from './index.module.css'
import {
  usePointingPokerSession,
  useCreateWebSocketConnection,
  useSyncLocalStorage,
} from '~/hooks'

export default component$(() => {
  const store = usePointingPokerSession()
  const createWebSocketConnection = useCreateWebSocketConnection()
  const input = useSignal('')
  useSyncLocalStorage({ navigate: true })

  const handleSubmit = $(async () => {
    if (!input.value) return
    createWebSocketConnection({
      playerName: input.value,
      connectionType: 'CREATE',
    })
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
