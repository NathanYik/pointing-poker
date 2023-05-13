Bun.serve({
  fetch(req, server) {
    console.log('Received socket request')
    if (server.upgrade(req)) return
    return new Response('Oof failed', { status: 500 })
  },
  websocket: {
    open(ws) {
      console.log('opened')
      ws.send('hi')
    },
    message(ws, message) {
      console.log(`Received incoming message: ${message}`)
      ws.send(message)
    }
  }
})

console.log('works?')
