'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { FootballEvent, Player, Attendance, Team } from '@/types'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    confirmados: 0,
    times: 0,
    partidas: 0,
    evento: null as FootballEvent | null
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user])

  async function loadStats() {
    try {
      // Buscar próximo evento (ou mais recente)
      const { data: eventos } = await supabase
        .from('football_events')
        .select('*')
        .order('event_date', { ascending: false })
        .limit(1)
        .single()

      if (eventos) {
        // Contar confirmados
        const { count: confirmados } = await supabase
          .from('attendance')
          .select('*', { count: 'exact' })
          .eq('event_id', eventos.id)
          .eq('confirmed', true)

        // Contar times
        const { count: times } = await supabase
          .from('teams')
          .select('*', { count: 'exact' })
          .eq('event_id', eventos.id)

        // Contar partidas
        const { count: partidas } = await supabase
          .from('matches')
          .select('*', { count: 'exact' })
          .eq('event_id', eventos.id)
          .eq('status', 'finished')

        setStats({
          confirmados: confirmados || 0,
          times: times || 0,
          partidas: partidas || 0,
          evento: eventos
        })
      }
    } catch (error) {
      console.error('Erro ao carregar stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-5xl mb-4">⚽</div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="p-4 lg:p-8">
        {/* Evento Info */}
        {stats.evento && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Futebol de Domingo
            </h2>
            <p className="text-gray-600">
              {new Date(stats.evento.event_date).toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Até às {stats.evento.expected_end_time || '22:00'}
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Jogadores Confirmados', value: stats.confirmados, icon: '👥' },
            { label: 'Times Montados', value: stats.times, icon: '👕' },
            { label: 'Partidas Jogadas', value: stats.partidas, icon: '⚽' },
            { label: 'Horário de Encerramento', value: stats.evento?.expected_end_time || '22:00', icon: '🕐' }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                </div>
                <div className="text-4xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            Bem-vindo, {user.name}! 👋
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Sistema de gestão de futebol dos irmãos da Igreja.
          </p>
          <p className="text-lg font-semibold text-green-600">
            "Juntos em campo, irmãos na fé"
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
