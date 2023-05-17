import { type Serve } from 'bun'
import { callerSourceOrigin } from 'bun:jsc'

let rooms = new Map()

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
          rooms.set(data.roomId, [ws])
          const response = {
            roomId: data.roomId,
          }
          ws.send(JSON.stringify(response))
          break
        case 'join':
          console.log('Joining room')
          if (rooms.has(data.roomId)) {
            rooms.get(data.roomId).push(ws)
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
