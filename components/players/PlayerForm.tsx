'use client'

import { useState, useEffect } from 'react'
import { Player, PlayerPosition } from '@/types'
import { createPlayer, updatePlayer } from '@/services/playerService'

interface PlayerFormProps {
  player?: Player
  onSuccess: () => void
  onCancel: () => void
}

export default function PlayerForm({ player, onSuccess, onCancel }: PlayerFormProps) {
  const [name, setName] = useState(player?.name || '')
  const [nickname, setNickname] = useState(player?.nickname || '')
  const [phone, setPhone] = useState(player?.phone || '')
  const [position, setPosition] = useState<PlayerPosition>(player?.primary_position || 'line')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (player) {
        await updatePlayer(player.id, {
          name,
          nickname: nickname || undefined,
          phone: phone || undefined,
          primary_position: position
        })
      } else {
        await createPlayer({
          name,
          nickname: nickname || undefined,
          phone: phone || undefined,
          primary_position: position,
          active: true
        })
      }
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar jogador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Nome *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Nome completo"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Apelido
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Apelido (opcional)"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Telefone
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="(11) 99999-9999"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Posição
        </label>
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value as PlayerPosition)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="line">Linha</option>
          <option value="goalkeeper">Goleiro</option>
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Salvando...' : player ? 'Atualizar' : 'Adicionar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
