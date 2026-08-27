import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 23 Jogadores Demo
const playersData = [
  { name: 'André Silva', nickname: 'Índio', phone: '11987654321', position: 'goalkeeper' },
  { name: 'Bruno Costa', nickname: 'Bruninho', phone: '11987654322', position: 'line' },
  { name: 'Carlos Eduardo', nickname: 'Cadu', phone: '11987654323', position: 'line' },
  { name: 'Diego Lima', nickname: 'Dieguinho', phone: '11987654324', position: 'line' },
  { name: 'Felipe Santos', nickname: 'Fezinho', phone: '11987654325', position: 'line' },
  { name: 'Gabriel Martins', nickname: 'Gabi', phone: '11987654326', position: 'line' },
  { name: 'Henrique Alves', nickname: 'Rick', phone: '11987654327', position: 'goalkeeper' },
  { name: 'Igor Nascimento', nickname: 'Igor', phone: '11987654328', position: 'line' },
  { name: 'Jhonatan Rios', nickname: 'Jhona', phone: '11987654329', position: 'line' },
  { name: 'Kevin Santos', nickname: 'Kev', phone: '11987654330', position: 'line' },
  { name: 'Lucas Pereira', nickname: 'Luca', phone: '11987654331', position: 'line' },
  { name: 'Marcelo Silva', nickname: 'Marcão', phone: '11987654332', position: 'line' },
  { name: 'Nélson Costa', nickname: 'Nelinho', phone: '11987654333', position: 'goalkeeper' },
  { name: 'Otávio Alves', nickname: 'Otá', phone: '11987654334', position: 'line' },
  { name: 'Paulo Gomes', nickname: 'Paulão', phone: '11987654335', position: 'line' },
  { name: 'Quentin Martins', nickname: 'Quentin', phone: '11987654336', position: 'line' },
  { name: 'Rafael Santos', nickname: 'Rafa', phone: '11987654337', position: 'line' },
  { name: 'Sergio Rocha', nickname: 'Serge', phone: '11987654338', position: 'goalkeeper' },
  { name: 'Tiago Silva', nickname: 'Tia', phone: '11987654339', position: 'line' },
  { name: 'Ulisses Costa', nickname: 'Uli', phone: '11987654340', position: 'line' },
  { name: 'Vitor Mendes', nickname: 'Vitor', phone: '11987654341', position: 'line' },
  { name: 'Wagner Oliveira', nickname: 'Wags', phone: '11987654342', position: 'line' },
  { name: 'Xavier Rios', nickname: 'Xavier', phone: '11987654343', position: 'line' }
]

// Times Demo
const teamsData = [
  { name: 'Time Azul', color: '#3B82F6', queue_order: 1 },
  { name: 'Time Verde', color: '#10B981', queue_order: 2 },
  { name: 'Time Branco', color: '#F3F4F6', queue_order: 3 },
  { name: 'Time Vermelho', color: '#EF4444', queue_order: 4 },
  { name: 'Time Amarelo', color: '#FBBF24', queue_order: 5 },
  { name: 'Time Preto', color: '#1F2937', queue_order: 6 }
]

async function seed() {
  console.log('🌱 Iniciando seed...')

  try {
    // 1. Criar evento de domingo
    console.log('📅 Criando evento de domingo...')
    const today = new Date()
    const nextSunday = new Date(today)
    nextSunday.setDate(today.getDate() + ((7 - today.getDay()) % 7 || 7))

    const { data: eventData, error: eventError } = await supabase
      .from('football_events')
      .insert({
        event_date: nextSunday.toISOString().split('T')[0],
        start_time: '18:00',
        expected_end_time: '22:00',
        match_duration_minutes: 7,
        status: 'planned'
      })
      .select()

    if (eventError) throw eventError
    const eventId = eventData[0].id
    console.log(`✅ Evento criado: ID ${eventId}`)

    // 2. Criar jogadores
    console.log('👥 Criando 23 jogadores...')
    const { data: playersInserted, error: playersError } = await supabase
      .from('players')
      .insert(
        playersData.map(p => ({
          name: p.name,
          nickname: p.nickname,
          phone: p.phone,
          primary_position: p.position,
          active: true
        }))
      )
      .select()

    if (playersError) throw playersError
    console.log(`✅ ${playersInserted.length} jogadores criados`)

    // 3. Criar presença (todos confirmados)
    console.log('✅ Confirmando presença de todos...')
    const { error: attendanceError } = await supabase
      .from('attendance')
      .insert(
        playersInserted.map(p => ({
          event_id: eventId,
          player_id: p.id,
          confirmed: true,
          confirmed_at: new Date().toISOString()
        }))
      )

    if (attendanceError) throw attendanceError
    console.log('✅ Presença confirmada')

    // 4. Criar times
    console.log('🎯 Criando 6 times...')
    const { data: teamsInserted, error: teamsError } = await supabase
      .from('teams')
      .insert(
        teamsData.map(t => ({
          event_id: eventId,
          name: t.name,
          color: t.color,
          queue_order: t.queue_order
        }))
      )
      .select()

    if (teamsError) throw teamsError
    console.log(`✅ ${teamsInserted.length} times criados`)

    // 5. Montar times com jogadores
    console.log('👕 Montando times com jogadores...')

    // Separar goleiros e linha
    const goalkeepers = playersInserted.filter(p => p.primary_position === 'goalkeeper')
    const fieldPlayers = playersInserted.filter(p => p.primary_position === 'line')

    // Distribuir jogadores
    const teamMembersToInsert: any[] = []
    teamsInserted.forEach((team, teamIndex) => {
      // 1 goleiro por time (com repetição se necessário)
      const goalkeeperIndex = teamIndex % goalkeepers.length
      teamMembersToInsert.push({
        team_id: team.id,
        player_id: goalkeepers[goalkeeperIndex].id,
        role: 'goalkeeper'
      })

      // 4 jogadores de linha por time
      for (let i = 0; i < 4; i++) {
        const playerIndex = (teamIndex * 4 + i) % fieldPlayers.length
        teamMembersToInsert.push({
          team_id: team.id,
          player_id: fieldPlayers[playerIndex].id,
          role: 'line'
        })
      }
    })

    const { error: membersError } = await supabase
      .from('team_members')
      .insert(teamMembersToInsert)

    if (membersError) throw membersError
    console.log(`✅ ${teamMembersToInsert.length} membros adicionados aos times`)

    // 6. Criar fila de times
    console.log('📋 Criando fila de times...')
    const { error: queueError } = await supabase
      .from('event_team_queue')
      .insert(
        teamsInserted.map(t => ({
          event_id: eventId,
          team_id: t.id,
          queue_position: t.queue_order,
          status: t.queue_order === 1 ? 'playing' : t.queue_order === 2 ? 'next' : 'waiting'
        }))
      )

    if (queueError) throw queueError
    console.log('✅ Fila criada')

    console.log('\n✨ SEED CONCLUÍDO COM SUCESSO!')
    console.log(`📊 Resumo:`)
    console.log(`   - Evento: ${nextSunday.toLocaleDateString('pt-BR')}`)
    console.log(`   - Jogadores: ${playersInserted.length}`)
    console.log(`   - Times: ${teamsInserted.length}`)
    console.log(`   - Membros: ${teamMembersToInsert.length}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ ERRO:', error)
    process.exit(1)
  }
}

seed()
