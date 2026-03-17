/**
 * PixiJS 画布 — 像素小镇世界 + 缩放/平移控件
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { DCPixiApp } from '../engine/PixiApp'
import { useAgentStore } from '../stores/agentStore'

export default function PixiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pixiRef = useRef<DCPixiApp | null>(null)
  const prevStatesRef = useRef<Record<string, string>>({})
  const [zoom, setZoom] = useState(1)

  const agents = useAgentStore(s => s.agents)
  const activeBuildings = useAgentStore(s => s.activeBuildings)

  // 初始化 PixiJS
  useEffect(() => {
    if (!canvasRef.current || pixiRef.current) return

    const pixi = new DCPixiApp()
    pixiRef.current = pixi

    pixi.init(canvasRef.current).then(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        pixi.resize(rect.width, rect.height)
      }
    })

    return () => {
      pixi.destroy()
      pixiRef.current = null
    }
  }, [])

  // ResizeObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const pixi = pixiRef.current
      if (!pixi) return
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          pixi.resize(width, height)
        }
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // 鼠标滚轮缩放
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const pixi = pixiRef.current
      if (!pixi) return

      const delta = e.deltaY > 0 ? -0.15 : 0.15
      const newZoom = Math.max(0.5, Math.min(3, pixi.getZoom() + delta))
      pixi.setZoom(newZoom)
      setZoom(newZoom)
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  // 拖拽平移
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let isDragging = false
    let lastX = 0
    let lastY = 0

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging = true
        lastX = e.clientX
        lastY = e.clientY
        container.style.cursor = 'grabbing'
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const pixi = pixiRef.current
      if (!pixi) return
      pixi.pan(e.clientX - lastX, e.clientY - lastY)
      lastX = e.clientX
      lastY = e.clientY
    }

    const onMouseUp = () => {
      isDragging = false
      container.style.cursor = 'grab'
    }

    container.style.cursor = 'grab'
    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // 同步 Agent 状态到 PixiJS
  useEffect(() => {
    const pixi = pixiRef.current
    if (!pixi) return

    for (const [id, agent] of Object.entries(agents)) {
      const prevState = prevStatesRef.current[id]
      if (prevState !== agent.state) {
        pixi.setAgentAnimation(id, agent.state)
        prevStatesRef.current[id] = agent.state
      }

      if (agent.state === 'thinking' && agent.thinkingText) {
        pixi.updateThinkingText(id, agent.thinkingText)
      }
    }
  }, [agents])

  // 同步建筑激活状态
  useEffect(() => {
    const pixi = pixiRef.current
    if (!pixi) return

    const allBuildings = ['white_house', 'capitol', 'supreme_court', 'press_podium']
    allBuildings.forEach(b => {
      pixi.setBuildingGlow(b, activeBuildings.has(b))
    })
  }, [activeBuildings])

  const handleZoomIn = useCallback(() => {
    const pixi = pixiRef.current
    if (!pixi) return
    const z = Math.min(3, pixi.getZoom() + 0.3)
    pixi.setZoom(z)
    setZoom(z)
  }, [])

  const handleZoomOut = useCallback(() => {
    const pixi = pixiRef.current
    if (!pixi) return
    const z = Math.max(0.5, pixi.getZoom() - 0.3)
    pixi.setZoom(z)
    setZoom(z)
  }, [])

  const handleReset = useCallback(() => {
    const pixi = pixiRef.current
    if (!pixi) return
    pixi.resetView()
    setZoom(1)
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-950 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* 图例 */}
      <div className="absolute top-2 left-2 glass rounded-lg px-2 py-1.5 text-[10px] space-y-0.5 opacity-80">
        <div className="text-gray-400 font-semibold text-[9px] uppercase tracking-wider mb-0.5">FedAgent</div>
        <LegendItem color="bg-blue-500" label="行政" />
        <LegendItem color="bg-amber-500" label="立法" />
        <LegendItem color="bg-red-500" label="司法" />
      </div>

      {/* 缩放控件 */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="w-7 h-7 glass rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm"
          title="放大"
        >+</button>
        <button
          onClick={handleReset}
          className="w-7 h-7 glass rounded-lg flex items-center justify-center text-gray-500 hover:text-white transition-colors text-[10px] font-mono"
          title="重置视角"
        >{Math.round(zoom * 100)}%</button>
        <button
          onClick={handleZoomOut}
          className="w-7 h-7 glass rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm"
          title="缩小"
        >−</button>
      </div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-sm ${color}`} />
      <span className="text-gray-500">{label}</span>
    </div>
  )
}
