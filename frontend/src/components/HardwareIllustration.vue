<template>
  <div class="hardware-illustration" :class="`finish-${currentFinish}`">
    <!-- 1. Mechanical Keyboard Orthographic Blueprint -->
    <svg
      v-if="illustrationType === 'keyboard'"
      class="blueprint-svg keyboard-svg"
      viewBox="0 0 320 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mechanical Keyboard Blueprint Illustration"
    >
      <!-- Drop Shadow Filter -->
      <defs>
        <filter id="kb-shadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="rgba(15, 23, 18, 0.28)" />
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(15, 23, 18, 0.15)" />
        </filter>
        <linearGradient id="kb-case-grad" x1="0" y1="0" x2="320" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" :stop-color="caseColorPrimary" />
          <stop offset="100%" :stop-color="caseColorSecondary" />
        </linearGradient>
        <linearGradient id="brass-badge-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#E5A84B" />
          <stop offset="50%" stop-color="#FFD782" />
          <stop offset="100%" stop-color="#C6892E" />
        </linearGradient>
      </defs>

      <!-- CNC Machined Aluminum Case Outer Bevel -->
      <rect
        x="20"
        y="25"
        width="280"
        height="130"
        rx="12"
        fill="url(#kb-case-grad)"
        stroke="rgba(255, 255, 255, 0.22)"
        stroke-width="1.2"
        filter="url(#kb-shadow)"
      />

      <!-- Recessed Switch Plate (Anodized FR4 / Aluminum) -->
      <rect
        x="28"
        y="33"
        width="264"
        height="114"
        rx="7"
        fill="rgba(0, 0, 0, 0.32)"
        stroke="rgba(255, 255, 255, 0.08)"
        stroke-width="1"
      />

      <!-- Polished Brass Weight Badge on Top Right Edge -->
      <rect x="238" y="27" width="46" height="4" rx="2" fill="url(#brass-badge-grad)" />

      <!-- Row 1: Function / Number Row (14 keys) -->
      <g class="key-row">
        <!-- ESC Accent Key -->
        <rect x="34" y="38" width="16" height="15" rx="3" :fill="accentKeyColor" stroke="rgba(255,255,255,0.3)" stroke-width="0.8" />
        <!-- Alpha keys 1-12 -->
        <rect v-for="i in 11" :key="`r1-${i}`" :x="53 + (i - 1) * 18" y="38" width="15" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
        <!-- Backspace -->
        <rect x="251" y="38" width="35" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
      </g>

      <!-- Row 2: QWERTY Row -->
      <g class="key-row">
        <rect x="34" y="56" width="22" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
        <rect v-for="i in 11" :key="`r2-${i}`" :x="59 + (i - 1) * 18" y="56" width="15" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
        <rect x="257" y="56" width="29" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
      </g>

      <!-- Row 3: Home Row (with tactile homing bar markers on F and J) -->
      <g class="key-row">
        <rect x="34" y="74" width="26" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
        <rect v-for="i in 10" :key="`r3-${i}`" :x="63 + (i - 1) * 18" y="74" width="15" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
        <!-- Return Key (Accent) -->
        <rect x="243" y="74" width="43" height="15" rx="3" :fill="accentKeyColor" stroke="rgba(255,255,255,0.3)" stroke-width="0.8" />
      </g>

      <!-- Row 4: Shift Row -->
      <g class="key-row">
        <rect x="34" y="92" width="34" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
        <rect v-for="i in 9" :key="`r4-${i}`" :x="71 + (i - 1) * 18" y="92" width="15" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
        <rect x="233" y="92" width="53" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
      </g>

      <!-- Row 5: Bottom Modifier Row & 6.25u Spacebar -->
      <g class="key-row">
        <rect x="34" y="110" width="20" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
        <rect x="57" y="110" width="18" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
        <rect x="78" y="110" width="18" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
        <!-- Smooth 6.25u Spacebar -->
        <rect x="99" y="110" width="105" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.16)" stroke-width="0.8" />
        <!-- Modifiers Right & Arrow Cluster -->
        <rect x="207" y="110" width="18" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
        <rect x="228" y="110" width="18" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
        <rect x="249" y="110" width="16" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
        <rect x="268" y="110" width="18" height="15" rx="3" fill="var(--key-cap-fill)" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
      </g>

      <!-- Technical Callout Marker Pin: Cherry MX Stem -->
      <g class="technical-node" transform="translate(150, 137)">
        <circle cx="0" cy="0" r="3" fill="var(--accent-amber)" />
        <line x1="5" y1="0" x2="35" y2="0" stroke="var(--accent-amber)" stroke-width="0.8" stroke-dasharray="2 2" />
        <text x="40" y="3" fill="var(--accent-amber)" font-size="7.5" font-family="'DM Mono', monospace" letter-spacing="0.5">CHERRY MX RED • 45g</text>
      </g>
    </svg>

    <!-- 2. Ergonomic Wireless Mouse Orthographic Contour -->
    <svg
      v-else-if="illustrationType === 'mouse'"
      class="blueprint-svg mouse-svg"
      viewBox="0 0 320 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Wireless Ergonomic Mouse Blueprint Illustration"
    >
      <defs>
        <filter id="mouse-shadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="rgba(15, 23, 18, 0.3)" />
        </filter>
        <linearGradient id="mouse-body-grad" x1="160" y1="15" x2="160" y2="165" gradientUnits="userSpaceOnUse">
          <stop offset="0%" :stop-color="caseColorPrimary" />
          <stop offset="100%" :stop-color="caseColorSecondary" />
        </linearGradient>
        <linearGradient id="scroll-wheel-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E5A84B" />
          <stop offset="50%" stop-color="#C6892E" />
          <stop offset="100%" stop-color="#8E5E17" />
        </linearGradient>
      </defs>

      <!-- Ambient Drop Base Shadow Silhouette -->
      <path
        d="M160 18C125 18 108 50 106 95C104 135 125 162 160 162C195 162 216 135 214 95C212 50 195 18 160 18Z"
        fill="rgba(0,0,0,0.18)"
        filter="url(#mouse-shadow)"
      />

      <!-- Outer Ergonomic Shell -->
      <path
        d="M160 20C128 20 110 52 108 95C106 134 126 160 160 160C194 160 214 134 212 95C210 52 192 20 160 20Z"
        fill="url(#mouse-body-grad)"
        stroke="rgba(255, 255, 255, 0.2)"
        stroke-width="1.2"
      />

      <!-- Split Left & Right Click Triggers -->
      <path d="M160 22V65" stroke="rgba(255, 255, 255, 0.25)" stroke-width="1" />
      <path d="M116 65C135 68 185 68 204 65" stroke="rgba(255, 255, 255, 0.15)" stroke-width="0.9" />

      <!-- Milled Brass Knurled Scroll Wheel -->
      <rect x="154" y="32" width="12" height="24" rx="4" fill="url(#scroll-wheel-grad)" stroke="rgba(255,255,255,0.4)" stroke-width="0.8" />
      <line x1="154" y1="38" x2="166" y2="38" stroke="rgba(0,0,0,0.3)" stroke-width="1" />
      <line x1="154" y1="44" x2="166" y2="44" stroke="rgba(0,0,0,0.3)" stroke-width="1" />
      <line x1="154" y1="50" x2="166" y2="50" stroke="rgba(0,0,0,0.3)" stroke-width="1" />

      <!-- DPI Toggle Switch Pill -->
      <rect x="156" y="60" width="8" height="10" rx="3" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.18)" stroke-width="0.6" />

      <!-- Ergonomic Palm Arc Contour Line -->
      <path
        d="M125 105C140 120 180 120 195 105"
        stroke="rgba(255, 255, 255, 0.18)"
        stroke-width="1"
        stroke-dasharray="3 3"
      />

      <!-- Technical Telemetry Badge: PixArt Optical Sensor -->
      <g class="technical-node" transform="translate(160, 136)">
        <circle cx="0" cy="0" r="3.5" :fill="accentKeyColor" />
        <circle cx="0" cy="0" r="7" :stroke="accentKeyColor" stroke-width="0.8" stroke-dasharray="1.5 1.5" />
        <text x="14" y="3" fill="var(--text-secondary)" font-size="7.5" font-family="'DM Mono', monospace" letter-spacing="0.5">PIXART 26K DPI • 64g</text>
      </g>
    </svg>

    <!-- 3. High-Refresh QHD Gaming Monitor Blueprint -->
    <svg
      v-else-if="illustrationType === 'monitor'"
      class="blueprint-svg monitor-svg"
      viewBox="0 0 320 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="27-Inch QHD Fast-IPS Gaming Monitor Blueprint Illustration"
    >
      <defs>
        <filter id="mon-shadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="rgba(15, 23, 18, 0.3)" />
        </filter>
        <linearGradient id="screen-grad" x1="50" y1="20" x2="270" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#151E28" />
          <stop offset="100%" stop-color="#0A0F15" />
        </linearGradient>
      </defs>

      <!-- Sculpted Stand Stem & Base -->
      <path d="M154 125L150 152H170L166 125Z" fill="url(#brass-badge-grad)" opacity="0.85" />
      <!-- Solid Heavyweight Ceramic Circular Desk Base -->
      <ellipse cx="160" cy="156" rx="42" ry="9" fill="url(#kb-case-grad)" stroke="rgba(255,255,255,0.2)" stroke-width="1.2" filter="url(#mon-shadow)" />

      <!-- Outer 3-Sided Micro-Bezel Panel -->
      <rect
        x="38"
        y="16"
        width="244"
        height="115"
        rx="6"
        fill="#121820"
        stroke="rgba(255, 255, 255, 0.24)"
        stroke-width="1.2"
        filter="url(#mon-shadow)"
      />

      <!-- Active Display Area (Anti-Glare Matte QHD IPS) -->
      <rect
        x="42"
        y="20"
        width="236"
        height="103"
        rx="3"
        fill="url(#screen-grad)"
        stroke="rgba(255, 255, 255, 0.08)"
        stroke-width="0.8"
      />

      <!-- Display Matrix Calibration Grid Pattern -->
      <line x1="160" y1="20" x2="160" y2="123" stroke="rgba(255,255,255,0.06)" stroke-width="0.8" stroke-dasharray="3 3" />
      <line x1="42" y1="71" x2="278" y2="71" stroke="rgba(255,255,255,0.06)" stroke-width="0.8" stroke-dasharray="3 3" />

      <!-- Center Calibration Ring -->
      <circle cx="160" cy="71" r="18" stroke="rgba(255,255,255,0.12)" stroke-width="0.9" />
      <circle cx="160" cy="71" r="2.5" :fill="accentKeyColor" />

      <!-- Technical Refresh & Resolution HUD Overlay -->
      <text x="50" y="33" fill="var(--accent-amber)" font-size="7" font-family="'DM Mono', monospace">2560x1440 QHD</text>
      <text x="238" y="33" fill="var(--accent-sage)" font-size="7" font-family="'DM Mono', monospace">144Hz • 1ms</text>
      <text x="50" y="116" fill="rgba(255,255,255,0.4)" font-size="6.5" font-family="'DM Mono', monospace">IPS 99% sRGB • HDR400</text>
      <text x="220" y="116" fill="var(--accent-terracotta)" font-size="6.5" font-family="'DM Mono', monospace">FREESYNC PRO</text>
    </svg>

    <!-- 4. Default / Audiophile Headphones Blueprint Fallback -->
    <svg
      v-else
      class="blueprint-svg audio-svg"
      viewBox="0 0 320 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Precision Audio Hardware Blueprint"
    >
      <path d="M90 100C90 55 120 30 160 30C200 30 230 55 230 100" stroke="url(#kb-case-grad)" stroke-width="6" stroke-linecap="round" />
      <rect x="80" y="85" width="22" height="42" rx="9" fill="url(#kb-case-grad)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
      <rect x="218" y="85" width="22" height="42" rx="9" fill="url(#kb-case-grad)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
      <circle cx="160" cy="150" r="3" :fill="accentKeyColor" />
      <text x="110" y="153" fill="var(--accent-amber)" font-size="7.5" font-family="'DM Mono', monospace">PLANAR MAGNETIC • 40mm</text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string;
    finish?: string;
  }>(),
  {
    finish: 'terracotta'
  }
)

const currentFinish = computed(() => props.finish || 'terracotta')

const illustrationType = computed<'keyboard' | 'mouse' | 'monitor' | 'audio'>(() => {
  const lower = (props.name || '').toLowerCase()
  if (lower.includes('keyboard')) return 'keyboard'
  if (lower.includes('mouse')) return 'mouse'
  if (lower.includes('monitor') || lower.includes('display')) return 'monitor'
  return 'audio'
})

// Dynamic case and accent colors matching the physical material finish
const caseColorPrimary = computed(() => {
  switch (currentFinish.value) {
    case 'slate':
      return '#262D37'
    case 'linen':
      return '#E4DACB'
    case 'sage':
      return '#31473B'
    case 'terracotta':
    default:
      return '#6C392A'
  }
})

const caseColorSecondary = computed(() => {
  switch (currentFinish.value) {
    case 'slate':
      return '#14181F'
    case 'linen':
      return '#C9BCAB'
    case 'sage':
      return '#1B2A22'
    case 'terracotta':
    default:
      return '#431F16'
  }
})

const accentKeyColor = computed(() => {
  switch (currentFinish.value) {
    case 'slate':
      return '#4A729A'
    case 'linen':
      return '#BD6346'
    case 'sage':
      return '#789B84'
    case 'terracotta':
    default:
      return '#BD6346'
  }
})
</script>

<style scoped>
.hardware-illustration {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  --key-cap-fill: rgba(255, 255, 255, 0.08);
}

.finish-linen {
  --key-cap-fill: rgba(45, 35, 25, 0.12);
}

.finish-slate {
  --key-cap-fill: rgba(255, 255, 255, 0.06);
}

.finish-sage {
  --key-cap-fill: rgba(255, 255, 255, 0.07);
}

.blueprint-svg {
  width: 100%;
  height: 100%;
  max-height: 170px;
  object-fit: contain;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.hardware-illustration:hover .blueprint-svg {
  transform: translateY(-2px) scale(1.02);
}
</style>
