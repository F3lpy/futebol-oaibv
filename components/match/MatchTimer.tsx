'use client'

import { useEffect, useState } from 'react'

interface MatchTimerProps {
  duration: number // em minutos
  status: 'waiting' | 'live' | 'paused' | 'finished'
  elapsedSeconds: number
  onTimeUpdate: (seconds: number) => void
  onTimeEnd: () => void
}

export default function MatchTimer({
  duration,
  status,
  elapsedSeconds,
  onTimeUpdate,
  onTimeEnd
}: MatchTimerProps) {
  const [currentSeconds, setCurrentSeconds] = useState(elapsedSeconds)

  const totalSeconds = duration * 60
  const remainingSeconds = Math.max(0, totalSeconds - currentSeconds)
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  useEffect(() => {
    setCurrentSeconds(elapsedSeconds)
  }, [elapsedSeconds])

  useEffect(() => {
    if (status !== 'live') return

    const interval = setInterval(() => {
      setCurrentSeconds(prev => {
        const next = prev + 1

        onTimeUpdate(next)

        if (next >= totalSeconds) {
          onTimeEnd()
          return totalSeconds
        }

        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [status, totalSeconds, onTimeUpdate, onTimeEnd])

  const progress = (currentSeconds / totalSeconds) * 100

  return (
    <div className="space-y-4">
      {/* Display principal */}
      <div className="text-center">
        <div className="text-6xl lg:text-8xl font-bold text-white tabular-nums">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <p className="text-gray-300 mt-2 text-sm">
          {status === 'live' && '🔴 AO VIVO'}
          {status === 'paused' && '⏸️ PAUSADO'}
          {status === 'waiting' && '⏱️ PRONTO'}
          {status === 'finished' && '✅ ENCERRADO'}
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-yellow-400 to-red-500 h-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Info */}
      <div className="text-center text-gray-300 text-sm">
        <p>{currentSeconds}s / {totalSeconds}s</p>
      </div>
    </div>
  )
}
