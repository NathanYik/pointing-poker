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
  selectedCardValue: number
}

interface RoomData {
  pointsHidden: boolean
  players: Set<ServerWebSocket<SocketData>>
}

let wsConnections = new Set<ServerWebSocket<SocketData>>()
let rooms = new Map<string, RoomData>()
let playerPoints: Record<string, Record<string, number>> = {}

function replacer(_: string, value: any) {
  if (value instanceof Set) {
    return Array.from(value).map((client) => client.data)
  }
  return value
}

function formatWebSocketMessage(data: any) {
  return JSON.stringify(data, replacer)
}

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
  }, 30000)
}

const server = serve<SocketData>({
  port: 3000,
  fetch(req, server) {
    console.log(`Received socket request from ${req.url}`)
    const url = new URL(req.url)

    const connectionType = url.searchParams.get('connectionType')

    server.upgrade(req, {
      data: {
        channelId:
          url.searchParams.get('channelId') ||
          Math.random().toString(36).substring(2, 36),
        playerId:
          url.searchParams.get('playerId') ||
          Math.random().toString(36).substring(2, 36),
        playerName: url.searchParams.get('playerName'),
        connectionType: connectionType,
        isHost: connectionType === 'CREATE',
        isAlive: true,
        hasVoted: false,
        timeoutId: undefined,
        connectionActive: true,
        selectedCardValue: -1,
      },
    })

    return new Response('Unable to establish Socket connection.', {
      status: 500,
    })
  },
  websocket: {
    open(ws) {
      const { channelId, playerId, connectionType, playerName, isHost } =
        ws.data
      console.log(`Opened WebSocket Connection with ${channelId}`)
      switch (connectionType) {
        case 'CREATE':
          console.log(`Creating room: ${channelId}`)
          if (rooms.has(channelId)) {
            ws.send(
              formatWebSocketMessage({
                error: `Room ID: ${channelId} already exists`,
              })
            )
            return
          }
          rooms.set(channelId, {
            pointsHidden: true,
            players: new Set([ws]),
          })
          break
        case 'JOIN':
          console.log('Joining room')
          if (rooms.has(channelId)) {
            rooms.get(channelId)?.players.add(ws)
          } else {
            ws.send(
              formatWebSocketMessage({
                error: `Room ID: ${channelId} does not exist`,
              })
            )
            return
          }
          break
        case 'REJOIN':
          console.log('Rejoining room')
          let foundPlayer = false
          if (rooms.has(channelId)) {
            const room = rooms.get(channelId)
            console.log('Room exists')

            room?.players.forEach((client) => {
              if (client.data.playerId === playerId) {
                clearTimeout(client.data.timeoutId)
                ws.data = client.data
                ws.data.connectionActive = true
                room?.players.delete(client)
                foundPlayer = true
                return
              }
            })

            if (!foundPlayer) {
              console.log('Player session expired')
              ws.send(
                formatWebSocketMessage({
                  error: `Player ID: ${playerId} does not exist in room ID: ${channelId}`,
                })
              )
              return
            }

            room?.players.add(ws)
          } else {
            console.log("Room does not exist, can't rejoin")
            ws.send(
              formatWebSocketMessage({
                error: `Room ID: ${channelId} does not exist`,
              })
            )
            return
          }
          break
      }

      const room = rooms.get(channelId)

      wsConnections.add(ws)
      if (wsConnections.size === 1) {
        console.log('Players detected, starting pings')
        pingClient()
      }

      ws.subscribe(channelId)

      ws.send(
        formatWebSocketMessage({
          channelId: channelId,
          playerName: playerName,
          playerId: playerId,
          isHost: ws.data.isHost,
          players: room?.players,
          playerPoints: playerPoints[channelId] || {},
          isHidden: room?.pointsHidden,
        })
      )
      ws.publish(
        channelId,
        formatWebSocketMessage({
          channelId: channelId,
          players: room?.players,
          playerPoints: playerPoints[channelId] || {},
          isHidden: room?.pointsHidden,
        })
      )
    },
    pong(ws) {
      ws.data.isAlive = true
      console.log('Received pong from player ID:', ws.data.playerId)
    },
    message(ws, message) {
      const { channelId, playerId, playerName, isHost } = ws.data
      const data = JSON.parse(message as string)
      console.log('Received incoming message: ', data)
      const room = rooms.get(channelId)
      if (!room) return

      switch (data.type) {
        case 'CHANGE_POINT_VALUE':
          console.log('changing point value')
          ws.data.hasVoted = true
          ws.data.selectedCardValue = data.payload.cardValue
          playerPoints[channelId] = playerPoints[channelId] || {}
          playerPoints[channelId][playerId] = data.payload.cardValue
          break
        case 'REVEAL_VOTES':
          console.log('revealing votes')
          room.pointsHidden = false
          break
        case 'RESET_VOTES':
          console.log('resetting votes')
          room.pointsHidden = true
          playerPoints[channelId] = {}
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
              formatWebSocketMessage({
                isHost: client.data.isHost,
              })
            )
          })
          break
      }

      ws.send(
        formatWebSocketMessage({
          channelId: channelId,
          playerName: playerName,
          playerId: playerId,
          isHost: ws.data.isHost,
          players: room?.players,
          playerPoints: playerPoints[channelId] || {},
          isHidden: room?.pointsHidden,
        })
      )
      ws.publish(
        channelId,
        formatWebSocketMessage({
          channelId: channelId,
          players: room?.players,
          playerPoints: playerPoints[channelId] || {},
          isHidden: room?.pointsHidden,
        })
      )
    },
    close(ws) {
      const { channelId, playerId } = ws.data
      const room = rooms.get(channelId)
      console.log(`Closing WebSocket Connection with ${playerId}`)
      wsConnections.delete(ws)
      ws.data.connectionActive = false
      if (ws.data.isHost) {
        ws.data.isHost = false
        room?.players.forEach((client) => {
          if (client.data.playerId !== playerId) {
            client.data.isHost = true
            client.send(
              formatWebSocketMessage({
                isHost: client.data.isHost,
              })
            )
            // server.publish(
            //   channelId,
            //   formatWebSocketMessage({
            //     channelId: channelId,
            //     players: room?.players,
            //     playerPoints: playerPoints[channelId] || {},
            //   })
            // )
            return
          }
        })
      }

      ws.data.timeoutId = setTimeout(() => {
        room?.players.delete(ws)

        if (room?.players.size === 0) {
          console.log(`Deleting room ${channelId}`)
          rooms.delete(channelId)
          return
        }

        ws.unsubscribe(channelId)
        server.publish(
          channelId,
          formatWebSocketMessage({
            channelId: channelId,
            players: room?.players,
            playerPoints: playerPoints[channelId] || {},
          })
        )
      }, 15000)

      server.publish(
        channelId,
        formatWebSocketMessage({
          channelId: channelId,
          players: room?.players,
          playerPoints: playerPoints[channelId] || {},
        })
      )
    },
  },
})
