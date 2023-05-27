import { component$, useContext } from '@builder.io/qwik'
import { QwikLogo } from '../icons/qwik'
import styles from './header.module.css'
import { CTX } from '~/root'

export default component$(() => {
  const store = useContext(CTX)
  return (
    <header>
      <h1>Welcome {store.playerName}</h1>
    </header>
  )
})
