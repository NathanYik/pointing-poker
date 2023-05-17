import {
  type NoSerialize,
  component$,
  createContextId,
  noSerialize,
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

export const CTX = createContextId<{
  ws: NoSerialize<WebSocket>
  players: string[]
}>('websocket')

export default component$(() => {
  const store = useStore<{
    ws: NoSerialize<WebSocket> | undefined
    players: string[]
  }>({
    ws: undefined,
    players: [],
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
