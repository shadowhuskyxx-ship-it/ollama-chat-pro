'use client'

import { useEffect, useState } from 'react'

export default function Particles() {
  const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([])

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 20,
      duration: 15 + Math.random() * 10,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
