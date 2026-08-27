import { supabase } from '@/lib/supabase'
import { Match, MatchEvent, FinishReason } from '@/types'
import { GAME_CONFIG } from '@/lib/constants'

export async function getEventMatches(eventId: number) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('event_id', eventId)
    .order('sequence_number', { ascending: true })

  if (error) throw error
  return data as any[]
}

export async function getCurrentMatch(eventId: number) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'live')
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as any
}

export async function createMatch(
  eventId: number,
  teamAId: number,
  teamBId: number,
  sequenceNumber: number,
  durationMinutes: number = GAME_CONFIG.DEFAULT_MATCH_DURATION
) {
  const { data, error } = await supabase
    .from('matches')
    .insert([{
      event_id: eventId,
      team_a_id: teamAId,
      team_b_id: teamBId,
      sequence_number: sequenceNumber,
      status: 'waiting',
      configured_duration_minutes: durationMinutes,
      elapsed_seconds: 0,
      team_a_score: 0,
      team_b_score: 0
    }])
    .select()

  if (error) throw error
  return data[0] as Match
}

export async function startMatch(matchId: number) {
  const { data, error } = await supabase
    .from('matches')
    .update({
      status: 'live',
      started_at: new Date().toISOString(),
      elapsed_seconds: 0
    })
    .eq('id', matchId)
    .select()

  if (error) throw error
  return data[0] as Match
}

export async function pauseMatch(matchId: number, elapsedSeconds: number) {
  const { data, error } = await supabase
    .from('matches')
    .update({
      status: 'paused',
      elapsed_seconds: elapsedSeconds
    })
    .eq('id', matchId)
    .select()

  if (error) throw error
  return data[0] as Match
}

export async function resumeMatch(matchId: number) {
  const { data, error } = await supabase
    .from('matches')
    .update({
      status: 'live'
    })
    .eq('id', matchId)
    .select()

  if (error) throw error
  return data[0] as Match
}

export async function addGoal(matchId: number, teamId: number) {
  // Obter match atual
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single()

  if (matchError) throw matchError

  // Determinar qual time marcou
  const isTeamA = match.team_a_id === teamId
  const newScore = isTeamA ? match.team_a_score + 1 : match.team_b_score + 1

  // Atualizar placar
  const updateData = isTeamA
    ? { team_a_score: newScore }
    : { team_b_score: newScore }

  const { data, error } = await supabase
    .from('matches')
    .update(updateData)
    .eq('id', matchId)
    .select()

  if (error) throw error

  // Registrar evento de gol
  await supabase
    .from('match_events')
    .insert({
      match_id: matchId,
      team_id: teamId,
      type: 'goal'
    })

  return data[0] as Match
}

export async function removeGoal(matchId: number, teamId: number) {
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single()

  if (matchError) throw matchError

  const isTeamA = match.team_a_id === teamId
  const currentScore = isTeamA ? match.team_a_score : match.team_b_score

  if (currentScore <= 0) throw new Error('Não há gols para remover')

  const newScore = currentScore - 1

  const updateData = isTeamA
    ? { team_a_score: newScore }
    : { team_b_score: newScore }

  const { data, error } = await supabase
    .from('matches')
    .update(updateData)
    .eq('id', matchId)
    .select()

  if (error) throw error

  // Registrar evento de remoção de gol
  await supabase
    .from('match_events')
    .insert({
      match_id: matchId,
      team_id: teamId,
      type: 'goal_removed'
    })

  return data[0] as Match
}

export async function finishMatch(
  matchId: number,
  reason: FinishReason
) {
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single()

  if (matchError) throw matchError

  // Determinar vencedor
  let winnerId = null
  if (match.team_a_score > match.team_b_score) {
    winnerId = match.team_a_id
  } else if (match.team_b_score > match.team_a_score) {
    winnerId = match.team_b_id
  }
  // Se empate, winnerId fica null

  const { data, error } = await supabase
    .from('matches')
    .update({
      status: 'finished',
      finish_reason: reason,
      ended_at: new Date().toISOString(),
      winner_team_id: winnerId
    })
    .eq('id', matchId)
    .select()

  if (error) throw error

  return data[0] as Match
}

export async function updateElapsedSeconds(matchId: number, seconds: number) {
  const { error } = await supabase
    .from('matches')
    .update({ elapsed_seconds: seconds })
    .eq('id', matchId)

  if (error) throw error
}
