import { component$, Slot } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import { usePointingPokerSession } from '~/hooks/usePointingPokerSession'

export const useServerTimeLoader = routeLoader$(() => {
  return {
    date: 'hsafhaksfhsakh',
  }
})

export default component$(() => {
  const store = usePointingPokerSession()

  return (
    <>
      <header>
        {store.playerName ? (
          <h1>Welcome {store.playerName}</h1>
        ) : (
          <h1>HP Instant Ink Pointing Poker</h1>
        )}
      </header>
      <main>
        <Slot />
      </main>
    </>
  )
})
