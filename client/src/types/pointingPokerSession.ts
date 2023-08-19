import { type NoSerialize } from '@builder.io/qwik'

export interface PointingPokerSession {
  ws: NoSerialize<WebSocket> | undefined
  players: { playerId: string; playerName: string }[]
  playerName: string
  playerId: string
  channelId: string
  error?: string
  playerPoints: Record<string, Record<string, number>>
  isHost: boolean
  isHidden: boolean
  triggerPing: boolean
}
