import { component$, Slot, useContext } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import Header from '~/components/starter/header/header'
import { CTX } from '~/root'

export const useServerTimeLoader = routeLoader$(() => {
  return {
    date: 'hsafhaksfhsakh',
  }
})

export default component$(() => {
  const store = useContext(CTX)

  return (
    <>
      {store.playerName && <Header />}
      <main>
        <Slot />
      </main>
    </>
  )
})
