import { type PointingPokerSession } from '~/types'

export const syncWebSocketData = (
  store: PointingPokerSession,
  event: MessageEvent
) => {
  console.log('WebSocket Message Received: ', JSON.parse(event.data))
  store.channelId = JSON.parse(event.data).channelId || store.channelId
  store.playerName = JSON.parse(event.data).playerName || store.playerName
  store.players = JSON.parse(event.data).players || store.players
  store.playerId = JSON.parse(event.data).playerId || store.playerId
  store.playerPoints = JSON.parse(event.data).playerPoints || store.playerPoints
  store.isHost = JSON.parse(event.data).isHost || store.isHost
  store.error = JSON.parse(event.data).error || store.error
  store.isHidden =
    JSON.parse(event.data).isHidden === undefined
      ? store.isHidden
      : JSON.parse(event.data).isHidden
  console.log(store)
}
