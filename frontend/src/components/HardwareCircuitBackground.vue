<template>
  <div class="circuit-bg-container" aria-hidden="true">
    <canvas ref="canvasRef" class="circuit-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

interface TracePoint {
  x: number
  y: number
}

interface CircuitTrace {
  points: TracePoint[]
  color: string
  width: number
  pulseColor: string
  pulseSpeed: number
  pulseLength: number
  pulseProgress: number // 0 to 1
  pulseActive: boolean
  pulseDelay: number
}

interface ViaPad {
  x: number
  y: number
  radius: number
  color: string
  ringColor: string
  pulsePhase: number
}

interface SolderCap {
  x: number
  y: number
  width: number
  height: number
  angle: number
}

interface CPUSocket {
  x: number
  y: number
  size: number
  pins: { x: number; y: number }[]
}

let animationFrameId: number | null = null

// Mouse proximity tracking
let mouseX = -9999
let mouseY = -9999
let targetMouseX = -9999
let targetMouseY = -9999

function onMouseMove(e: MouseEvent) {
  targetMouseX = e.clientX
  targetMouseY = e.clientY
}

function onMouseLeave() {
  targetMouseX = -9999
  targetMouseY = -9999
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let isReducedMotion = prefersReducedMotion.matches

  prefersReducedMotion.addEventListener('change', (e) => {
    isReducedMotion = e.matches
    if (isReducedMotion && animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
      renderStatic()
    } else if (!isReducedMotion && !animationFrameId) {
      lastTimestamp = performance.now()
      loop(lastTimestamp)
    }
  })

  window.addEventListener('mousemove', onMouseMove, { passive: true })
  document.addEventListener('mouseleave', onMouseLeave)

  let width = 0
  let height = 0
  let dpr = 1

  let traces: CircuitTrace[] = []
  let vias: ViaPad[] = []
  let capacitors: SolderCap[] = []
  let cpuSocket: CPUSocket | null = null

  function initGeometry() {
    if (!canvas) return
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = window.innerWidth
    height = window.innerHeight

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    ctx!.scale(dpr, dpr)

    traces = []
    vias = []
    capacitors = []

    // 1. Central CPU Socket Architecture (Blueprint inspired)
    const cpuSize = Math.min(width, height) * 0.28
    const cpuX = width * 0.5
    const cpuY = height * 0.38

    const pins: { x: number; y: number }[] = []
    const pinCols = 10
    const pinRows = 10
    const pinSpacing = (cpuSize * 0.72) / pinCols

    for (let r = 0; r < pinRows; r++) {
      for (let c = 0; c < pinCols; c++) {
        // Skip inner core die for processor label
        if (r >= 3 && r <= 6 && c >= 3 && c <= 6) continue
        pins.push({
          x: cpuX - (cpuSize * 0.72) / 2 + (c + 0.5) * pinSpacing,
          y: cpuY - (cpuSize * 0.72) / 2 + (r + 0.5) * pinSpacing
        })
      }
    }

    cpuSocket = {
      x: cpuX,
      y: cpuY,
      size: cpuSize,
      pins
    }

    // 2. Multi-Channel Bus Traces radiating from CPU socket
    const busColors = [
      'rgba(189, 99, 70, 0.18)', // Terracotta copper
      'rgba(25, 49, 38, 0.14)',  // Forest silicon substrate
      'rgba(224, 159, 62, 0.16)'  // Warm amber gold
    ]

    const pulseColors = [
      'rgba(189, 99, 70, 0.85)',
      'rgba(224, 159, 62, 0.95)',
      'rgba(85, 112, 96, 0.85)'
    ]

    // Generate PCB Bus Lanes radiating left, right, top, bottom
    const cardinalDirections = [
      { dx: -1, dy: 0, count: 6, startOffset: cpuSize * 0.5 },
      { dx: 1, dy: 0, count: 6, startOffset: cpuSize * 0.5 },
      { dx: 0, dy: 1, count: 8, startOffset: cpuSize * 0.5 },
      { dx: 0, dy: -1, count: 5, startOffset: cpuSize * 0.5 }
    ]

    cardinalDirections.forEach((dir, dirIdx) => {
      for (let i = 0; i < dir.count; i++) {
        const spread = (i - (dir.count - 1) / 2) * 26
        let startX = cpuX
        let startY = cpuY

        if (dir.dx !== 0) {
          startX = cpuX + dir.dx * dir.startOffset
          startY = cpuY + spread
        } else {
          startX = cpuX + spread
          startY = cpuY + dir.dy * dir.startOffset
        }

        const pts: TracePoint[] = [{ x: startX, y: startY }]

        // Segment 1: Straight outward run
        const seg1Len = 40 + (i % 3) * 35
        let currX = startX + dir.dx * seg1Len
        let currY = startY + dir.dy * seg1Len
        pts.push({ x: currX, y: currY })

        // Segment 2: 45-degree chamfer bend
        const chamfer = 32
        const chamferDir = i % 2 === 0 ? 1 : -1
        if (dir.dx !== 0) {
          currX += dir.dx * chamfer
          currY += chamferDir * chamfer
        } else {
          currX += chamferDir * chamfer
          currY += dir.dy * chamfer
        }
        pts.push({ x: currX, y: currY })

        // Segment 3: Secondary run to bus terminate or via pad
        const seg3Len = 90 + ((i * 37) % 180)
        if (dir.dx !== 0) {
          currX += dir.dx * seg3Len
        } else {
          currY += dir.dy * seg3Len
        }
        pts.push({ x: currX, y: currY })

        // Optional Segment 4: 90 deg via escape
        if (i % 2 === 1) {
          const seg4Len = 60 + (i * 20)
          if (dir.dx !== 0) {
            currY += chamferDir * seg4Len
          } else {
            currX += chamferDir * seg4Len
          }
          pts.push({ x: currX, y: currY })
        }

        const lastPt = pts[pts.length - 1]
        // Terminating via pad
        vias.push({
          x: lastPt.x,
          y: lastPt.y,
          radius: 3.5,
          color: 'rgba(224, 159, 62, 0.45)',
          ringColor: 'rgba(189, 99, 70, 0.35)',
          pulsePhase: Math.random() * Math.PI * 2
        })

        // Intermediate decoupling capacitor on some traces
        if (pts.length >= 3 && i % 2 === 0) {
          const midPt = pts[1]
          capacitors.push({
            x: midPt.x,
            y: midPt.y,
            width: 7,
            height: 12,
            angle: dir.dx !== 0 ? 0 : Math.PI / 2
          })
        }

        traces.push({
          points: pts,
          color: busColors[dirIdx % busColors.length],
          width: 1.25,
          pulseColor: pulseColors[(i + dirIdx) % pulseColors.length],
          pulseSpeed: 0.18 + ((i * 13) % 20) * 0.015,
          pulseLength: 0.12,
          pulseProgress: (i * 0.18) % 1,
          pulseActive: true,
          pulseDelay: Math.random() * 2
        })
      }
    })

    // 3. Peripheral Auxiliary Traces (Edge routing & ground stitching)
    const auxCount = Math.floor(Math.min(width, height) / 120)
    for (let k = 0; k < auxCount; k++) {
      const edge = k % 4
      let sx = 0
      let sy = 0
      let ex = 0
      let ey = 0

      if (edge === 0) { // Top edge
        sx = 50 + (k * 180) % width
        sy = 30
        ex = sx + 140
        ey = 170
      } else if (edge === 1) { // Bottom edge
        sx = 80 + (k * 210) % width
        sy = height - 40
        ex = sx - 120
        ey = height - 180
      } else if (edge === 2) { // Left edge
        sx = 35
        sy = 100 + (k * 160) % height
        ex = 180
        ey = sy + 90
      } else { // Right edge
        sx = width - 40
        sy = 80 + (k * 170) % height
        ex = width - 200
        ey = sy - 90
      }

      const midX = (sx + ex) / 2
      const auxPts = [
        { x: sx, y: sy },
        { x: midX, y: sy },
        { x: ex, y: ey }
      ]

      traces.push({
        points: auxPts,
        color: 'rgba(25, 49, 38, 0.12)',
        width: 1,
        pulseColor: 'rgba(189, 99, 70, 0.75)',
        pulseSpeed: 0.15 + (k % 5) * 0.02,
        pulseLength: 0.15,
        pulseProgress: (k * 0.23) % 1,
        pulseActive: true,
        pulseDelay: Math.random() * 3
      })

      vias.push({
        x: ex,
        y: ey,
        radius: 3,
        color: 'rgba(224, 159, 62, 0.35)',
        ringColor: 'rgba(25, 49, 38, 0.25)',
        pulsePhase: Math.random() * Math.PI * 2
      })
    }
  }

  // Draw pure static blueprint (for reduced motion or fallback)
  function renderStatic() {
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)
    drawBackgroundBlueprint(0)
  }

  function drawBackgroundBlueprint(time: number) {
    if (!ctx) return

    // 1. Draw CPU Socket & Die Geometry
    if (cpuSocket) {
      const { x, y, size, pins } = cpuSocket

      // Outer PCB Substrate Carrier (anodized ceramic outline)
      ctx.save()
      ctx.strokeStyle = 'rgba(25, 49, 38, 0.18)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(x - size / 2, y - size / 2, size, size)

      // Chamfered golden orientation notch (Pin 1 indicator)
      ctx.fillStyle = 'rgba(224, 159, 62, 0.45)'
      ctx.beginPath()
      ctx.moveTo(x - size / 2, y - size / 2)
      ctx.lineTo(x - size / 2 + 16, y - size / 2)
      ctx.lineTo(x - size / 2, y - size / 2 + 16)
      ctx.closePath()
      ctx.fill()

      // Inner Silicon Die Heat Spreader
      const dieSize = size * 0.44
      ctx.fillStyle = 'rgba(243, 236, 224, 0.5)'
      ctx.strokeStyle = 'rgba(189, 99, 70, 0.25)'
      ctx.lineWidth = 1
      ctx.fillRect(x - dieSize / 2, y - dieSize / 2, dieSize, dieSize)
      ctx.strokeRect(x - dieSize / 2, y - dieSize / 2, dieSize, dieSize)

      // Silkscreen Technical Legend
      ctx.fillStyle = 'rgba(25, 49, 38, 0.45)'
      ctx.font = '600 9px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('AURA-M4 IMC', x, y - 8)
      ctx.font = '500 7.5px monospace'
      ctx.fillStyle = 'rgba(189, 99, 70, 0.6)'
      ctx.fillText('64-BIT MONOLITH', x, y + 6)

      // LGA Pin Grid Array
      ctx.fillStyle = 'rgba(224, 159, 62, 0.35)'
      pins.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.25, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.restore()
    }

    // 2. Draw Circuit Traces
    traces.forEach((tr) => {
      if (tr.points.length < 2) return

      // Proximity to mouse
      let proximityBonus = 0
      if (mouseX > 0 && mouseY > 0) {
        for (const pt of tr.points) {
          const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY)
          if (dist < 140) {
            proximityBonus = Math.max(proximityBonus, (1 - dist / 140) * 0.35)
          }
        }
      }

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(tr.points[0].x, tr.points[0].y)
      for (let i = 1; i < tr.points.length; i++) {
        ctx.lineTo(tr.points[i].x, tr.points[i].y)
      }

      if (proximityBonus > 0) {
        ctx.strokeStyle = `rgba(189, 99, 70, ${0.18 + proximityBonus})`
        ctx.lineWidth = tr.width + 0.5
      } else {
        ctx.strokeStyle = tr.color
        ctx.lineWidth = tr.width
      }
      ctx.stroke()
      ctx.restore()

      // 3. Draw Ambient Signal Pulses (Skipped if reduced motion)
      if (!isReducedMotion && tr.pulseActive) {
        drawTracePulse(tr)
      }
    })

    // 4. Draw Decoupling SMD Capacitors
    capacitors.forEach((cap) => {
      ctx.save()
      ctx.translate(cap.x, cap.y)
      ctx.rotate(cap.angle)

      // Capacitor body (ceramic tan)
      ctx.fillStyle = 'rgba(214, 200, 180, 0.65)'
      ctx.fillRect(-cap.width / 2, -cap.height / 2, cap.width, cap.height)

      // Metallic end caps (solder silver)
      ctx.fillStyle = 'rgba(180, 175, 168, 0.85)'
      ctx.fillRect(-cap.width / 2, -cap.height / 2, cap.width, 2.5)
      ctx.fillRect(-cap.width / 2, cap.height / 2 - 2.5, cap.width, 2.5)
      ctx.restore()
    })

    // 5. Draw Via Solder Pads with subtle pulsing
    vias.forEach((v) => {
      const breathing = !isReducedMotion ? Math.sin(time * 0.002 + v.pulsePhase) * 0.15 : 0
      const currentRadius = v.radius + (breathing > 0 ? breathing : 0)

      ctx.save()
      // Outer copper ring
      ctx.beginPath()
      ctx.arc(v.x, v.y, currentRadius + 1.5, 0, Math.PI * 2)
      ctx.fillStyle = v.ringColor
      ctx.fill()

      // Inner gold pad
      ctx.beginPath()
      ctx.arc(v.x, v.y, currentRadius, 0, Math.PI * 2)
      ctx.fillStyle = v.color
      ctx.fill()

      // Center drill hole
      ctx.beginPath()
      ctx.arc(v.x, v.y, 1, 0, Math.PI * 2)
      ctx.fillStyle = '#F7F4EE' // Matches background canvas
      ctx.fill()
      ctx.restore()
    })
  }

  // Calculate length and interpolate along polyline
  function drawTracePulse(tr: CircuitTrace) {
    if (!ctx) return
    const pts = tr.points
    let totalLength = 0
    const segLengths: number[] = []

    for (let i = 0; i < pts.length - 1; i++) {
      const len = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y)
      segLengths.push(len)
      totalLength += len
    }

    if (totalLength === 0) return

    const headDistance = tr.pulseProgress * totalLength

    const headPos = getPointAtDistance(pts, segLengths, headDistance)
    if (!headPos) return

    // Draw glowing packet head
    ctx.save()
    const gradient = ctx.createRadialGradient(headPos.x, headPos.y, 0.5, headPos.x, headPos.y, 4.5)
    gradient.addColorStop(0, tr.pulseColor)
    gradient.addColorStop(0.5, tr.pulseColor.replace(/[\d.]+\)$/, '0.35)'))
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(headPos.x, headPos.y, 4.5, 0, Math.PI * 2)
    ctx.fill()

    // Core bright point
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(headPos.x, headPos.y, 1.25, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  function getPointAtDistance(pts: TracePoint[], segLengths: number[], dist: number): TracePoint | null {
    let accumulated = 0
    for (let i = 0; i < segLengths.length; i++) {
      const segLen = segLengths[i]
      if (dist <= accumulated + segLen) {
        const ratio = (dist - accumulated) / segLen
        return {
          x: pts[i].x + (pts[i + 1].x - pts[i].x) * ratio,
          y: pts[i].y + (pts[i + 1].y - pts[i].y) * ratio
        }
      }
      accumulated += segLen
    }
    return pts[pts.length - 1]
  }

  let lastTimestamp = performance.now()

  function loop(timestamp: number) {
    if (document.hidden) {
      animationFrameId = requestAnimationFrame(loop)
      return
    }

    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1)
    lastTimestamp = timestamp

    // Smooth mouse position interpolation
    mouseX += (targetMouseX - mouseX) * 0.15
    mouseY += (targetMouseY - mouseY) * 0.15

    // Progress trace pulses
    traces.forEach((tr) => {
      tr.pulseProgress += tr.pulseSpeed * dt
      if (tr.pulseProgress > 1) {
        tr.pulseProgress = 0
      }
    })

    ctx!.clearRect(0, 0, width, height)
    drawBackgroundBlueprint(timestamp)

    animationFrameId = requestAnimationFrame(loop)
  }

  initGeometry()

  if (isReducedMotion) {
    renderStatic()
  } else {
    animationFrameId = requestAnimationFrame(loop)
  }

  // Responsive resize handler with debouncing
  let resizeTimeout: any = null
  function handleResize() {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      initGeometry()
      if (isReducedMotion) renderStatic()
    }, 150)
  }

  window.addEventListener('resize', handleResize)

  onUnmounted(() => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseleave', onMouseLeave)
  })
})
</script>

<style scoped>
.circuit-bg-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  opacity: 0.72;
}

.circuit-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
