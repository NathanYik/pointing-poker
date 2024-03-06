import { type PointingPokerSession } from '~/types'

export function syncWebSocketData(
  store: PointingPokerSession,
  event: MessageEvent
) {
  const data: PointingPokerSession = JSON.parse(event.data)
  console.log('WebSocket Message Received: ', data)
  const dataKeys = Object.keys(data) as Array<keyof PointingPokerSession>

  dataKeys.forEach((key) => (store[key] = data[key] as never))

  console.log(store)
}