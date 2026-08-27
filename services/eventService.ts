import { supabase } from '@/lib/supabase'
import { FootballEvent, EventStatus } from '@/types'

export async function getEvents(status?: EventStatus) {
  let query = supabase.from('football_events').select('*').order('event_date', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error
  return data as FootballEvent[]
}

export async function getEvent(id: number) {
  const { data, error } = await supabase
    .from('football_events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as FootballEvent
}

export async function createEvent(event: Omit<FootballEvent, 'id' | 'created_at' | 'actual_started_at' | 'actual_ended_at'>) {
  const { data, error } = await supabase
    .from('football_events')
    .insert([event])
    .select()

  if (error) throw error
  return data[0] as FootballEvent
}

export async function updateEvent(id: number, updates: Partial<Omit<FootballEvent, 'id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('football_events')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0] as FootballEvent
}

export async function deleteEvent(id: number) {
  const { error } = await supabase.from('football_events').delete().eq('id', id)
  if (error) throw error
}

export async function startEvent(id: number) {
  return updateEvent(id, {
    status: 'active',
    actual_started_at: new Date().toISOString()
  })
}

export async function finishEvent(id: number) {
  return updateEvent(id, {
    status: 'finished',
    actual_ended_at: new Date().toISOString()
  })
}

export async function getEventWithStats(eventId: number) {
  const event = await getEvent(eventId)

  // Contar confirmados
  const { count: confirmedCount } = await supabase
    .from('attendance')
    .select('*', { count: 'exact' })
    .eq('event_id', eventId)
    .eq('confirmed', true)

  // Contar times
  const { count: teamsCount } = await supabase
    .from('teams')
    .select('*', { count: 'exact' })
    .eq('event_id', eventId)

  // Contar partidas
  const { count: matchesCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact' })
    .eq('event_id', eventId)

  return {
    event,
    confirmedCount: confirmedCount || 0,
    teamsCount: teamsCount || 0,
    matchesCount: matchesCount || 0
  }
}
