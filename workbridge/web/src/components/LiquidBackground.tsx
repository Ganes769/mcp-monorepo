import { motion } from 'framer-motion'

export function LiquidBackground() {
  return (
    <div className="liquid-bg" aria-hidden>
      <motion.div
        className="blob blob-a"
        animate={{ x: [0, 60, -20, 0], y: [0, -40, 30, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="blob blob-b"
        animate={{ x: [0, -50, 40, 0], y: [0, 50, -30, 0], scale: [1, 0.9, 1.15, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="blob blob-c"
        animate={{ x: [0, 30, -40, 0], y: [0, -20, 40, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="liquid-noise" />
      <div className="liquid-vignette" />
    </div>
  )
}
