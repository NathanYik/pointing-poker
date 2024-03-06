import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { useLocation, type DocumentHead } from '@builder.io/qwik-city'
import styles from './index.module.css'
import Card from '~/components/card/card'
import PieChart from '~/components/pieChart/pieChart'
import PlayersSection from '~/components/playersSection/playersSection'
import {
  usePointingPokerSession,
  useCreateWebSocketConnection,
  useSyncLocalStorage,
  useSendWebSocketMessage,
} from '~/hooks'

export default component$(() => {
  const store = usePointingPokerSession()
  const createWebSocketConnection = useCreateWebSocketConnection()
  const sendWebSocketMessage = useSendWebSocketMessage()
  const location = useLocation()
  const cardValues = useSignal([0, 1, 2, 3, 5, 8, 13, 21, 34, 55])
  const input = useSignal('')
  const linkCopied = useSignal(false)
  const currentChannelId = location.url.pathname.split('/')[1]
  useSyncLocalStorage({ navigate: false })

  useVisibleTask$(() => {
    const previousSessionData = JSON.parse(
      localStorage.getItem(currentChannelId) as string
    )
    if (previousSessionData && !store.channelId) {
      createWebSocketConnection({
        playerId: previousSessionData.playerId,
        connectionType: 'REJOIN',
        channelId: previousSessionData.channelId,
      })
    }
  })

  const handleSubmit = $(() => {
    if (!input.value) return
    createWebSocketConnection({
      playerName: input.value,
      connectionType: 'JOIN',
      channelId: currentChannelId,
    })
  })

  const onClick = (cardValue: number) =>
    $(() =>
      sendWebSocketMessage({
        type: 'CHANGE_POINT_VALUE',
        payload: {
          playerId: store.playerId,
          cardValue,
        },
      })
    )

  if (!store.playerId) {
    return (
      <>
        {store.error && (
          <div class={styles['error-section']}>
            <h2 class={styles['error-title']}>{store.error}</h2>
            <p>
              Check again if the link you copied was correct, or ask for another
              link!
            </p>
          </div>
        )}
        <div class={styles['name-input-section']}>
          <h2 class={styles['input-title']}>Join the pointing poker session</h2>
          <p>Join the room by entering your name</p>
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
          <button form="input-container">JOIN ROOM</button>
        </div>
      </>
    )
  }

  return (
    <>
      <div class={styles['game-area']}>
        <PlayersSection />
        <div class={styles['pointing-area']}>
          <div class={styles['share-link-section']}>
            <h4>
              {linkCopied.value
                ? 'Copied!'
                : 'Click this link to copy and paste to others:'}
            </h4>
            <p
              class={styles['share-link']}
              onClick$={$(() =>
                navigator.clipboard
                  .writeText(location.url.href)
                  .then(() => (linkCopied.value = true))
                  .catch(() => console.log('boo'))
              )}
            >
              {location.url.href}
            </p>
          </div>
          {store.isHidden ? (
            <div class={styles['cards-area']}>
              {cardValues.value.map((value, index) => (
                <Card key={index} value={value} onClick={onClick(value)} />
              ))}
            </div>
          ) : (
            <PieChart />
          )}
          {store.isHost && (
            <>
              {store.isHidden ? (
                <button
                  onClick$={() =>
                    sendWebSocketMessage({ type: 'REVEAL_VOTES' })
                  }
                >
                  REVEAL ESTIMATES
                </button>
              ) : (
                <button
                  onClick$={() => sendWebSocketMessage({ type: 'RESET_VOTES' })}
                >
                  START NEW ESTIMATION ROUND
                </button>
              )}
            </>
          )}
        </div>
      </div>
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
