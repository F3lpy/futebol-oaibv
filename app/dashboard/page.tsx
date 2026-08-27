'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { createEvent } from '@/services/eventService'
import { autoDistributeTeams } from '@/services/teamService'
import { getPlayers } from '@/services/playerService'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  async function handleStartGame() {
    if (creating) return
    setCreating(true)

    try {
      console.log('1. Iniciando criação do evento...')

      // 1. Criar novo evento
      const event = await createEvent({
        event_date: new Date().toISOString().split('T')[0],
        start_time: '18:00',
        expected_end_time: '22:00',
        match_duration_minutes: 7,
        status: 'active'
      })
      console.log('2. Evento criado:', event)

      // 2. Pegar todos os jogadores
      console.log('3. Buscando jogadores...')
      const players = await getPlayers()
      console.log('4. Jogadores encontrados:', players.length)

      // 3. Criar times automaticamente (4-5 times)
      const teamsCount = Math.ceil(players.length / 5)
      console.log('5. Criando', teamsCount, 'times...')
      await autoDistributeTeams(event.id, players, teamsCount)
      console.log('6. Times criados com sucesso')

      // 4. Ir direto para o jogo
      console.log('7. Redirecionando para live-match...')
      router.push(`/live-match?event=${event.id}`)
    } catch (error) {
      console.error('❌ Erro ao iniciar jogo:', error)
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setCreating(false)
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
      <div className="p-4 lg:p-8 flex flex-col items-center justify-center min-h-screen">
        {/* Welcome */}
        <div className="text-center mb-12">
          <div className="text-8xl mb-6">⚽</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Bem-vindo, {user.name}!
          </h1>
          <p className="text-gray-600 text-lg mb-2">
            Sistema de Futebol dos Irmãos
          </p>
          <p className="text-green-600 font-semibold">
            "Juntos em campo, irmãos na fé"
          </p>
        </div>

        {/* Main Button */}
        <button
          onClick={handleStartGame}
          disabled={creating}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-6 px-12 rounded-xl transition text-2xl disabled:opacity-50 mb-8 shadow-lg"
        >
          {creating ? '⏳ Iniciando Jogo...' : '🟢 INICIAR NOVO JOGO'}
        </button>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
          <div className="bg-blue-50 rounded-lg p-6 text-center border-2 border-blue-200">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-600 text-sm">Novo evento criado automaticamente</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-6 text-center border-2 border-purple-200">
            <div className="text-4xl mb-2">👕</div>
            <p className="text-gray-600 text-sm">Times montados automaticamente</p>
          </div>
          <div className="bg-green-50 rounded-lg p-6 text-center border-2 border-green-200">
            <div className="text-4xl mb-2">🎮</div>
            <p className="text-gray-600 text-sm">Vai direto para o jogo</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
