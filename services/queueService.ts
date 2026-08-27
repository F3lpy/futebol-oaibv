import { supabase } from '@/lib/supabase'
import { EventTeamQueue, Team } from '@/types'

export async function getEventQueue(eventId: number) {
  const { data, error } = await supabase
    .from('event_team_queue')
    .select('*')
    .eq('event_id', eventId)
    .order('queue_position', { ascending: true })

  if (error) throw error
  return data as any[]
}

export async function initializeQueue(eventId: number, teams: Team[]) {
  try {
    // Verificar se já há fila para este evento
    const { data: existingQueue } = await supabase
      .from('event_team_queue')
      .select('id')
      .eq('event_id', eventId)
      .limit(1)

    // Se já existe, não fazer nada
    if (existingQueue && existingQueue.length > 0) {
      return
    }

    const queueRecords = teams.map((team, index) => ({
      event_id: eventId,
      team_id: team.id,
      queue_position: index + 1,
      status: index === 0 ? 'playing' : index === 1 ? 'next' : 'waiting'
    }))

    const { error } = await supabase
      .from('event_team_queue')
      .insert(queueRecords)

    if (error) throw error
  } catch (error) {
    console.error('Erro ao inicializar fila:', error)
  }
}

export async function rotateQueue(eventId: number, winnerTeamId?: number) {
  // Obter fila atual
  const queue = await getEventQueue(eventId)

  if (queue.length === 0) throw new Error('Nenhum time na fila')

  const playing = queue.filter(q => q.status === 'playing')
  const next = queue.filter(q => q.status === 'next')
  const waiting = queue.filter(q => q.status === 'waiting')

  if (playing.length !== 2) throw new Error('Deve haver exatamente 2 times em campo')

  let updates: any[] = []

  if (winnerTeamId) {
    // Vencedor permanece, perdedor vai pro final da fila
    const loser = playing.find(q => q.team_id !== winnerTeamId)
    const winner = playing.find(q => q.team_id === winnerTeamId)

    if (!loser || !winner) throw new Error('Time vencedor não encontrado')

    // Vencedor continua em campo
    updates.push({
      id: winner.id,
      status: 'playing',
      queue_position: 1
    })

    // Próximo entra
    if (next.length > 0) {
      updates.push({
        id: next[0].id,
        status: 'playing',
        queue_position: 2
      })

      // Perdedor vai para o final
      updates.push({
        id: loser.id,
        status: 'waiting',
        queue_position: queue.length
      })

      // Reordenar os restantes
      const remaining = waiting.slice(1)
      remaining.forEach((item, index) => {
        updates.push({
          id: item.id,
          status: 'waiting',
          queue_position: 3 + index
        })
      })

      // Se houver segundo próximo, muda para próximo
      if (waiting.length > 0) {
        updates.push({
          id: waiting[0].id,
          status: 'next',
          queue_position: 2
        })
      }
    }
  } else {
    // Empate: os dois saem, os próximos dois entram
    if (next.length < 2 && waiting.length === 0) {
      throw new Error('Não há times suficientes para substituir')
    }

    const newPlayingTeams = [
      next[0],
      next.length > 1 ? next[1] : waiting[0]
    ]

    updates.push({
      id: newPlayingTeams[0].id,
      status: 'playing',
      queue_position: 1
    })

    if (newPlayingTeams[1]) {
      updates.push({
        id: newPlayingTeams[1].id,
        status: 'playing',
        queue_position: 2
      })
    }

    // Os que saem vão para o final
    playing.forEach((item, index) => {
      updates.push({
        id: item.id,
        status: 'waiting',
        queue_position: queue.length - playing.length + index + 1
      })
    })

    // Reorganizar o resto
    const startIdx = next.length > 1 ? 2 : 1
    const remaining = [...next.slice(startIdx), ...waiting.slice(startIdx)]

    remaining.forEach((item, index) => {
      updates.push({
        id: item.id,
        status: 'waiting',
        queue_position: 3 + index
      })
    })

    // Definir novo "próximo"
    if (next.length > 1) {
      const newNext = waiting[0]
      if (newNext) {
        updates.push({
          id: newNext.id,
          status: 'next',
          queue_position: 3
        })
      }
    } else if (waiting.length > 0) {
      updates.push({
        id: waiting[0].id,
        status: 'next',
        queue_position: 3
      })
    }
  }

  // Aplicar updates
  for (const update of updates) {
    await supabase
      .from('event_team_queue')
      .update({
        status: update.status,
        queue_position: update.queue_position
      })
      .eq('id', update.id)
  }

  return await getEventQueue(eventId)
}

export async function getQueueSummary(eventId: number) {
  const queue = await getEventQueue(eventId)

  // Buscar todos os times do evento
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('*')
    .eq('event_id', eventId)

  if (teamsError) throw teamsError

  const teamsMap = new Map(teams.map(t => [t.id, t]))

  return {
    playing: queue
      .filter(q => q.status === 'playing')
      .map(q => teamsMap.get(q.team_id))
      .filter(Boolean),
    next: queue
      .filter(q => q.status === 'next')
      .map(q => teamsMap.get(q.team_id))[0] || null,
    waiting: queue
      .filter(q => q.status === 'waiting')
      .map(q => teamsMap.get(q.team_id))
      .filter(Boolean)
  }
}
