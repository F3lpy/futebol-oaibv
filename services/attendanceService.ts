import { supabase } from '@/lib/supabase'
import { Attendance } from '@/types'

export async function getEventAttendance(eventId: number) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('event_id', eventId)

  if (error) throw error
  return data as Attendance[]
}

export async function getAttendanceWithPlayers(eventId: number) {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      players(*)
    `)
    .eq('event_id', eventId)
    .order('confirmed', { ascending: false })

  if (error) throw error
  return data as any[]
}

export async function confirmAttendance(eventId: number, playerId: number) {
  const { data, error } = await supabase
    .from('attendance')
    .update({
      confirmed: true,
      confirmed_at: new Date().toISOString()
    })
    .eq('event_id', eventId)
    .eq('player_id', playerId)
    .select()

  if (error) throw error
  return data[0] as Attendance
}

export async function removeAttendance(eventId: number, playerId: number) {
  const { data, error } = await supabase
    .from('attendance')
    .update({
      confirmed: false,
      confirmed_at: null
    })
    .eq('event_id', eventId)
    .eq('player_id', playerId)
    .select()

  if (error) throw error
  return data[0] as Attendance
}

export async function getConfirmedCount(eventId: number) {
  const { count, error } = await supabase
    .from('attendance')
    .select('*', { count: 'exact' })
    .eq('event_id', eventId)
    .eq('confirmed', true)

  if (error) throw error
  return count || 0
}

export async function initializeEventAttendance(eventId: number, playerIds: number[]) {
  const attendanceRecords = playerIds.map(playerId => ({
    event_id: eventId,
    player_id: playerId,
    confirmed: false,
    confirmed_at: null
  }))

  const { error } = await supabase
    .from('attendance')
    .insert(attendanceRecords)

  if (error && !error.message.includes('duplicate')) throw error
}
