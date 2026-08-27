'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import MatchTimer from '@/components/match/MatchTimer'
import { getEvent } from '@/services/eventService'
import { getEventMatches, getCurrentMatch, createMatch, startMatch, pauseMatch, resumeMatch, addGoal, removeGoal, finishMatch, updateElapsedSeconds } from '@/services/matchService'
import { getQueueSummary, initializeQueue, rotateQueue } from '@/services/queueService'
import { getEventTeams } from '@/services/teamService'
import { FootballEvent, MatchWithTeams } from '@/types'
import { GAME_CONFIG } from '@/lib/constants'

export default function LiveMatchPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventIdParam = searchParams.get('event')

  const [event, setEvent] = useState<FootballEvent | null>(null)
  const [currentMatch, setCurrentMatch] = useState<MatchWithTeams | null>(null)
  const [queue, setQueue] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showResult, setShowResult] = useState(false)

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

      // Obter partida atual ou criar nova
      let match = await getCurrentMatch(eventId)

      if (!match) {
        // Inicializar fila se necessário
        const teams = await getEventTeams(eventId)
        await initializeQueue(eventId, teams)

        // Criar primeira partida
        const queueData = await getQueueSummary(eventId)
        if (queueData.playing.length >= 2) {
          match = await createMatch(
            eventId,
            queueData.playing[0].id,
            queueData.playing[1].id,
            1,
            eventData.match_duration_minutes
          )
        }
      }

      setCurrentMatch(match)

      // Obter fila
      const queueData = await getQueueSummary(eventId)
      setQueue(queueData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleStartMatch() {
    if (!currentMatch) return

    try {
      await startMatch(currentMatch.id)
      setShowResult(false)
      loadData()
    } catch (error) {
      console.error('Erro ao iniciar partida:', error)
    }
  }

  async function handlePauseMatch() {
    if (!currentMatch) return

    try {
      await pauseMatch(currentMatch.id, currentMatch.elapsed_seconds)
      loadData()
    } catch (error) {
      console.error('Erro ao pausar:', error)
    }
  }

  async function handleResumeMatch() {
    if (!currentMatch) return

    try {
      await resumeMatch(currentMatch.id)
      loadData()
    } catch (error) {
      console.error('Erro ao retomar:', error)
    }
  }

  async function handleAddGoal(teamId: number) {
    if (!currentMatch) return

    try {
      const updated = await addGoal(currentMatch.id, teamId)
      setCurrentMatch(updated)

      // Verificar se terminou por 2 gols
      if (updated.team_a_score >= GAME_CONFIG.GOAL_LIMIT || updated.team_b_score >= GAME_CONFIG.GOAL_LIMIT) {
        await finishMatch(currentMatch.id, 'goal_limit')
        setShowResult(true)
      }
    } catch (error) {
      console.error('Erro ao adicionar gol:', error)
    }
  }

  async function handleRemoveGoal(teamId: number) {
    if (!currentMatch) return

    try {
      const updated = await removeGoal(currentMatch.id, teamId)
      setCurrentMatch(updated)
    } catch (error) {
      console.error('Erro ao remover gol:', error)
    }
  }

  async function handleTimeEnd() {
    if (!currentMatch) return

    try {
      const winnerId = currentMatch.team_a_score > currentMatch.team_b_score
        ? currentMatch.team_a_id
        : currentMatch.team_b_score > currentMatch.team_a_score
          ? currentMatch.team_b_id
          : undefined

      await finishMatch(currentMatch.id, 'time')
      setShowResult(true)
      loadData()
    } catch (error) {
      console.error('Erro ao encerrar por tempo:', error)
    }
  }

  async function handleNextMatch() {
    if (!currentMatch) return

    try {
      const winnerId = currentMatch.team_a_score > currentMatch.team_b_score
        ? currentMatch.team_a_id
        : currentMatch.team_b_score > currentMatch.team_a_score
          ? currentMatch.team_b_id
          : undefined

      await rotateQueue(parseInt(eventIdParam || '0'), winnerId)

      setShowResult(false)
      loadData()
    } catch (error) {
      console.error('Erro ao iniciar próxima partida:', error)
    }
  }

  async function handleUpdateTime(seconds: number) {
    if (currentMatch) {
      await updateElapsedSeconds(currentMatch.id, seconds)
    }
  }

  if (authLoading) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⚽</div>
          <p className="text-white text-lg">Carregando partida...</p>
        </div>
      </div>
    )
  }

  if (!event || !currentMatch || !queue) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Erro ao carregar partida</p>
          <a href="/events" className="text-blue-400 hover:text-blue-300">Voltar aos eventos</a>
        </div>
      </div>
    )
  }

  const isLive = currentMatch.status === 'live'
  const isPaused = currentMatch.status === 'paused'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-y-auto pb-20 lg:pb-8">
      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-2">⚽ FUTEBOL DOS IRMÃOS</p>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">PARTIDA AO VIVO</h1>
          <p className="text-gray-400">Sequência: {currentMatch.sequence_number}</p>
        </div>

        {/* Placar Principal */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-6 lg:p-8 border border-gray-700">
          <div className="grid grid-cols-3 gap-4 items-center mb-6">
            {/* Time A */}
            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto rounded-lg mb-3 flex items-center justify-center"
                style={{ backgroundColor: currentMatch.team_a.color + '40', borderColor: currentMatch.team_a.color, borderWidth: '2px' }}
              >
                <span className="text-2xl font-bold" style={{ color: currentMatch.team_a.color }}>
                  {currentMatch.team_a.name[0]}
                </span>
              </div>
              <p className="font-bold text-sm lg:text-base mb-2">{currentMatch.team_a.name}</p>
            </div>

            {/* Placar */}
            <div className="text-center">
              <div className="text-6xl lg:text-8xl font-black mb-2">
                <span>{currentMatch.team_a_score}</span>
                <span className="mx-2 text-4xl lg:text-6xl text-gray-500">×</span>
                <span>{currentMatch.team_b_score}</span>
              </div>
              <p className="text-yellow-400 font-bold">VS</p>
            </div>

            {/* Time B */}
            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto rounded-lg mb-3 flex items-center justify-center"
                style={{ backgroundColor: currentMatch.team_b.color + '40', borderColor: currentMatch.team_b.color, borderWidth: '2px' }}
              >
                <span className="text-2xl font-bold" style={{ color: currentMatch.team_b.color }}>
                  {currentMatch.team_b.name[0]}
                </span>
              </div>
              <p className="font-bold text-sm lg:text-base mb-2">{currentMatch.team_b.name}</p>
            </div>
          </div>

          {/* Cronômetro */}
          <div className="bg-black rounded-lg p-6 mb-6">
            <MatchTimer
              duration={currentMatch.configured_duration_minutes}
              status={currentMatch.status}
              elapsedSeconds={currentMatch.elapsed_seconds}
              onTimeUpdate={handleUpdateTime}
              onTimeEnd={handleTimeEnd}
            />
          </div>

          {/* Botões de Gol */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => handleAddGoal(currentMatch.team_a_id)}
              disabled={!isLive || showResult}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-lg text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⚽ +GOL {currentMatch.team_a.name.toUpperCase()}
            </button>
            <button
              onClick={() => handleAddGoal(currentMatch.team_b_id)}
              disabled={!isLive || showResult}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 rounded-lg text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⚽ +GOL {currentMatch.team_b.name.toUpperCase()}
            </button>
          </div>

          {/* Botões de Controle */}
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-3">
            {currentMatch.status === 'waiting' && (
              <button
                onClick={handleStartMatch}
                className="col-span-3 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
              >
                ▶️ INICIAR PARTIDA
              </button>
            )}

            {isLive && (
              <button
                onClick={handlePauseMatch}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-lg transition"
              >
                ⏸️ PAUSAR
              </button>
            )}

            {isPaused && (
              <button
                onClick={handleResumeMatch}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
              >
                ▶️ RETOMAR
              </button>
            )}

            {(isLive || isPaused) && (
              <button
                onClick={handleTimeEnd}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition"
              >
                🛑 ENCERRAR
              </button>
            )}
          </div>
        </div>

        {/* Fila */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Em Campo */}
          <div className="bg-gray-800 rounded-xl p-6 border border-green-600">
            <h2 className="text-lg font-bold text-green-400 mb-4">🟢 EM CAMPO</h2>
            <div className="space-y-2">
              {queue.playing.map((team: any) => (
                <div
                  key={team.id}
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: team.color + '40', borderLeft: `4px solid ${team.color}` }}
                >
                  <p className="font-bold">{team.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Próximo */}
          <div className="bg-gray-800 rounded-xl p-6 border border-blue-600">
            <h2 className="text-lg font-bold text-blue-400 mb-4">📋 PRÓXIMO</h2>
            {queue.next ? (
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: queue.next.color + '40', borderLeft: `4px solid ${queue.next.color}` }}
              >
                <p className="font-bold">{queue.next.name}</p>
              </div>
            ) : (
              <p className="text-gray-400">Nenhum time na fila</p>
            )}
          </div>
        </div>

        {/* Fila de Espera */}
        {queue.waiting.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold text-gray-300 mb-4">📊 FILA DE ESPERA ({queue.waiting.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {queue.waiting.map((team: any) => (
                <div
                  key={team.id}
                  className="p-3 rounded-lg text-sm"
                  style={{ backgroundColor: team.color + '40', borderLeft: `4px solid ${team.color}` }}
                >
                  <p className="font-bold">{team.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regras */}
        <div className="bg-blue-900 bg-opacity-40 rounded-xl p-4 border border-blue-700">
          <p className="text-blue-300 text-sm">
            <strong>✓ Quem vence permanece em campo</strong><br/>
            <strong>✓ Empate no tempo: os dois saem</strong><br/>
            <strong>✓ Limite: 2 gols encerrão automaticamente</strong>
          </p>
        </div>

        {/* Modal de Resultado */}
        {showResult && currentMatch && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full text-center">
              <h2 className="text-3xl font-bold mb-6">RESULTADO</h2>

              <div className="mb-6">
                <div className="text-5xl font-black mb-4">
                  <span>{currentMatch.team_a_score}</span>
                  <span className="mx-2">×</span>
                  <span>{currentMatch.team_b_score}</span>
                </div>

                {currentMatch.team_a_score > currentMatch.team_b_score && (
                  <p className="text-2xl font-bold text-green-400">
                    {currentMatch.team_a.name} VENCEU!
                  </p>
                )}
                {currentMatch.team_b_score > currentMatch.team_a_score && (
                  <p className="text-2xl font-bold text-green-400">
                    {currentMatch.team_b.name} VENCEU!
                  </p>
                )}
                {currentMatch.team_a_score === currentMatch.team_b_score && (
                  <p className="text-2xl font-bold text-yellow-400">
                    EMPATE!
                  </p>
                )}
              </div>

              <button
                onClick={handleNextMatch}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
              >
                ▶️ PRÓXIMA PARTIDA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
