import { supabase } from '@/lib/supabase'
import { Team, TeamMember, Player } from '@/types'
import { TEAM_COLORS } from '@/lib/constants'

export async function getEventTeams(eventId: number) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('event_id', eventId)
    .order('queue_order', { ascending: true })

  if (error) throw error
  return data as Team[]
}

export async function getTeamWithMembers(teamId: number) {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members(
        *,
        players(*)
      )
    `)
    .eq('id', teamId)
    .single()

  if (error) throw error
  return data as any
}

export async function createTeam(team: Omit<Team, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('teams')
    .insert([team])
    .select()

  if (error) throw error
  return data[0] as Team
}

export async function updateTeam(id: number, updates: Partial<Omit<Team, 'id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0] as Team
}

export async function deleteTeam(id: number) {
  const { error } = await supabase.from('teams').delete().eq('id', id)
  if (error) throw error
}

export async function addTeamMember(teamId: number, playerId: number, role: 'goalkeeper' | 'line') {
  const { data, error } = await supabase
    .from('team_members')
    .insert([{ team_id: teamId, player_id: playerId, role }])
    .select()

  if (error) throw error
  return data[0] as TeamMember
}

export async function removeTeamMember(memberId: number) {
  const { error } = await supabase.from('team_members').delete().eq('id', memberId)
  if (error) throw error
}

export async function getTeamMembers(teamId: number) {
  const { data, error } = await supabase
    .from('team_members')
    .select('*, players(*)')
    .eq('team_id', teamId)

  if (error) throw error
  return data as any[]
}

// Algoritmo de distribuição automática
export async function autoDistributeTeams(
  eventId: number,
  confirmedPlayers: Player[],
  teamsCount: number
) {
  const goalkeepers = confirmedPlayers.filter(p => p.primary_position === 'goalkeeper')
  const fieldPlayers = confirmedPlayers.filter(p => p.primary_position === 'line')

  // Criar teams
  const colorKeys = Object.keys(TEAM_COLORS)
  const teams: Team[] = []

  for (let i = 0; i < teamsCount; i++) {
    const colorKey = colorKeys[i % colorKeys.length]
    const color = TEAM_COLORS[colorKey as keyof typeof TEAM_COLORS]

    const team = await createTeam({
      event_id: eventId,
      name: color.name,
      color: color.hex,
      queue_order: i + 1
    })

    teams.push(team)
  }

  // Distribuir jogadores
  let goalkeeperIndex = 0
  let fieldPlayerIndex = 0

  for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
    const team = teams[teamIndex]

    // Adicionar goleiro (com repetição se necessário)
    const gkIndex = teamIndex % goalkeepers.length
    await addTeamMember(team.id, goalkeepers[gkIndex].id, 'goalkeeper')

    // Adicionar 4 jogadores de linha
    for (let i = 0; i < 4; i++) {
      const fpIndex = (fieldPlayerIndex + i) % fieldPlayers.length
      await addTeamMember(team.id, fieldPlayers[fpIndex].id, 'line')
    }

    fieldPlayerIndex += 4
  }

  return teams
}

export async function updateTeamQueue(eventId: number, teams: Team[]) {
  const updates = teams.map((team, index) => ({
    ...team,
    queue_order: index + 1
  }))

  for (const team of updates) {
    await updateTeam(team.id, { queue_order: team.queue_order })
  }
}

export async function shuffleTeamOrder(teams: Team[]) {
  const shuffled = [...teams].sort(() => Math.random() - 0.5)
  return shuffled.map((team, index) => ({ ...team, queue_order: index + 1 }))
}
