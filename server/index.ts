import { ServerWebSocket, Server, serve } from 'bun'

declare global {
  var server: Server
}

interface SocketData {
  channelId: string
  playerName: string
  playerId: string
  connectionType: string
  isHost: boolean
  isAlive: boolean
  hasVoted: boolean
  timeoutId: Timer | undefined
  connectionActive: boolean
  selectedCardValue: number | undefined
}

interface RoomData {
  pointsHidden: boolean
  players: Set<ServerWebSocket<SocketData>>
}

let wsConnections = new Set<ServerWebSocket<SocketData>>()
let rooms = new Map<string, RoomData>()
let playerPoints: Record<string, Record<string, number>> = {}

function pingClient() {
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
  }, 55000)
}

const server = serve<SocketData>({
  port: 3000,
  fetch(req, server) {
    console.log(`Received socket request from ${req.url}`)
    const url = new URL(req.url)

    const playerName = url.searchParams.get('playerName')
    const channelId =
      url.searchParams.get('channelId') ||
      Math.random().toString(36).substring(2, 36)
    const playerId =
      url.searchParams.get('playerId') ||
      Math.random().toString(36).substring(2, 36)
    const connectionType = url.searchParams.get('connectionType')
    const isHost = connectionType === 'CREATE'
    const isAlive = true
    const hasVoted = false
    const timeoutId = undefined
    const connectionActive = true

    server.upgrade(req, {
      data: {
        channelId,
        playerId,
        playerName,
        connectionType,
        isHost,
        isAlive,
        hasVoted,
        timeoutId,
        connectionActive,
      },
    })

    return new Response('Unable to establish Socket connection.', {
      status: 500,
    })
  },
  websocket: {
    open(ws) {
      console.log(`Opened WebSocket Connection with ${ws.data.channelId}`)
      switch (ws.data.connectionType) {
        case 'CREATE':
          console.log(`Creating room: ${ws.data.channelId}`)
          if (rooms.has(ws.data.channelId)) {
            ws.send(
              JSON.stringify({
                error: `Room ID: ${ws.data.channelId} already exists`,
              })
            )
            return
          }
          rooms.set(ws.data.channelId, {
            pointsHidden: true,
            players: new Set([ws]),
          })
          break
        case 'JOIN':
          console.log('Joining room')
          if (rooms.has(ws.data.channelId)) {
            rooms.get(ws.data.channelId)?.players.add(ws)
          } else {
            ws.send(
              JSON.stringify({
                error: `Room ID: ${ws.data.channelId} does not exist`,
              })
            )
            return
          }
          break
        case 'REJOIN':
          console.log('Rejoining room')
          if (rooms.has(ws.data.channelId)) {
            console.log('Room exists')
            rooms.get(ws.data.channelId)?.players.forEach((client) => {
              if (client.data.playerId === ws.data.playerId) {
                clearTimeout(client.data.timeoutId)
                ws.data = client.data
                ws.data.connectionActive = true
                rooms.get(ws.data.channelId)?.players.delete(client)
              }
            })
            rooms.get(ws.data.channelId)?.players.add(ws)
          } else {
            console.log("Room does not exist, can't rejoin")
            ws.send(
              JSON.stringify({
                error: `Room ID: ${ws.data.channelId} does not exist`,
              })
            )
            return
          }
          break
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
        hasVoted: client.data.hasVoted,
        isHost: client.data.isHost,
        selectedCardValue: client.data.selectedCardValue,
        connectionActive: client.data.connectionActive,
      }))
      console.log(players)

      ws.subscribe(ws.data.channelId)

      ws.send(
        JSON.stringify({
          channelId: ws.data.channelId,
          playerName: ws.data.playerName,
          playerId: ws.data.playerId,
          isHost: ws.data.isHost,
          players,
          playerPoints: playerPoints[ws.data.channelId] || {},
          isHidden: rooms.get(ws.data.channelId)?.pointsHidden,
        })
      )
      ws.publish(
        ws.data.channelId,
        JSON.stringify({
          channelId: ws.data.channelId,
          players,
          playerPoints: playerPoints[ws.data.channelId] || {},
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
      const room = rooms.get(ws.data.channelId)
      if (!room) return

      switch (data.type) {
        case 'CHANGE_POINT_VALUE':
          console.log('changing point value')
          ws.data.hasVoted = true
          ws.data.selectedCardValue = data.payload.cardValue
          playerPoints[ws.data.channelId] =
            playerPoints[ws.data.channelId] || {}
          playerPoints[ws.data.channelId][ws.data.playerId] =
            data.payload.cardValue
          break
        case 'REVEAL_VOTES':
          console.log('revealing votes')
          room.pointsHidden = false
          break
        case 'RESET_VOTES':
          console.log('resetting votes')
          room.pointsHidden = true
          playerPoints[ws.data.channelId] = {}
          room.players.forEach((client) => {
            client.data.hasVoted = false
            client.data.selectedCardValue = -1
          })
          break
        case 'CHANGE_HOST':
          console.log('changing host')
          room.players.forEach((client) => {
            client.data.isHost = client.data.playerId === data.payload.playerId
            client.send(
              JSON.stringify({
                isHost: client.data.isHost,
              })
            )
          })
          break
      }

      players = Array.from(rooms.get(ws.data.channelId)?.players || []).map(
        (client) => ({
          playerId: client.data.playerId,
          playerName: client.data.playerName,
          hasVoted: client.data.hasVoted,
          isHost: client.data.isHost,
          selectedCardValue: client.data.selectedCardValue,
          connectionActive: client.data.connectionActive,
        })
      )

      ws.send(
        JSON.stringify({
          channelId: ws.data.channelId,
          playerName: ws.data.playerName,
          playerId: ws.data.playerId,
          isHost: ws.data.isHost,
          players,
          playerPoints: playerPoints[ws.data.channelId] || {},
          isHidden: rooms.get(ws.data.channelId)?.pointsHidden,
        })
      )
      ws.publish(
        ws.data.channelId,
        JSON.stringify({
          channelId: ws.data.channelId,
          players,
          playerPoints: playerPoints[ws.data.channelId] || {},
          isHidden: rooms.get(ws.data.channelId)?.pointsHidden,
        })
      )
    },
    close(ws) {
      console.log(`Closing WebSocket Connection with ${ws.data.playerId}`)
      let players
      wsConnections.delete(ws)
      ws.data.connectionActive = false

      ws.data.timeoutId = setTimeout(() => {
        const room = rooms.get(ws.data.channelId)

        room?.players.delete(ws)

        players = Array.from(room?.players || []).map((client) => ({
          playerId: client.data.playerId,
          playerName: client.data.playerName,
          hasVoted: client.data.hasVoted,
          isHost: client.data.isHost,
          selectedCardValue: client.data.selectedCardValue,
          connectionActive: client.data.connectionActive,
        }))
        console.log('players: ', players)

        if (room?.players.size === 0) {
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
            playerPoints: playerPoints[ws.data.channelId] || {},
          })
        )
      }, 45000)
      players = Array.from(rooms.get(ws.data.channelId)?.players || []).map(
        (client) => ({
          playerId: client.data.playerId,
          playerName: client.data.playerName,
          hasVoted: client.data.hasVoted,
          isHost: client.data.isHost,
          selectedCardValue: client.data.selectedCardValue,
          connectionActive: client.data.connectionActive,
        })
      )
      server.publish(
        ws.data.channelId,
        JSON.stringify({
          channelId: ws.data.channelId,
          players,
          playerPoints: playerPoints[ws.data.channelId] || {},
        })
      )
    },
  },
})
