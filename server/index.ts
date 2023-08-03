import { ServerWebSocket, type Serve, Server } from 'bun'

declare global {
  var server: Server
}

type SocketData = {
  channelId: string
  playerName: string
  playerId: string
  connectionType: string
  isHost: boolean
}

let rooms = new Map<string, Set<ServerWebSocket<SocketData>>>()
let playerPoints: Record<string, Record<string, number>> = {}
let isHidden = true

Bun.serve<SocketData>({
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

    server.upgrade(req, {
      data: { channelId, playerId, playerName, connectionType, isHost },
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
        rooms.get(ws.data.channelId)?.add(ws)
      } else if (ws.data.connectionType === 'create') {
        console.log('Creating room')
        rooms.set(ws.data.channelId, new Set([ws]))
      } else {
        console.log('error?')
        ws.send(
          JSON.stringify({
            error: 'Room does not exist',
          })
        )
        return
      }

      const players = Array.from(rooms.get(ws.data.channelId) || []).map(
        (client) => ({
          playerId: client.data.playerId,
          playerName: client.data.playerName,
        })
      )
      console.log(players)

      console.log(rooms.get(ws.data.channelId))
      ws.subscribe(ws.data.channelId)

      ws.send(
        JSON.stringify({
          channelId: ws.data.channelId,
          playerName: ws.data.playerName,
          playerId: ws.data.playerId,
          isHost: ws.data.isHost,
          players,
          playerPoints,
          isHidden,
        })
      )
      ws.publish(
        ws.data.channelId,
        JSON.stringify({
          channelId: ws.data.channelId,
          players,
          playerPoints,
          isHidden,
        })
      )
    },
    message(ws, message) {
      const data = JSON.parse(message as string)
      console.log(`Received incoming message: '${message}'`)
      const players = Array.from(rooms.get(ws.data.channelId) || []).map(
        (client) => ({
          playerId: client.data.playerId,
          playerName: client.data.playerName,
        })
      )

      playerPoints[ws.data.channelId] = playerPoints[ws.data.channelId] || {}
      playerPoints[ws.data.channelId][ws.data.playerId] =
        data.cardValue === undefined
          ? playerPoints[ws.data.channelId][ws.data.playerId]
          : data.cardValue
      isHidden = data.isHidden === undefined ? isHidden : data.isHidden

      if (data.clearVotes) {
        playerPoints[ws.data.channelId] = {}
      }

      ws.send(
        JSON.stringify({
          channelId: ws.data.channelId,
          playerName: ws.data.playerName,
          playerId: ws.data.playerId,
          isHost: ws.data.isHost,
          players,
          playerPoints,
          isHidden,
        })
      )
      ws.publish(
        ws.data.channelId,
        JSON.stringify({
          channelId: ws.data.channelId,
          players,
          playerPoints,
          isHidden,
        })
      )
    },
    close(ws) {
      console.log(`Closing WebSocket Connection with ${ws.data.channelId}`)
      // ws.publish(
      //   ws.data.channelId,
      //   JSON.stringify({
      //     hi: 'hi',
      //   })
      // )
      ws.unsubscribe(ws.data.channelId)

      rooms.get(ws.data.channelId)?.delete(ws)
      const players = Array.from(rooms.get(ws.data.channelId) || []).map(
        (client) => ({
          playerId: client.data.playerId,
          playerName: client.data.playerName,
        })
      )

      if (rooms.get(ws.data.channelId)?.size === 0) {
        console.log(`Deleting room ${ws.data.channelId}`)
        rooms.delete(ws.data.channelId)
        return
      }

      console.log('publishing')
      console.log(ws.data.channelId)
      rooms.get(ws.data.channelId)?.forEach((client) => {
        client.send(
          JSON.stringify({
            channelId: ws.data.channelId,
            players,
            playerPoints,
          })
        )
      })

      // ws.publish(
      //   ws.data.channelId,
      //   JSON.stringify({
      //     channelId: ws.data.channelId,
      //     players,
      //     playerPoints,
      //   })
      // )
      console.log('published')
    },
  },
})
