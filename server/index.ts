import { ServerWebSocket, type Serve } from 'bun'

let rooms = new Map<string, Set<ServerWebSocket>>()

export default {
  fetch(req, server) {
    console.log(`Received socket request from ${req.url}`)
    const roomId = new URL(req.url).pathname.split('/')[1]
    if (server.upgrade(req, { data: { roomId } })) return

    return new Response('Unable to establish Socket connection.', {
      status: 400,
    })
  },
  websocket: {
    open(ws) {
      if (ws.data) {
        console.log(`Opened WebSocket Connection`)
      }
    },
    message(ws, message) {
      const data = JSON.parse(message as string)
      console.log(`Received incoming message: '${message}'`)
      switch (data.type) {
        case 'create':
          const roomId = Math.random().toString(36).substring(2, 36)
          console.log(`Creating room ${roomId}`)
          rooms.set(roomId, new Set([ws]))

          const response = { roomId }

          ws.subscribe(roomId)
          ws.send(JSON.stringify(response))
          // rooms.get(roomId)?.forEach((client) => {
          //   client.send(JSON.stringify(response))
          // })
          // ws.publish(roomId, JSON.stringify(response))
          break
        case 'join':
          if (rooms.has(data.roomId)) {
            console.log('Joining room')
            rooms.get(data.roomId)?.add(ws)
            console.log(rooms.get(data.roomId))
            ws.subscribe(data.roomId)
            ws.publish(
              data.roomId,
              JSON.stringify({
                roomId: data.roomId,
                playerName: data.playerName,
              })
            )
          } else {
            ws.send(
              JSON.stringify({
                error: 'Room does not exist',
              })
            )
          }
          break
        case 'leave':
          break
        default:
          break
      }
    },
  },
} satisfies Serve
