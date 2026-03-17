/**
 * WebSocket 连接管理
 */
import { useEffect, useRef, useCallback, useState } from 'react'

export interface WSMessage {
  type: string
  task_id?: string
  agent?: string
  data?: any
  [key: string]: any
}

type MessageHandler = (msg: WSMessage) => void

export function useWebSocket(url?: string) {
  const wsRef = useRef<WebSocket | null>(null)
  const handlersRef = useRef<Set<MessageHandler>>(new Set())
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()
  const [connected, setConnected] = useState(false)

  const wsUrl = url || `ws://${window.location.host}/ws`

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setConnected(true)
      console.log('[WS] 已连接')
    }

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data)
        handlersRef.current.forEach(handler => handler(msg))
      } catch (e) {
        console.warn('[WS] 解析消息失败:', e)
      }
    }

    ws.onclose = () => {
      setConnected(false)
      console.log('[WS] 断开，3秒后重连...')
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }

    wsRef.current = ws
  }, [wsUrl])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  const subscribe = useCallback((handler: MessageHandler) => {
    handlersRef.current.add(handler)
    return () => { handlersRef.current.delete(handler) }
  }, [])

  const send = useCallback((msg: Record<string, any>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  return { connected, subscribe, send }
}
