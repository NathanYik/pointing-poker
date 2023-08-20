import { ServerWebSocket, Server, serve } from 'bun'

declare global {
  var server: Server
}

type SocketData = {
  channelId: string
  playerName: string
  playerId: string
  connectionType: string
  isHost: boolean
  isAlive: boolean
}

let wsConnections = new Set<ServerWebSocket<SocketData>>()
let rooms = new Map<
  string,
  { pointsHidden: boolean; players: Set<ServerWebSocket<SocketData>> }
>()
let playerPoints: Record<string, Record<string, number>> = {}
let isHidden = true

function pingClient() {
  console.log('ds')
  const socketHeartbeat = setInterval(() => {
    if (wsConnections.size === 0) {
      console.log('No players detected, stopping pings')
      clearInterval(socketHeartbeat)
    }
    wsConnections.forEach((ws) => {
      if (ws.data.isAlive === false) return ws.close()

      ws.data.isAlive = false
      console.log('Sending ping to player ID:', ws.data.playerId)
      ws.ping()
    })
  }, 5000)
}

const server = serve<SocketData>({
  port: 3000,
  fetch(req, server) {
    console.log(`Received socket request from ${req.url}`)

    const playerName = new URL(req.url).searchParams.get('playerName')
    const channelId =
      new URL(req.url).searchParams.get('channelId') ||
      Math.random().toString(36).substring(2, 36)
    const playerId = Math.random().toString(36).substring(2, 36)
    const connectionType = new URL(req.url).searchParams.get('connectionType')
    const isHost = connectionType === 'create'
    const isAlive = true

    server.upgrade(req, {
      data: {
        channelId,
        playerId,
        playerName,
        connectionType,
        isHost,
        isAlive,
      },
    })

    return new Response('Unable to establish Socket connection.', {
      status: 500,
    })
  },
  websocket: {
    open(ws) {
      console.log(`Opened WebSocket Connection with ${ws.data.channelId}`)
      if (ws.data.connectionType === 'join' && rooms.has(ws.data.channelId)) {
        console.log('Joining room')
        rooms.get(ws.data.channelId)?.players.add(ws)
      } else if (ws.data.connectionType === 'create') {
        console.log('Creating room')
        rooms.set(ws.data.channelId, {
          pointsHidden: true,
          players: new Set([ws]),
        })
      } else {
        console.log('error?')
        ws.send(
          JSON.stringify({
            error: 'Room does not exist',
          })
        )
        return
      }

      wsConnections.add(ws)
      if (wsConnections.size === 1) {
        console.log('Players detected, starting pings')
        pingClient()
      }

      const players = Array.from(
        rooms.get(ws.data.channelId)?.players || []
      ).map((client) => ({
        playerId: client.data.playerId,
        playerName: client.data.playerName,
      }))
      console.log(players)

      console.log(rooms.get(ws.data.channelId)?.players)
      ws.subscribe(ws.data.channelId)

      ws.send(
        JSON.stringify({
          channelId: ws.data.channelId,
          playerName: ws.data.playerName,
          playerId: ws.data.playerId,
          isHost: ws.data.isHost,
          players,
          playerPoints,
          isHidden: rooms.get(ws.data.channelId)?.pointsHidden,
        })
      )
      ws.publish(
        ws.data.channelId,
        JSON.stringify({
          channelId: ws.data.channelId,
          players,
          playerPoints,
          isHidden: rooms.get(ws.data.channelId)?.pointsHidden,
        })
      )
    },
    pong(ws) {
      ws.data.isAlive = true
      console.log('Received pong from player ID:', ws.data.playerId)
    },
    message(ws, message) {
      const data = JSON.parse(message as string)
      console.log('Received incoming message: ', data)
      let players

      switch (data.type) {
        case 'CHANGE_POINT_VALUE':
          console.log('changing point value')
          players = Array.from(rooms.get(ws.data.channelId)?.players || []).map(
            (client) => ({
              playerId: client.data.playerId,
              playerName: client.data.playerName,
            })
          )

          playerPoints[ws.data.channelId] =
            playerPoints[ws.data.channelId] || {}
          playerPoints[ws.data.channelId][ws.data.playerId] =
            data.payload.cardValue
          const code = ws.ping('ping')
          console.log('code: ', code)
          break
        case 'REVEAL_VOTES':
          console.log('revealing votes')
          const room = rooms.get(ws.data.channelId)
          if (!room) return
          room.pointsHidden = false
          break
        case 'RESET_VOTES':
          console.log('resetting votes')
          const room2 = rooms.get(ws.data.channelId)
          if (!room2) return
          room2.pointsHidden = true
          playerPoints[ws.data.channelId] = {}
          break
      }

      ws.send(
        JSON.stringify({
          channelId: ws.data.channelId,
          playerName: ws.data.playerName,
          playerId: ws.data.playerId,
          isHost: ws.data.isHost,
          players,
          playerPoints,
          isHidden: rooms.get(ws.data.channelId)?.pointsHidden,
        })
      )
      ws.publish(
        ws.data.channelId,
        JSON.stringify({
          channelId: ws.data.channelId,
          players,
          playerPoints,
          isHidden: rooms.get(ws.data.channelId)?.pointsHidden,
        })
      )
    },
    close(ws) {
      console.log(`Closing WebSocket Connection with ${ws.data.playerId}`)
      wsConnections.delete(ws)

      console.log('players: ', wsConnections)

      rooms.get(ws.data.channelId)?.players.delete(ws)
      const players = Array.from(
        rooms.get(ws.data.channelId)?.players || []
      ).map((client) => ({
        playerId: client.data.playerId,
        playerName: client.data.playerName,
      }))

      if (rooms.get(ws.data.channelId)?.players.size === 0) {
        console.log(`Deleting room ${ws.data.channelId}`)
        rooms.delete(ws.data.channelId)
        return
      }

      ws.unsubscribe(ws.data.channelId)
      server.publish(
        ws.data.channelId,
        JSON.stringify({
          channelId: ws.data.channelId,
          players,
          playerPoints,
        })
      )
    },
  },
})
