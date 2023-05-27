import {
  type NoSerialize,
  component$,
  createContextId,
  useContextProvider,
  useStore,
} from '@builder.io/qwik'
import {
  QwikCityProvider,
  RouterOutlet,
  ServiceWorkerRegister,
} from '@builder.io/qwik-city'
import { RouterHead } from './components/router-head/router-head'

import './global.css'

type PointingPokerSession = {
  ws: NoSerialize<WebSocket> | undefined
  players: string[]
  playerName: string
  playerId: string
  error?: string
  playerPoints: Record<string, number>
}

export const CTX = createContextId<PointingPokerSession>('websocket')

export default component$(() => {
  const store = useStore<PointingPokerSession>({
    ws: undefined,
    playerName: '',
    players: [],
    playerId: '',
    playerPoints: {},
  })
  useContextProvider(CTX, store)
  /**
   * The root of a QwikCity site always start with the <QwikCityProvider> component,
   * immediately followed by the document's <head> and <body>.
   *
   * Dont remove the `<head>` and `<body>` elements.
   */

  return (
    <QwikCityProvider>
      <head>
        <meta charSet="utf-8" />
        <link rel="manifest" href="/manifest.json" />
        <RouterHead />
      </head>
      <body lang="en">
        <RouterOutlet />
        <ServiceWorkerRegister />
      </body>
    </QwikCityProvider>
  )
})
