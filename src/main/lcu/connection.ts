import { authenticate, createWebSocketConnection } from 'league-connect'
import type { Credentials } from 'league-connect'
import { EventEmitter } from 'events'

export type ConnectionEvent = 'connecting' | 'connected' | 'disconnected'

class LcuConnection extends EventEmitter {
  private credentials: Credentials | null = null
  private running = false

  getCredentials(): Credentials {
    if (!this.credentials) throw new Error('LCU not connected')
    return this.credentials
  }

  isConnected(): boolean {
    return this.credentials !== null
  }

  async start(onEvent: (channel: string, data: unknown) => void): Promise<void> {
    if (this.running) return
    this.running = true

    while (this.running) {
      try {
        this.emit('connecting')
        const creds = await authenticate({ awaitConnection: true, pollInterval: 3000 })
        this.credentials = creds
        this.emit('connected', { port: creds.port, credentials: creds })

        const ws = await createWebSocketConnection({
          authenticationOptions: { awaitConnection: true, pollInterval: 3000 },
          // fail fast — the outer loop owns reconnection
          maxRetries: 0
        })

        ws.subscribe('OnJsonApiEvent_lol-gameflow_v1_gameflow-phase', (data) => {
          onEvent('champ-select:phase', data)
        })

        ws.subscribe('OnJsonApiEvent_lol-champ-select_v1_session', (data) => {
          onEvent('champ-select:session', data)
        })

        await new Promise<void>((resolve) => {
          // league-connect v6 wraps a ws — try both event surfaces
          const socket = (ws as unknown as { socket?: { on: (e: string, cb: () => void) => void } }).socket
          if (socket) {
            socket.on('close', resolve)
          } else {
            (ws as unknown as { on: (e: string, cb: () => void) => void }).on('close', resolve)
          }
        })
      } catch {
        // swallow — loop retries
      } finally {
        this.credentials = null
        this.emit('disconnected')
        // brief pause before reconnect attempt
        await new Promise((r) => setTimeout(r, 2000))
      }
    }
  }

  stop(): void {
    this.running = false
  }
}

export const lcuConnection = new LcuConnection()
