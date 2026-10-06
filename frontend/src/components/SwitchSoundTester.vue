<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-backdrop" @click.self="close">
      <div class="sound-tester-modal ceramic-card" role="dialog" aria-modal="true" aria-labelledby="sound-tester-title">
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="header-left">
            <div class="wax-seal-clay header-seal">
              <SvgIcon name="volume-2" size="20" color="#FFFFFF" />
            </div>
            <div>
              <h3 id="sound-tester-title" class="modal-title font-display">Mechanical Switch Audition</h3>
              <p class="modal-subtitle">Real-time Web Audio acoustic profiling &bull; Press key or click below</p>
            </div>
          </div>
          <button type="button" class="close-btn" @click="close" aria-label="Close modal">
            <SvgIcon name="close" size="18" />
          </button>
        </div>

        <!-- Switch Profile Selector -->
        <div class="switch-selector-row">
          <button
            v-for="sw in switchProfiles"
            :key="sw.id"
            type="button"
            class="switch-pill"
            :class="{ active: currentSwitch.id === sw.id }"
            @click="selectSwitch(sw)"
          >
            <span class="switch-indicator" :style="{ backgroundColor: sw.color }"></span>
            <div class="switch-pill-info">
              <span class="switch-name">{{ sw.name }}</span>
              <span class="switch-sub">{{ sw.type }} &bull; {{ sw.force }}g</span>
            </div>
          </button>
        </div>

        <!-- Interactive Keycap & Travel Gauge Showcase -->
        <div class="interactive-stage debossed-well">
          <!-- Left: Big 3D Keycap -->
          <div class="keycap-container">
            <button
              type="button"
              class="tactile-keycap"
              :class="{
                'keycap-pressed': isPressed,
                [`switch-${currentSwitch.id}`]: true
              }"
              @mousedown="pressKey"
              @mouseup="releaseKey"
              @mouseleave="releaseKey"
              @touchstart.prevent="pressKey"
              @touchend.prevent="releaseKey"
            >
              <div class="keycap-top">
                <span class="key-legend font-display">{{ currentSwitch.keyLabel }}</span>
                <span class="key-sub">{{ currentSwitch.type }}</span>
              </div>
            </button>
            <span class="keycap-instruction">Click &amp; hold, or tap any key on your keyboard</span>
          </div>

          <!-- Right: Precision Stem Travel Gauge -->
          <div class="travel-gauge-box">
            <div class="gauge-header">
              <span class="gauge-label font-display">Actuation Telemetry</span>
              <span class="gauge-force-readout font-mono">{{ isPressed ? currentSwitch.bottomForce : 0 }}g</span>
            </div>

            <!-- Vertical Linear Travel Rail -->
            <div class="travel-rail">
              <!-- Actuation Marker at 2.0mm -->
              <div class="actuation-marker" style="top: 50%;">
                <span class="marker-line"></span>
                <span class="marker-text font-mono">2.0mm ACTUATION</span>
              </div>
              <!-- Bottom Out Marker at 4.0mm -->
              <div class="bottom-marker" style="top: 100%;">
                <span class="marker-line"></span>
                <span class="marker-text font-mono">4.0mm BOTTOM-OUT</span>
              </div>
              <!-- Moving Stem Indicator -->
              <div
                class="travel-stem"
                :style="{
                  top: isPressed ? '100%' : '0%',
                  backgroundColor: currentSwitch.color
                }"
              >
                <div class="stem-cross"></div>
              </div>
            </div>

            <div class="telemetry-tags">
              <span class="telemetry-badge" :class="{ active: isPressed }">
                {{ isPressed ? 'CONTACT ACTUATED' : 'CIRCUIT OPEN' }}
              </span>
              <span class="telemetry-badge">
                {{ currentSwitch.tactileFeel }}
              </span>
            </div>
          </div>
        </div>

        <!-- Modal Footer Description -->
        <div class="modal-footer">
          <div class="acoustic-meta">
            <SvgIcon name="terminal" size="16" color="var(--accent-terracotta)" />
            <span class="font-mono acoustic-desc">{{ currentSwitch.acousticProfile }}</span>
          </div>
          <button type="button" class="btn-clay-terracotta" @click="close">
            <span>Done Auditioning</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import SvgIcon from './SvgIcon.vue'

interface SwitchProfile {
  id: 'red' | 'brown' | 'blue'
  name: string
  type: string
  force: number
  bottomForce: number
  color: string
  keyLabel: string
  tactileFeel: string
  acousticProfile: string
}

const switchProfiles: SwitchProfile[] = [
  {
    id: 'red',
    name: 'Cherry MX Red',
    type: 'Smooth Linear',
    force: 45,
    bottomForce: 60,
    color: '#E53E3E',
    keyLabel: 'LINEAR',
    tactileFeel: 'Zero Resistance • Constant Spring Rate',
    acousticProfile: 'Deep ceramic bottom-out "thock" with damped upstroke'
  },
  {
    id: 'brown',
    name: 'Cherry MX Brown',
    type: 'Tactile Bump',
    force: 55,
    bottomForce: 65,
    color: '#9C6F44',
    keyLabel: 'TACTILE',
    tactileFeel: 'Damped tactile actuation bump at 2.0mm',
    acousticProfile: 'Subtle mechanical friction impulse followed by solid bottoming'
  },
  {
    id: 'blue',
    name: 'Cherry MX Blue',
    type: 'Clicky Audible',
    force: 60,
    bottomForce: 70,
    color: '#3182CE',
    keyLabel: 'CLICKY',
    tactileFeel: 'Crisp click-jacket release threshold',
    acousticProfile: 'High-frequency 2.4kHz acoustic snap with metallic ring'
  }
]

const props = defineProps<{
  modelValue?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const isOpen = ref(false)
const currentSwitch = ref<SwitchProfile>(switchProfiles[0])
const isPressed = ref(false)

// Web Audio API State
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new AudioContextClass()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playSynthesizedSwitchSound(sw: SwitchProfile, isDown: boolean) {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    if (sw.id === 'red') {
      // Linear Red: Soft low-frequency thock on press, light tap on release
      if (isDown) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(170, now)
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.055)

        gain.gain.setValueAtTime(0.35, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.06)
      } else {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(260, now)
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.025)

        gain.gain.setValueAtTime(0.12, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.03)
      }
    } else if (sw.id === 'brown') {
      // Tactile Brown: Mini actuation click + bottom-out thock
      if (isDown) {
        const bumpOsc = ctx.createOscillator()
        const bumpGain = ctx.createGain()
        bumpOsc.type = 'triangle'
        bumpOsc.frequency.setValueAtTime(820, now)
        bumpOsc.frequency.exponentialRampToValueAtTime(320, now + 0.015)

        bumpGain.gain.setValueAtTime(0.2, now)
        bumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015)

        bumpOsc.connect(bumpGain)
        bumpGain.connect(ctx.destination)
        bumpOsc.start(now)
        bumpOsc.stop(now + 0.02)

        const thockOsc = ctx.createOscillator()
        const thockGain = ctx.createGain()
        thockOsc.type = 'sine'
        thockOsc.frequency.setValueAtTime(190, now + 0.015)
        thockOsc.frequency.exponentialRampToValueAtTime(60, now + 0.065)

        thockGain.gain.setValueAtTime(0.3, now + 0.015)
        thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065)

        thockOsc.connect(thockGain)
        thockGain.connect(ctx.destination)
        thockOsc.start(now + 0.015)
        thockOsc.stop(now + 0.07)
      }
    } else if (sw.id === 'blue') {
      // Clicky Blue: Crisp metallic click snap
      if (isDown) {
        const snapOsc = ctx.createOscillator()
        const snapGain = ctx.createGain()
        snapOsc.type = 'square'
        snapOsc.frequency.setValueAtTime(2400, now)
        snapOsc.frequency.exponentialRampToValueAtTime(800, now + 0.018)

        snapGain.gain.setValueAtTime(0.32, now)
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02)

        snapOsc.connect(snapGain)
        snapGain.connect(ctx.destination)
        snapOsc.start(now)
        snapOsc.stop(now + 0.022)

        const baseOsc = ctx.createOscillator()
        const baseGain = ctx.createGain()
        baseOsc.type = 'triangle'
        baseOsc.frequency.setValueAtTime(280, now + 0.01)
        baseOsc.frequency.exponentialRampToValueAtTime(90, now + 0.055)

        baseGain.gain.setValueAtTime(0.25, now + 0.01)
        baseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055)

        baseOsc.connect(baseGain)
        baseGain.connect(ctx.destination)
        baseOsc.start(now + 0.01)
        baseOsc.stop(now + 0.06)
      } else {
        const retOsc = ctx.createOscillator()
        const retGain = ctx.createGain()
        retOsc.type = 'square'
        retOsc.frequency.setValueAtTime(1800, now)
        retOsc.frequency.exponentialRampToValueAtTime(900, now + 0.012)

        retGain.gain.setValueAtTime(0.18, now)
        retGain.gain.exponentialRampToValueAtTime(0.001, now + 0.014)

        retOsc.connect(retGain)
        retGain.connect(ctx.destination)
        retOsc.start(now)
        retOsc.stop(now + 0.015)
      }
    }
  } catch (e) {
    // Graceful fallback
  }
}

function selectSwitch(sw: SwitchProfile) {
  currentSwitch.value = sw
  playSynthesizedSwitchSound(sw, true)
}

function pressKey() {
  if (isPressed.value) return
  isPressed.value = true
  playSynthesizedSwitchSound(currentSwitch.value, true)
}

function releaseKey() {
  if (!isPressed.value) return
  isPressed.value = false
  playSynthesizedSwitchSound(currentSwitch.value, false)
}

function handleKeyDown(e: KeyboardEvent) {
  if (!isOpen.value) return
  if (e.key === 'Escape') {
    close()
    return
  }
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return
  pressKey()
}

function handleKeyUp(e: KeyboardEvent) {
  if (!isOpen.value) return
  releaseKey()
}

function open() {
  isOpen.value = true
  emit('update:modelValue', true)
}

function close() {
  isOpen.value = false
  isPressed.value = false
  emit('update:modelValue', false)
}

defineExpose({
  open,
  close
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  if (audioCtx) {
    audioCtx.close().catch(() => {})
  }
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 18, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1.25rem;
}

.sound-tester-modal {
  width: 100%;
  max-width: 620px;
  background: var(--surface-card);
  border-radius: 1.5rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
  animation: modalPop 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalPop {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-seal {
  width: 44px;
  height: 44px;
}

.modal-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--surface-dark);
}

.modal-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: var(--surface-subtle);
  color: var(--text-primary);
}

/* Switch Pills Selector */
.switch-selector-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.switch-pill {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-subtle);
  background: var(--surface-subtle);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.switch-pill:hover {
  border-color: var(--accent-terracotta);
  transform: translateY(-1px);
}

.switch-pill.active {
  background: var(--surface-dark);
  color: #FFFFFF;
  border-color: transparent;
  box-shadow: 0 4px 14px rgba(25, 49, 38, 0.25);
}

.switch-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}

.switch-pill-info {
  display: flex;
  flex-direction: column;
}

.switch-name {
  font-size: 0.825rem;
  font-weight: 600;
}

.switch-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.switch-pill.active .switch-sub {
  color: rgba(255, 255, 255, 0.65);
}

/* Interactive Stage */
.interactive-stage {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 1.75rem;
  padding: 1.75rem;
  border-radius: 1rem;
  align-items: center;
}

.keycap-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.tactile-keycap {
  width: 140px;
  height: 120px;
  background: linear-gradient(180deg, #3A4452 0%, #202731 100%);
  border-radius: 1rem;
  border: none;
  cursor: pointer;
  box-shadow:
    0 12px 0 #141920,
    0 18px 25px rgba(0, 0, 0, 0.35);
  transform: translateY(0);
  transition: transform 0.08s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.08s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 6px;
  user-select: none;
}

.tactile-keycap:hover {
  transform: translateY(-2px);
  box-shadow:
    0 14px 0 #141920,
    0 22px 30px rgba(0, 0, 0, 0.4);
}

.tactile-keycap.keycap-pressed {
  transform: translateY(10px);
  box-shadow:
    0 2px 0 #141920,
    0 6px 12px rgba(0, 0, 0, 0.3);
}

.keycap-top {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #444F5F 0%, #2E3844 100%);
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.key-legend {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.key-sub {
  font-size: 0.65rem;
  text-transform: uppercase;
  color: var(--accent-amber);
  margin-top: 0.25rem;
}

.keycap-instruction {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
}

/* Travel Gauge */
.travel-gauge-box {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.gauge-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.gauge-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--surface-dark);
}

.gauge-force-readout {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--accent-terracotta);
}

.travel-rail {
  position: relative;
  height: 110px;
  background: rgba(0, 0, 0, 0.12);
  border-radius: 0.5rem;
  border: 1px solid var(--border-subtle);
  padding: 0 0.5rem;
}

.actuation-marker,
.bottom-marker {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  pointer-events: none;
  transform: translateY(-50%);
}

.marker-line {
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.15);
  border-top: 1px dashed var(--accent-amber);
}

.marker-text {
  font-size: 0.625rem;
  color: var(--text-muted);
  padding-right: 0.5rem;
}

.travel-stem {
  position: absolute;
  left: 12px;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  transform: translateY(-50%);
  transition: top 0.08s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stem-cross {
  width: 10px;
  height: 10px;
  background: rgba(255, 255, 255, 0.9);
  clip-path: polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%);
}

.telemetry-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.telemetry-badge {
  font-size: 0.675rem;
  font-family: 'DM Mono', monospace;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: var(--surface-subtle);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

.telemetry-badge.active {
  background: var(--accent-success);
  color: #FFFFFF;
  border-color: transparent;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-subtle);
}

.acoustic-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.acoustic-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}

@media (max-width: 600px) {
  .interactive-stage {
    grid-template-columns: 1fr;
  }
  .switch-selector-row {
    grid-template-columns: 1fr;
  }
  .modal-footer {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
