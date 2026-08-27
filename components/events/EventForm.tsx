'use client'

import { useState } from 'react'
import { FootballEvent } from '@/types'
import { createEvent, updateEvent } from '@/services/eventService'

interface EventFormProps {
  event?: FootballEvent
  onSuccess: () => void
  onCancel: () => void
}

export default function EventForm({ event, onSuccess, onCancel }: EventFormProps) {
  const [eventDate, setEventDate] = useState(event?.event_date || '')
  const [startTime, setStartTime] = useState(event?.start_time || '18:00')
  const [endTime, setEndTime] = useState(event?.expected_end_time || '22:00')
  const [matchDuration, setMatchDuration] = useState(event?.match_duration_minutes || 7)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (event) {
        await updateEvent(event.id, {
          event_date: eventDate,
          start_time: startTime,
          expected_end_time: endTime,
          match_duration_minutes: matchDuration
        })
      } else {
        await createEvent({
          event_date: eventDate,
          start_time: startTime,
          expected_end_time: endTime,
          match_duration_minutes: matchDuration,
          status: 'planned'
        })
      }
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar evento')
    } finally {
      setLoading(false)
    }
  }

  // Definir data mínima como hoje
  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Data do Domingo *
        </label>
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          min={today}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Horário Inicial
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Horário de Encerramento
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Duração das Partidas (minutos)
        </label>
        <input
          type="number"
          value={matchDuration}
          onChange={(e) => setMatchDuration(parseInt(e.target.value))}
          min="1"
          max="30"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-xs text-gray-500 mt-1">Padrão: 7 minutos</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm">
        <p className="font-semibold mb-1">ℹ️ Informações</p>
        <ul className="text-xs space-y-1">
          <li>• Limite de gols: 2 (partida encerra automaticamente)</li>
          <li>• Regra: Quem vence permanece em campo</li>
          <li>• Empate no tempo: os dois times saem</li>
        </ul>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Salvando...' : event ? 'Atualizar' : 'Criar Evento'}
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
