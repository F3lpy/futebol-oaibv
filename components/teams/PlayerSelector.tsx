'use client'

import { Player } from '@/types'
import { useState } from 'react'
import { addTeamMember } from '@/services/teamService'

interface PlayerSelectorProps {
  eventId: number
  teamId: number
  availablePlayers: Player[]
  onPlayerAdded: () => void
}

export default function PlayerSelector({
  eventId,
  teamId,
  availablePlayers,
  onPlayerAdded
}: PlayerSelectorProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [selectedRole, setSelectedRole] = useState<'goalkeeper' | 'line'>('line')
  const [loading, setLoading] = useState(false)

  async function handleAddPlayer() {
    if (!selectedPlayer) return

    setLoading(true)
    try {
      await addTeamMember(teamId, selectedPlayer.id, selectedRole)
      setShowModal(false)
      setSelectedPlayer(null)
      onPlayerAdded()
    } catch (error) {
      console.error('Erro ao adicionar jogador:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition"
      >
        + Adicionar Jogador
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Adicionar Jogador</h2>

            <div className="space-y-4">
              {/* Seletor de Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Posição
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'goalkeeper' | 'line')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="line">Linha</option>
                  <option value="goalkeeper">Goleiro</option>
                </select>
              </div>

              {/* Seletor de Jogador */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jogador
                </label>
                <select
                  value={selectedPlayer?.id || ''}
                  onChange={(e) => {
                    const player = availablePlayers.find(p => p.id === parseInt(e.target.value))
                    setSelectedPlayer(player || null)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Selecione um jogador --</option>
                  {availablePlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name} {player.nickname ? `(${player.nickname})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview */}
              {selectedPlayer && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-700">Preview:</p>
                  <p className="text-lg font-bold text-gray-800 mt-2">{selectedPlayer.name}</p>
                  {selectedPlayer.nickname && (
                    <p className="text-sm text-gray-600">({selectedPlayer.nickname})</p>
                  )}
                  <p className="text-xs text-gray-600 mt-2">
                    Posição: {selectedRole === 'goalkeeper' ? '🧤 Goleiro' : '⚽ Linha'}
                  </p>
                </div>
              )}

              {/* Aviso de repetição */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-700 text-xs">
                <p className="font-semibold mb-1">⚠️ Nota:</p>
                <p>Este jogador pode participar de mais de um time.</p>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddPlayer}
                  disabled={!selectedPlayer || loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Adicionando...' : 'Adicionar'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedPlayer(null)
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
