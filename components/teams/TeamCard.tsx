'use client'

import { Team, Player } from '@/types'
import { removeTeamMember } from '@/services/teamService'
import { useState } from 'react'

interface TeamCardProps {
  team: Team
  members: any[]
  onMemberRemove: () => void
  onEdit?: () => void
}

export default function TeamCard({ team, members, onMemberRemove, onEdit }: TeamCardProps) {
  const [loading, setLoading] = useState(false)

  const goalkeeper = members.find(m => m.role === 'goalkeeper')
  const fieldPlayers = members.filter(m => m.role === 'line')

  async function handleRemoveMember(memberId: number) {
    setLoading(true)
    try {
      await removeTeamMember(memberId)
      onMemberRemove()
    } catch (error) {
      console.error('Erro ao remover membro:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border-t-4" style={{ borderColor: team.color }}>
      {/* Header */}
      <div className="p-4" style={{ backgroundColor: team.color + '20' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{team.name}</h3>
            <p className="text-sm text-gray-600">👕 {members.length} jogadores</p>
          </div>
          <div
            className="w-12 h-12 rounded-lg"
            style={{ backgroundColor: team.color }}
            title={team.name}
          />
        </div>
      </div>

      {/* Goleiro */}
      {goalkeeper && (
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">🧤 Goleiro</p>
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
            <div>
              <p className="font-semibold text-gray-800">{goalkeeper.players.name}</p>
              {goalkeeper.players.nickname && (
                <p className="text-xs text-gray-600">{goalkeeper.players.nickname}</p>
              )}
            </div>
            <button
              onClick={() => handleRemoveMember(goalkeeper.id)}
              disabled={loading}
              className="text-red-600 hover:text-red-700 font-bold disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Linha */}
      <div className="px-4 py-3">
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">⚽ Linha ({fieldPlayers.length})</p>
        <div className="space-y-2">
          {fieldPlayers.map((member) => (
            <div key={member.id} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
              <div>
                <p className="font-semibold text-gray-800">{member.players.name}</p>
                {member.players.nickname && (
                  <p className="text-xs text-gray-600">{member.players.nickname}</p>
                )}
              </div>
              <button
                onClick={() => handleRemoveMember(member.id)}
                disabled={loading}
                className="text-red-600 hover:text-red-700 font-bold disabled:opacity-50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Ações */}
      {onEdit && (
        <div className="px-4 py-3 border-t border-gray-200">
          <button
            onClick={onEdit}
            className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2 rounded-lg transition"
          >
            ✏️ Editar
          </button>
        </div>
      )}
    </div>
  )
}
