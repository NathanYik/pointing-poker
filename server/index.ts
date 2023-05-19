import { ServerWebSocket, type Serve } from 'bun'

let rooms = new Map<string, Set<ServerWebSocket>>()

export default {
  fetch(req, server) {
    console.log(`Received socket request from ${req.url}`)

    const playerName = new URL(req.url).searchParams.get('playerName')
    const channelId =
      new URL(req.url).searchParams.get('channelId') ||
      Math.random().toString(36).substring(2, 36)
    const playerId = Math.random().toString(36).substring(2, 36)
    const connectionType = new URL(req.url).searchParams.get('connectionType')

    if (
      server.upgrade(req, {
        data: { channelId, playerId, playerName, connectionType },
      })
    )
      return

    return new Response('Unable to establish Socket connection.', {
      status: 500,
    })
  },
  websocket: {
    open(ws) {
      if (!ws.data) return

      console.log(`Opened WebSocket Connection with ${ws.data['channelId']}`)
      if (
        ws.data['connectionType'] === 'join' &&
        rooms.has(ws.data['channelId'])
      ) {
        console.log('Joining room')
        rooms.get(ws.data['channelId'])?.add(ws)
      } else if (ws.data['connectionType'] === 'create') {
        console.log('Creating room')
        rooms.set(ws.data['channelId'], new Set([ws]))
      } else {
        console.log('error?')
        ws.send(
          JSON.stringify({
            error: 'Room does not exist',
          })
        )
        return
      }

      const players = Array.from(rooms.get(ws.data['channelId']) || []).map(
        (client) => client?.data?.['playerName']
      )
      console.log(players)

      console.log(rooms.get(ws.data['channelId']))
      // ws.subscribe(ws.data['channelId'])
      ws.send(
        JSON.stringify({
          channelId: ws.data['channelId'],
          playerName: ws.data['playerName'],
          players,
        })
      )
      rooms.get(ws.data['channelId'])?.forEach((client) => {
        client.send(
          JSON.stringify({
            channelId: ws.data?.['channelId'],
            playerName: ws.data?.['playerName'],
            players,
          })
        )
      })
      // ws.publish(
      //   ws.data['channelId'],
      //   JSON.stringify({
      //     channelId: ws.data['channelId'],
      //     playerName: ws.data['playerName'],
      //     players,
      //   })
      // )
      // ws.send(JSON.stringify({ playerName: ws.data['channelId'] }))
    },
    message(ws, message) {
      const data = JSON.parse(message as string)
      console.log(`Received incoming message: '${message}'`)
      ws.send('message received')
    },
    close(ws) {
      if (!ws.data) return
      console.log(`Closing WebSocket Connection with ${ws.data['channelId']}`)

      rooms.get(ws.data['channelId'])?.delete(ws)
      const players = Array.from(rooms.get(ws.data['channelId']) || []).map(
        (client) => client?.data?.['playerName']
      )

      if (rooms.get(ws.data['channelId'])?.size === 0) {
        rooms.delete(ws.data['channelId'])
        return
      }

      rooms.get(ws.data['channelId'])?.forEach((client) => {
        client.send(
          JSON.stringify({
            channelId: ws.data?.['channelId'],
            playerName: ws.data?.['playerName'],
            playerId: ws.data?.['playerId'],
            players,
          })
        )
      })
      // ws.publish(
      //   ws.data['channelId'],
      //   JSON.stringify({
      //     channelId: ws.data['channelId'],
      //     playerName: ws.data['playerName'],
      //   })
      // )
    },
  },
} satisfies Serve
