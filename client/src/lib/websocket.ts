import { type PointingPokerSession } from '~/types'

export const syncWebSocketData = (
  store: PointingPokerSession,
  event: MessageEvent
) => {
  const data = JSON.parse(event.data)
  console.log('WebSocket Message Received: ', data)
  store.channelId = data.channelId || store.channelId
  store.playerName = data.playerName || store.playerName
  store.players = data.players || store.players
  store.playerId = data.playerId || store.playerId
  store.playerPoints = data.playerPoints || store.playerPoints
  store.isHost = data.isHost || store.isHost
  store.error = data.error || store.error
  store.isHidden = data.isHidden === undefined ? store.isHidden : data.isHidden
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
