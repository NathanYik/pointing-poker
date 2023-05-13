import { component$, Slot } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'

export const useServerTimeLoader = routeLoader$(() => {
  return {
    date: 'hsafhaksfhsakh'
  }
})

export default component$(() => {
  return (
    <>
      <main>
        <Slot />
      </main>
    </>
  )
})
