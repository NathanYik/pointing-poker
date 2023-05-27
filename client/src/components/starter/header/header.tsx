import { component$, useContext } from '@builder.io/qwik'
import { CTX } from '~/root'

export default component$(() => {
  const store = useContext(CTX)
  return (
    <header>
      <h1>Welcome {store.playerName}</h1>
    </header>
  )
})
