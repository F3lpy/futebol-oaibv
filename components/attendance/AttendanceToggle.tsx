'use client'

import { useState } from 'react'
import { Player } from '@/types'
import { confirmAttendance, removeAttendance } from '@/services/attendanceService'

interface AttendanceToggleProps {
  player: Player
  eventId: number
  confirmed: boolean
  onToggle: () => void
}

export default function AttendanceToggle({
  player,
  eventId,
  confirmed,
  onToggle
}: AttendanceToggleProps) {
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    try {
      if (confirmed) {
        await removeAttendance(eventId, player.id)
      } else {
        await confirmAttendance(eventId, player.id)
      }
      onToggle()
    } catch (error) {
      console.error('Erro ao alterar presença:', error)
    } finally {
      setLoading(false)
    }
  }

  const displayName = player.nickname ? `${player.name} (${player.nickname})` : player.name
  const positionLabel = player.primary_position === 'goalkeeper' ? '🧤' : '⚽'

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border-2 transition cursor-pointer ${
        confirmed
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white hover:border-green-300'
      }`}
      onClick={handleToggle}
    >
      <div className="flex items-center gap-3 flex-1">
        <span className="text-2xl">{positionLabel}</span>
        <div>
          <p className={`font-semibold ${confirmed ? 'text-green-700' : 'text-gray-800'}`}>
            {displayName}
          </p>
          {player.phone && <p className="text-xs text-gray-500">{player.phone}</p>}
        </div>
      </div>

      <button
        disabled={loading}
        onClick={(e) => {
          e.stopPropagation()
          handleToggle()
        }}
        className={`ml-4 px-4 py-2 rounded-lg font-bold transition ${
          confirmed
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        } disabled:opacity-50`}
      >
        {loading ? '...' : confirmed ? '✓' : '○'}
      </button>
    </div>
  )
}
