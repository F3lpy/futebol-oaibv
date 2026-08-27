'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AdicionarJogador from '@/components/AdicionarJogador'
import ListaJogadores from '@/components/ListaJogadores'
import GerarTimes from '@/components/GerarTimes'

export default function Home() {
  const [jogadores, setJogadores] = useState<any[]>([])
  const [presencas, setPresencas] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [dataJogo, setDataJogo] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    carregarDados()
  }, [dataJogo])

  async function carregarDados() {
    setCarregando(true)
    try {
      const { data: jogadoresData } = await supabase
        .from('jogadores')
        .select('*')
        .eq('ativo', true)

      const { data: presencasData } = await supabase
        .from('presencas')
        .select('*')
        .eq('data_jogo', dataJogo)

      setJogadores(jogadoresData || [])
      setPresencas(presencasData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setCarregando(false)
    }
  }

  async function adicionarPresenca(jogadorId: number) {
    try {
      const { error } = await supabase.from('presencas').insert({
        jogador_id: jogadorId,
        data_jogo: dataJogo,
        presente: true
      })

      if (error) throw error
      carregarDados()
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  async function removerPresenca(jogadorId: number) {
    try {
      const { error } = await supabase
        .from('presencas')
        .delete()
        .eq('jogador_id', jogadorId)
        .eq('data_jogo', dataJogo)

      if (error) throw error
      carregarDados()
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-green-700 mb-2">⚽ Futebol Oaibv</h1>
        <p className="text-gray-600 mb-8">Gestão do futebol dos irmãos na Igreja</p>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Coluna esquerda - Adicionar e listar jogadores */}
          <div className="lg:col-span-1">
            <AdicionarJogador onAdicionado={carregarDados} />
            <ListaJogadores
              jogadores={jogadores}
              presencas={presencas}
              dataJogo={dataJogo}
              onAdicionarPresenca={adicionarPresenca}
              onRemoverPresenca={removerPresenca}
            />
          </div>

          {/* Coluna direita - Gestão do jogo */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data do Jogo
                </label>
                <input
                  type="date"
                  value={dataJogo}
                  onChange={(e) => setDataJogo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Presença de Hoje ({presencas.length} jogadores)
                </h2>
                {carregando ? (
                  <p className="text-gray-500">Carregando...</p>
                ) : presencas.length === 0 ? (
                  <p className="text-gray-500">Nenhum jogador confirmado</p>
                ) : (
                  <div className="space-y-2">
                    {presencas.map((presenca) => {
                      const jogador = jogadores.find(j => j.id === presenca.jogador_id)
                      return (
                        <div key={presenca.id} className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                          <span className="font-medium text-gray-800">{jogador?.nome}</span>
                          <button
                            onClick={() => removerPresenca(presenca.jogador_id)}
                            className="text-red-500 hover:text-red-700 font-semibold"
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {presencas.length >= 6 && (
                <GerarTimes presencas={presencas} jogadores={jogadores} dataJogo={dataJogo} onGerado={carregarDados} />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
