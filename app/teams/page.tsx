'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import TeamCard from '@/components/teams/TeamCard'
import PlayerSelector from '@/components/teams/PlayerSelector'
import { getEventTeams, deleteTeam, autoDistributeTeams, getTeamMembers, updateTeamQueue } from '@/services/teamService'
import { getAttendanceWithPlayers } from '@/services/attendanceService'
import { getEvent } from '@/services/eventService'
import { FootballEvent, Player, Team } from '@/types'

interface TeamWithMembers extends Team {
  members?: any[]
}

export default function TeamsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventIdParam = searchParams.get('event')

  const [event, setEvent] = useState<FootballEvent | null>(null)
  const [confirmedPlayers, setConfirmedPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<TeamWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [showMounting, setShowMounting] = useState(false)
  const [mountingType, setMountingType] = useState<'auto' | 'manual' | null>(null)
  const [teamsCount, setTeamsCount] = useState(0)
  const [reorderMode, setReorderMode] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && eventIdParam) {
      loadData()
    }
  }, [user, eventIdParam])

  async function loadData() {
    setLoading(true)
    try {
      const eventId = parseInt(eventIdParam || '0')

      // Obter evento
      const eventData = await getEvent(eventId)
      setEvent(eventData)

      // Obter jogadores confirmados
      const attendanceData = await getAttendanceWithPlayers(eventId)
      const confirmed = attendanceData
        .filter(a => a.confirmed)
        .map(a => a.players)
      setConfirmedPlayers(confirmed)

      // Sugestão de times
      const suggestedTeams = Math.ceil(confirmed.length / 5)
      setTeamsCount(suggestedTeams)

      // Obter times
      const teamsData = await getEventTeams(eventId)

      // Carregar membros de cada time
      const teamsWithMembers = await Promise.all(
        teamsData.map(async (team) => {
          const members = await getTeamMembers(team.id)
          return { ...team, members }
        })
      )

      setTeams(teamsWithMembers)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAutoDistribute() {
    if (teams.length > 0) {
      if (!confirm('Deseja deletar os times existentes e criar novos?')) return

      // Deletar times existentes
      for (const team of teams) {
        await deleteTeam(team.id)
      }
    }

    setLoading(true)
    try {
      await autoDistributeTeams(parseInt(eventIdParam || '0'), confirmedPlayers, teamsCount)
      setMountingType(null)
      setShowMounting(false)
      loadData()
    } catch (error) {
      console.error('Erro ao distribuir times:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleManualCreate() {
    setMountingType('manual')
    setShowMounting(false)
  }

  async function handleDeleteTeam(teamId: number) {
    if (!confirm('Deseja deletar este time?')) return

    try {
      await deleteTeam(teamId)
      loadData()
    } catch (error) {
      console.error('Erro ao deletar time:', error)
    }
  }

  async function handleSaveOrder() {
    try {
      await updateTeamQueue(parseInt(eventIdParam || '0'), teams)
      setReorderMode(false)
    } catch (error) {
      console.error('Erro ao salvar ordem:', error)
    }
  }

  const availablePlayers = confirmedPlayers.filter(
    p => !teams.some(t => t.members?.some(m => m.player_id === p.id))
  )

  if (authLoading) return null

  return (
    <DashboardLayout title="Montagem de Times">
      <div className="p-4 lg:p-8">
        {/* Event Info */}
        {event && (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-800">👕 Montagem de Times</h2>
            <p className="text-gray-600 mt-2">
              Confirmados: <strong>{confirmedPlayers.length}</strong> | Sugestão: <strong>{teamsCount} times</strong>
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando times...</p>
          </div>
        ) : !event ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Nenhum evento encontrado</p>
            <a
              href="/events"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Ir para Eventos
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Botões de Ação */}
            {teams.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Como deseja montar os times?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowMounting(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition text-center"
                  >
                    <div className="text-3xl mb-2">🎲</div>
                    <div className="text-lg">Montagem Automática</div>
                    <div className="text-sm opacity-90 mt-2">Distribuição aleatória de jogadores</div>
                  </button>
                  <button
                    onClick={handleManualCreate}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition text-center"
                  >
                    <div className="text-3xl mb-2">✋</div>
                    <div className="text-lg">Montagem Manual</div>
                    <div className="text-sm opacity-90 mt-2">Você escolhe os jogadores</div>
                  </button>
                </div>

                {/* Modal de confirmação */}
                {showMounting && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">Montagem Automática</h2>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Quantidade de Times
                        </label>
                        <input
                          type="number"
                          value={teamsCount}
                          onChange={(e) => setTeamsCount(parseInt(e.target.value) || 1)}
                          min="1"
                          max={Math.ceil(confirmedPlayers.length / 4)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                        />
                        <p className="text-xs text-gray-600 mb-6">
                          Necessita: {teamsCount * 5} jogadores | Disponíveis: {confirmedPlayers.length}
                        </p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm mb-6">
                        <p className="font-semibold mb-2">ℹ️ Como funciona:</p>
                        <ul className="text-xs space-y-1">
                          <li>• 1 goleiro + 4 de linha por time</li>
                          <li>• Goleiros podem repetir</li>
                          <li>• Distribuição automática e aleatória</li>
                        </ul>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleAutoDistribute}
                          disabled={loading}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
                        >
                          {loading ? 'Gerando...' : 'Gerar'}
                        </button>
                        <button
                          onClick={() => setShowMounting(false)}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 rounded-lg transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Controles */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setReorderMode(!reorderMode)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    {reorderMode ? '✓ Pronto' : '🔄 Reordenar'}
                  </button>
                  {reorderMode && (
                    <button
                      onClick={handleSaveOrder}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                      💾 Salvar Ordem
                    </button>
                  )}
                  <a
                    href={`/live-match?event=${eventIdParam}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition inline-block"
                  >
                    ▶️ Iniciar Jogo
                  </a>
                </div>

                {/* Grid de Times */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teams.map((team) => (
                    <div key={team.id} className="relative">
                      <TeamCard
                        team={team}
                        members={team.members || []}
                        onMemberRemove={loadData}
                      />
                      {!reorderMode && (
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded transition text-sm"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Jogadores disponíveis */}
                {availablePlayers.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      Jogadores Disponíveis ({availablePlayers.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availablePlayers.map((player) => (
                        <div key={player.id} className="border border-gray-200 rounded-lg p-4">
                          <p className="font-semibold text-gray-800">{player.name}</p>
                          {player.nickname && <p className="text-sm text-gray-600">{player.nickname}</p>}
                          <p className="text-xs text-gray-500 mt-2">
                            {player.primary_position === 'goalkeeper' ? '🧤 Goleiro' : '⚽ Linha'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
