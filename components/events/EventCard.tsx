'use client'

import { FootballEvent } from '@/types'
import Link from 'next/link'
import { startEvent, finishEvent, deleteEvent } from '@/services/eventService'
import { useState } from 'react'

interface EventCardProps {
  event: FootballEvent
  stats?: {
    confirmedCount: number
    teamsCount: number
    matchesCount: number
  }
  onUpdate: () => void
}

export default function EventCard({ event, stats, onUpdate }: EventCardProps) {
  const [loading, setLoading] = useState(false)

  const eventDate = new Date(event.event_date)
  const formattedDate = eventDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const statusConfig = {
    planned: { label: 'Planejado', bg: 'bg-blue-100', text: 'text-blue-700', icon: '📅' },
    active: { label: 'Em Andamento', bg: 'bg-green-100', text: 'text-green-700', icon: '🟢' },
    finished: { label: 'Encerrado', bg: 'bg-gray-100', text: 'text-gray-700', icon: '✅' }
  }

  const config = statusConfig[event.status as keyof typeof statusConfig]

  async function handleStartEvent() {
    setLoading(true)
    try {
      await startEvent(event.id)
      onUpdate()
    } catch (error) {
      console.error('Erro ao iniciar evento:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleFinishEvent() {
    if (confirm('Tem certeza que deseja encerrar o futebol de domingo?')) {
      setLoading(true)
      try {
        await finishEvent(event.id)
        onUpdate()
      } catch (error) {
        console.error('Erro ao encerrar evento:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  async function handleDelete() {
    if (confirm('Deseja deletar este evento? Esta ação não pode ser desfeita.')) {
      setLoading(true)
      try {
        await deleteEvent(event.id)
        onUpdate()
      } catch (error) {
        console.error('Erro ao deletar evento:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">⚽ Futebol de Domingo</p>
            <h3 className="text-2xl font-bold text-gray-800">{formattedDate}</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
            {config.icon} {config.label}
          </span>
        </div>

        {/* Horários */}
        <div className="grid grid-cols-3 gap-3 mb-6 py-4 border-t border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500 font-semibold">INÍCIO</p>
            <p className="text-lg font-bold text-gray-800">{event.start_time || '--:--'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">ENCERRAMENTO</p>
            <p className="text-lg font-bold text-gray-800">{event.expected_end_time || '--:--'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">DURAÇÃO</p>
            <p className="text-lg font-bold text-gray-800">{event.match_duration_minutes}min</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600">Confirmados</p>
              <p className="text-2xl font-bold text-blue-600">{stats.confirmedCount}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600">Times</p>
              <p className="text-2xl font-bold text-green-600">{stats.teamsCount}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600">Partidas</p>
              <p className="text-2xl font-bold text-purple-600">{stats.matchesCount}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {event.status === 'planned' && (
            <>
              <button
                onClick={handleStartEvent}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                🟢 Iniciar
              </button>
              <Link
                href={`/attendance?event=${event.id}`}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition text-center"
              >
                ✅ Presença
              </Link>
            </>
          )}

          {event.status === 'active' && (
            <>
              <Link
                href={`/live-match?event=${event.id}`}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition text-center"
              >
                🔴 Jogo Ao Vivo
              </Link>
              <button
                onClick={handleFinishEvent}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                🛑 Encerrar
              </button>
            </>
          )}

          {event.status === 'finished' && (
            <div className="flex-1 bg-gray-100 text-gray-600 font-bold py-2 px-4 rounded-lg text-center">
              ✅ Evento Encerrado
            </div>
          )}

          {event.status === 'planned' && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
