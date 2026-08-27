'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import AttendanceToggle from '@/components/attendance/AttendanceToggle'
import { getAttendanceWithPlayers, getConfirmedCount, initializeEventAttendance } from '@/services/attendanceService'
import { getPlayers } from '@/services/playerService'
import { getEvent } from '@/services/eventService'
import { Player, FootballEvent, Attendance } from '@/types'

interface AttendanceRecord {
  id: number
  event_id: number
  player_id: number
  confirmed: boolean
  confirmed_at: string | null
  players: Player
}

export default function AttendancePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventIdParam = searchParams.get('event')

  const [event, setEvent] = useState<FootballEvent | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmedCount, setConfirmedCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, eventIdParam])

  async function loadData() {
    setLoading(true)
    try {
      // Obter evento
      let selectedEventId = parseInt(eventIdParam || '0')

      if (!selectedEventId) {
        // Se não houver evento na query, buscar o evento de hoje ou próximo evento
        const events = await Promise.resolve().then(async () => {
          const { data } = await (await import('@/lib/supabase')).supabase
            .from('football_events')
            .select('*')
            .eq('status', 'planned')
            .order('event_date', { ascending: true })
            .limit(1)
          return data
        })

        if (events && events.length > 0) {
          selectedEventId = events[0].id
        } else {
          setLoading(false)
          return
        }
      }

      const eventData = await getEvent(selectedEventId)
      setEvent(eventData)

      // Obter jogadores
      const playersData = await getPlayers()
      setPlayers(playersData)

      // Inicializar presença se necessário
      const playerIds = playersData.map(p => p.id)
      await initializeEventAttendance(selectedEventId, playerIds)

      // Obter presença
      const attendanceData = await getAttendanceWithPlayers(selectedEventId)
      setAttendance(attendanceData)

      // Contar confirmados
      const count = await getConfirmedCount(selectedEventId)
      setConfirmedCount(count)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle() {
    loadData()
  }

  if (authLoading) return null

  // Filtrar jogadores por busca
  const filtered = attendance.filter(a =>
    a.players.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.players.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

  const confirmedPlayers = filtered.filter(a => a.confirmed)
  const unconfirmedPlayers = filtered.filter(a => !a.confirmed)

  const eventDate = event ? new Date(event.event_date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : ''

  return (
    <DashboardLayout title="Presença">
      <div className="p-4 lg:p-8">
        {/* Event Info */}
        {event && (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-800">⚽ Futebol de Domingo</h2>
            <p className="text-gray-600 mt-2">📅 {eventDate}</p>
            <p className="text-gray-600">🕐 Até às {event.expected_end_time || '22:00'}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando presença...</p>
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
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-100 rounded-lg p-4 text-center">
                <p className="text-gray-600 text-sm font-semibold">CONFIRMADOS</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{confirmedCount}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-4 text-center">
                <p className="text-gray-600 text-sm font-semibold">TOTAL DE JOGADORES</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{players.length}</p>
              </div>
            </div>

            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar jogador..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            {/* Confirmados */}
            {confirmedPlayers.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-green-600 mb-4">
                  ✓ Confirmados ({confirmedPlayers.length})
                </h3>
                <div className="space-y-3">
                  {confirmedPlayers.map((record) => (
                    <AttendanceToggle
                      key={record.id}
                      player={record.players}
                      eventId={event.id}
                      confirmed={record.confirmed}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Não Confirmados */}
            {unconfirmedPlayers.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-600 mb-4">
                  ○ Não Confirmados ({unconfirmedPlayers.length})
                </h3>
                <div className="space-y-3">
                  {unconfirmedPlayers.map((record) => (
                    <AttendanceToggle
                      key={record.id}
                      player={record.players}
                      eventId={event.id}
                      confirmed={record.confirmed}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Mensagem de sucesso */}
            {confirmedCount >= 6 && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 text-center">
                <p className="text-green-700 font-bold">✓ Mínimo de 6 jogadores confirmados!</p>
                <p className="text-green-600 text-sm mt-1">Você pode começar a montar os times</p>
                <a
                  href={`/teams?event=${event.id}`}
                  className="inline-block mt-3 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
                >
                  Montar Times
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
