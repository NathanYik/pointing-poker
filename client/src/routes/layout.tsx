import { component$, Slot } from '@builder.io/qwik'
import Header from '~/components/header/header'

export default component$(() => (
  <>
    <Header />
    <main>
      <Slot />
    </main>
  </>
))
