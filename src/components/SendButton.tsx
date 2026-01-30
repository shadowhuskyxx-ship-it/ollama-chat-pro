'use client'

import { Send, Sparkles } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

interface SendButtonProps {
  disabled: boolean
  onClick?: () => void
}

export default function SendButton({ disabled, onClick }: SendButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const newRipple = { id: Date.now(), x, y }
    setRipples(prev => [...prev, newRipple])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 600)
  }

  return (
    <button
      type="submit"
      disabled={disabled}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={clsx(
        "relative p-3 rounded-xl flex-shrink-0 overflow-hidden",
        "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
        "text-white",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        "transition-all duration-300",
        !disabled && "hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105",
        !disabled && isHovered && "animate-pulse"
      )}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '10px',
            height: '10px',
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 0.6s ease-out forwards',
          }}
        />
      ))}
      
      {/* Icon with animation */}
      <div className={clsx(
        "transition-transform duration-300",
        isHovered && !disabled && "rotate-12 scale-110"
      )}>
        {isHovered && !disabled ? (
          <Sparkles className="w-5 h-5" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </div>
    </button>
  )
}
