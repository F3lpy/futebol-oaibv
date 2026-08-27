-- Verificar estrutura das tabelas
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('matches', 'event_team_queue')
ORDER BY table_name, ordinal_position;

-- Verificar RLS
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('matches', 'event_team_queue');

-- Verificar políticas
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('matches', 'event_team_queue');

-- Contar registros
SELECT 'matches' as table_name, COUNT(*) as count FROM matches
UNION ALL
SELECT 'event_team_queue', COUNT(*) FROM event_team_queue;
