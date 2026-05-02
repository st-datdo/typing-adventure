import { createServer } from 'http'
import next from 'next'
import { Server } from 'socket.io'
import { setupSocketGateway } from './src/lib/multiplayer/socket-gateway'
import type { ClientToServerEvents, ServerToClientEvents } from './src/lib/multiplayer/types'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME ?? 'localhost'
const port = parseInt(process.env.PORT ?? '3000', 10)

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(handler)

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: dev ? '*' : process.env.NEXT_PUBLIC_URL,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 20000,
    pingInterval: 10000,
  })

  setupSocketGateway(io)

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Socket.IO server attached`)
  })
})
