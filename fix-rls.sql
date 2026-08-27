-- Desabilitar RLS nas tabelas
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_team_queue DISABLE ROW LEVEL SECURITY;

-- Confirmar
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('matches', 'event_team_queue');
