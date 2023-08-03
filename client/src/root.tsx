import {
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
import { type PointingPokerSession } from './types/pointingPokerSession'

import './global.css'

export const CTX = createContextId<PointingPokerSession>('websocket')

const initialPointingPokerSession: PointingPokerSession = {
  ws: undefined,
  playerName: '',
  players: [],
  playerId: '',
  channelId: '',
  playerPoints: {},
  isHost: false,
  error: undefined,
  isHidden: true,
}

export default component$(() => {
  const store = useStore<PointingPokerSession>(initialPointingPokerSession)
  useContextProvider(CTX, store)

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
