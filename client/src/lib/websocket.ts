import { type PointingPokerSession } from '~/types'

export const syncWebSocketData = (
  store: PointingPokerSession,
  event: MessageEvent
) => {
  const data: PointingPokerSession = JSON.parse(event.data)
  console.log('WebSocket Message Received: ', data)
  const dataKeys = Object.keys(data) as Array<keyof PointingPokerSession>

  dataKeys.forEach((key) => (store[key] = data[key] as never))

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
