'use client'

import { Player } from '@/types'
import { updatePlayer } from '@/services/playerService'
import { useState } from 'react'

interface PlayerCardProps {
  player: Player
  onEdit: (player: Player) => void
  onStatusChange: () => void
}

export default function PlayerCard({ player, onEdit, onStatusChange }: PlayerCardProps) {
  const [loading, setLoading] = useState(false)

  async function handleToggleActive() {
    setLoading(true)
    try {
      await updatePlayer(player.id, { active: !player.active })
      onStatusChange()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    } finally {
      setLoading(false)
    }
  }

  const positionLabel = player.primary_position === 'goalkeeper' ? 'Goleiro' : 'Linha'
  const displayName = player.nickname ? `${player.name} (${player.nickname})` : player.name

  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderColor: player.active ? '#15803D' : '#9CA3AF' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-gray-800">{displayName}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {positionLabel}
            {player.phone && ` • ${player.phone}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(player)}
            className="p-2 hover:bg-gray-100 rounded-lg transition text-blue-600"
          >
            ✏️
          </button>
          <button
            onClick={handleToggleActive}
            disabled={loading}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
              player.active
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {loading ? '...' : player.active ? 'Ativo' : 'Inativo'}
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
          player.primary_position === 'goalkeeper'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {positionLabel}
        </span>
      </div>
    </div>
  )
}
