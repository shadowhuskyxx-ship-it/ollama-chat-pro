'use client'

import { useEffect, useState, useCallback } from 'react'

export default function EasterEgg() {
  const [konamiProgress, setKonamiProgress] = useState(0)
  const [partyMode, setPartyMode] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  const konamiCode = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
  ]

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === konamiCode[konamiProgress]) {
      const newProgress = konamiProgress + 1
      setKonamiProgress(newProgress)
      
      if (newProgress === konamiCode.length) {
        // Konami code complete!
        setPartyMode(true)
        setShowConfetti(true)
        setTimeout(() => {
          setShowConfetti(false)
          setPartyMode(false)
        }, 5000)
        setKonamiProgress(0)
      }
    } else {
      setKonamiProgress(0)
    }
  }, [konamiProgress])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Triple-click logo easter egg
  const handleLogoClick = () => {
    setClickCount(prev => prev + 1)
    setTimeout(() => setClickCount(0), 500)
    
    if (clickCount >= 2) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }

  return (
    <>
      {/* Hidden click target for logo */}
      <div 
        onClick={handleLogoClick}
        className="fixed top-2 left-1/2 -translate-x-1/2 w-20 h-10 cursor-pointer z-50 opacity-0"
      />

      {/* Party mode overlay */}
      {partyMode && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="w-full h-full" style={{ animation: 'rainbow 2s linear infinite' }} />
        </div>
      )}

      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                backgroundColor: ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#22c55e', '#eab308'][Math.floor(Math.random() * 6)],
                animation: `confettiFall ${2 + Math.random() * 2}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes confettiFall {
          to {
            transform: translateY(100vh) rotate(720deg);
          }
        }
      `}</style>
    </>
  )
}
