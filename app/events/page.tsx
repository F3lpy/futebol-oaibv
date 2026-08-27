'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import EventCard from '@/components/events/EventCard'
import EventForm from '@/components/events/EventForm'
import { getEvents, getEventWithStats } from '@/services/eventService'
import { FootballEvent } from '@/types'

interface EventWithStats extends FootballEvent {
  stats?: {
    confirmedCount: number
    teamsCount: number
    matchesCount: number
  }
}

function EventsPageContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<FootballEvent | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadEvents()
    }
  }, [user])

  async function loadEvents() {
    setLoading(true)
    try {
      const data = await getEvents()

      // Carregar stats para cada evento
      const eventsWithStats = await Promise.all(
        data.map(async (event) => {
          const { confirmedCount, teamsCount, matchesCount } = await getEventWithStats(event.id)
          return {
            ...event,
            stats: { confirmedCount, teamsCount, matchesCount }
          }
        })
      )

      setEvents(eventsWithStats)
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(event: FootballEvent) {
    setEditingEvent(event)
    setShowForm(true)
  }

  function handleFormSuccess() {
    setShowForm(false)
    setEditingEvent(null)
    loadEvents()
  }

  function handleFormCancel() {
    setShowForm(false)
    setEditingEvent(null)
  }

  // Separar eventos por status
  const plannedEvents = events.filter(e => e.status === 'planned')
  const activeEvents = events.filter(e => e.status === 'active')
  const finishedEvents = events.filter(e => e.status === 'finished')

  if (authLoading) return null

  return (
    <DashboardLayout title="Eventos de Domingo">
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📅 Futebol de Domingo</h1>
            <p className="text-gray-600 mt-2">
              Total: <strong>{events.length}</strong> eventos
            </p>
          </div>
          <button
            onClick={() => {
              setEditingEvent(null)
              setShowForm(true)
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            + Novo Evento
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingEvent ? 'Editar Evento' : 'Novo Evento'}
              </h2>
              <EventForm
                event={editingEvent || undefined}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando eventos...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Nenhum evento encontrado</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Criar primeiro evento
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Evento Ativo */}
            {activeEvents.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-green-600 mb-4 flex items-center gap-2">
                  🟢 Em Andamento ({activeEvents.length})
                </h2>
                <div className="grid gap-6">
                  {activeEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      stats={event.stats}
                      onUpdate={loadEvents}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Eventos Planejados */}
            {plannedEvents.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-blue-600 mb-4 flex items-center gap-2">
                  📅 Planejados ({plannedEvents.length})
                </h2>
                <div className="grid gap-6">
                  {plannedEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      stats={event.stats}
                      onUpdate={loadEvents}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Eventos Encerrados */}
            {finishedEvents.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-600 mb-4 flex items-center gap-2">
                  ✅ Encerrados ({finishedEvents.length})
                </h2>
                <div className="grid gap-6">
                  {finishedEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      stats={event.stats}
                      onUpdate={loadEvents}
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

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-600">Carregando...</p></div>}>
      <EventsPageContent />
    </Suspense>
  )
}
