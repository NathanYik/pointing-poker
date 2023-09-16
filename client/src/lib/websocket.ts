import { type PointingPokerSession } from '~/types'

export const syncWebSocketData = (
  store: PointingPokerSession,
  event: MessageEvent
) => {
  const data = JSON.parse(event.data)
  console.log('WebSocket Message Received: ', data)
  Object.keys(data).forEach((key) => {
    ;(store as any)[key] = data[key]
  })
  console.log(store)
}

export const socketMessage = ({
  type,
  payload,
}: {
  type: string
  payload?: any
}) =>
  JSON.stringify({
    type,
    payload,
  })
