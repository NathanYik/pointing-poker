import { noSerialize, $ } from '@builder.io/qwik'
import { usePointingPokerSession } from './usePointingPokerSession'
import { API_URL } from '~/lib/url'
import { syncWebSocketData } from '~/lib/websocket'

interface WebSocketConnectionOptions {
  playerId?: string
  playerName?: string
  connectionType?: string
  channelId?: string
}

export const useCreateWebSocketConnection = () => {
  const store = usePointingPokerSession()

  return $((options: WebSocketConnectionOptions) => {
    const url = new URL(API_URL)
    const optionKeys = Object.keys(options) as Array<
      keyof WebSocketConnectionOptions
    >

    optionKeys.forEach((key) =>
      url.searchParams.set(key, options[key] as string)
    )

    store.ws = noSerialize(new WebSocket(url))

    if (!store.ws) throw new Error('Failed to create websocket')
    store.ws.onmessage = (event) => syncWebSocketData(store, event)
  })
}
