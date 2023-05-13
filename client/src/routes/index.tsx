import { component$, $, useContext, noSerialize } from '@builder.io/qwik'
import { type DocumentHead, useNavigate } from '@builder.io/qwik-city'
import { CTX } from '~/root'

export default component$(() => {
  const nav = useNavigate()
  const store = useContext(CTX)

  const handleClick = $(async () => {
    const newRoomId = Math.random().toString(36).substring(2, 13)
    store.ws = noSerialize(new WebSocket(`ws://localhost:3000/${newRoomId}`))
    console.log(store.ws)
    await nav(`/${newRoomId}`)
  })

  return (
    <>
      <button onClick$={handleClick}>Create Room</button>
    </>
  )
})

export const head: DocumentHead = {
  title: "HP's very own pointing poker!",
  meta: [
    {
      name: 'description',
      content:
        'Awesome SEO metadata that will surely get this site many hits on Google'
    }
  ]
}
