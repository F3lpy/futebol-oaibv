import { supabase } from '@/lib/supabase'
import { Player } from '@/types'

export async function getPlayers(active?: boolean) {
  let query = supabase.from('players').select('*').order('name', { ascending: true })

  if (active !== undefined) {
    query = query.eq('active', active)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Player[]
}

export async function getPlayer(id: number) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Player
}

export async function createPlayer(player: Omit<Player, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('players')
    .insert([player])
    .select()

  if (error) throw error
  return data[0] as Player
}

export async function updatePlayer(id: number, updates: Partial<Omit<Player, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0] as Player
}

export async function deletePlayer(id: number) {
  const { error } = await supabase.from('players').delete().eq('id', id)
  if (error) throw error
}

export async function searchPlayers(query: string) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .or(`name.ilike.%${query}%,nickname.ilike.%${query}%`)
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return data as Player[]
}
