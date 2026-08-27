'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PlayerCard from '@/components/players/PlayerCard'
import PlayerForm from '@/components/players/PlayerForm'
import { getPlayers, searchPlayers } from '@/services/playerService'
import { Player } from '@/types'

export default function PlayersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadPlayers()
    }
  }, [user])

  async function loadPlayers() {
    setLoading(true)
    try {
      const data = await getPlayers()
      setPlayers(data)
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (!query.trim()) {
      loadPlayers()
      return
    }

    setLoading(true)
    try {
      const results = await searchPlayers(query)
      setPlayers(results)
    } catch (error) {
      console.error('Erro ao buscar:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(player: Player) {
    setEditingPlayer(player)
    setShowForm(true)
  }

  function handleFormSuccess() {
    setShowForm(false)
    setEditingPlayer(null)
    loadPlayers()
  }

  function handleFormCancel() {
    setShowForm(false)
    setEditingPlayer(null)
  }

  const activePlayers = players.filter(p => p.active)
  const inactivePlayers = players.filter(p => !p.active)

  if (authLoading) return null

  return (
    <DashboardLayout title="Jogadores">
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">👥 Jogadores</h1>
            <p className="text-gray-600 mt-2">
              Total: <strong>{activePlayers.length}</strong> ativos
            </p>
          </div>
          <button
            onClick={() => {
              setEditingPlayer(null)
              setShowForm(true)
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            + Novo Jogador
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingPlayer ? 'Editar Jogador' : 'Novo Jogador'}
              </h2>
              <PlayerForm
                player={editingPlayer || undefined}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por nome ou apelido..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Nenhum jogador encontrado</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Adicionar primeiro jogador
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Jogadores Ativos */}
            {activePlayers.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  Ativos ({activePlayers.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activePlayers.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onEdit={handleEdit}
                      onStatusChange={loadPlayers}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Jogadores Inativos */}
            {inactivePlayers.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-600 mb-4">
                  Inativos ({inactivePlayers.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inactivePlayers.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      onEdit={handleEdit}
                      onStatusChange={loadPlayers}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
