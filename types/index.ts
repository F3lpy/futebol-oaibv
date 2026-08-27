// User & Auth
export type UserRole = 'admin' | 'player'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
}

// Player
export type PlayerPosition = 'goalkeeper' | 'line'

export interface Player {
  id: number
  user_id?: string
  name: string
  nickname?: string
  phone?: string
  primary_position: PlayerPosition
  active: boolean
  created_at: string
  updated_at: string
}

// Football Event (Domingo de Futebol)
export type EventStatus = 'planned' | 'active' | 'finished'

export interface FootballEvent {
  id: number
  event_date: string
  start_time?: string
  expected_end_time?: string
  match_duration_minutes: number
  status: EventStatus
  actual_started_at?: string
  actual_ended_at?: string
  created_at: string
}

// Attendance
export interface Attendance {
  id: number
  event_id: number
  player_id: number
  confirmed: boolean
  confirmed_at?: string
}

// Team
export interface Team {
  id: number
  event_id: number
  name: string
  color: string
  queue_order: number
  created_at: string
}

// Team Member
export type TeamMemberRole = 'goalkeeper' | 'line'

export interface TeamMember {
  id: number
  team_id: number
  player_id: number
  role: TeamMemberRole
  created_at: string
}

// Match
export type MatchStatus = 'waiting' | 'live' | 'paused' | 'finished'
export type FinishReason = 'goal_limit' | 'time' | 'manual'

export interface Match {
  id: number
  event_id: number
  sequence_number: number
  team_a_id: number
  team_b_id: number
  team_a_score: number
  team_b_score: number
  winner_team_id?: number
  started_at?: string
  ended_at?: string
  configured_duration_minutes: number
  elapsed_seconds: number
  status: MatchStatus
  finish_reason?: FinishReason
  created_at: string
}

export interface MatchWithTeams extends Match {
  team_a?: Team
  team_b?: Team
}

// Match Event (Goal, pause, etc)
export type MatchEventType = 'goal' | 'goal_removed' | 'pause' | 'resume'

export interface MatchEvent {
  id: number
  match_id: number
  team_id: number
  type: MatchEventType
  created_at: string
}

// Event Team Queue
export type QueueStatus = 'playing' | 'next' | 'waiting' | 'temporarily_removed'

export interface EventTeamQueue {
  id: number
  event_id: number
  team_id: number
  queue_position: number
  status: QueueStatus
}
