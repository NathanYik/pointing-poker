import { type Serve } from 'bun'

export default {
  fetch(req, server) {
    console.log(`Received socket request from ${req.url}`)
    const roomId = new URL(req.url).pathname.split('/')[1]
    if (server.upgrade(req, { data: { roomId } })) {
      server.publish(roomId, `New connection ${roomId} has joined.`)
    }
    return new Response('Unable to establish Socket connection.', {
      status: 400
    })
  },
  websocket: {
    open(ws) {
      if (ws.data) {
        console.log(`Opened WebSocket Connection ${ws.data?.roomId}`)
        ws.subscribe(ws.data?.roomId)
      }
    },
    message(ws, message) {
      console.log(
        `Received incoming message: '${message}' from roomId ${ws.data?.roomId}`
      )
      ws.publish(ws.data?.roomId, ws.data?.roomId)
    }
  }
} satisfies Serve
