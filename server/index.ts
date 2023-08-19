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
  isAlive: boolean
}

let players = new Set<ServerWebSocket<SocketData>>()
let rooms = new Map<string, Set<ServerWebSocket<SocketData>>>()
let playerPoints: Record<string, Record<string, number>> = {}
let isHidden = true
let socketHeartbeat: Timer

function pingClient() {
  socketHeartbeat = setInterval(() => {
    if (players.size === 0) {
      console.log('stopping ping')
      clearInterval(socketHeartbeat)
    }
    players.forEach((ws) => {
      if (ws.data.isAlive === false) {
        return ws.close()
      }
      ws.data.isAlive = false
      console.log('Sending ping to player ID:', ws.data.playerId)
      ws.send(JSON.stringify({ ping: true }))
    })
  }, 55000)
}

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

      players.add(ws)
      if (players.size === 1) {
        console.log('starting ping')
        pingClient()
      }
      console.log('players: ', players)

      const playersInRoom = Array.from(rooms.get(ws.data.channelId) || []).map(
        (client) => ({
          playerId: client.data.playerId,
          playerName: client.data.playerName,
        })
      )
      console.log(playersInRoom)

      console.log(rooms.get(ws.data.channelId))
      ws.subscribe(ws.data.channelId)

      ws.send(
        JSON.stringify({
          channelId: ws.data.channelId,
          playerName: ws.data.playerName,
          playerId: ws.data.playerId,
          isHost: ws.data.isHost,
          players: playersInRoom,
          playerPoints,
          isHidden,
          shouldRedirect: true,
        })
      )
      ws.publish(
        ws.data.channelId,
        JSON.stringify({
          channelId: ws.data.channelId,
          players: playersInRoom,
          playerPoints,
          isHidden,
        })
      )
    },
    message(ws, message) {
      const data = JSON.parse(message as string)
      console.log('Received incoming message: ', data)
      let playersInRoom

      switch (data.type) {
        case 'CHANGE_POINT_VALUE':
          console.log('changing point value')
          playersInRoom = Array.from(rooms.get(ws.data.channelId) || []).map(
            (client) => ({
              playerId: client.data.playerId,
              playerName: client.data.playerName,
            })
          )

          playerPoints[ws.data.channelId] =
            playerPoints[ws.data.channelId] || {}
          playerPoints[ws.data.channelId][ws.data.playerId] =
            data.payload.cardValue
          break
        case 'REVEAL_VOTES':
          console.log('revealing votes')
          isHidden = false
          break
        case 'RESET_VOTES':
          console.log('resetting votes')
          isHidden = true
          playerPoints[ws.data.channelId] = {}
          break
        case 'PONG':
          ws.data.isAlive = true
          return
      }

      ws.send(
        JSON.stringify({
          channelId: ws.data.channelId,
          playerName: ws.data.playerName,
          playerId: ws.data.playerId,
          isHost: ws.data.isHost,
          players: playersInRoom,
          playerPoints,
          isHidden,
        })
      )
      ws.publish(
        ws.data.channelId,
        JSON.stringify({
          channelId: ws.data.channelId,
          players: playersInRoom,
          playerPoints,
          isHidden,
        })
      )
    },
    close(ws) {
      console.log(`Closing WebSocket Connection with ${ws.data.playerId}`)
      // ws.publish(
      //   ws.data.channelId,
      //   JSON.stringify({
      //     hi: 'hi',
      //   })
      // )
      ws.unsubscribe(ws.data.channelId)
      players.delete(ws)

      // if (players.size === 0) {
      //   clearInterval(socketHeartbeat)
      // }

      console.log('players: ', players)

      rooms.get(ws.data.channelId)?.delete(ws)
      const playersInRoom = Array.from(rooms.get(ws.data.channelId) || []).map(
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

      console.log(ws.data.channelId)
      rooms.get(ws.data.channelId)?.forEach((client) => {
        client.send(
          JSON.stringify({
            channelId: ws.data.channelId,
            players: playersInRoom,
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
    },
  },
})
