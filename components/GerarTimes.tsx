'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function GerarTimes({
  presencas,
  jogadores,
  dataJogo,
  onGerado
}: {
  presencas: any[]
  jogadores: any[]
  dataJogo: string
  onGerado: () => void
}) {
  const [times, setTimes] = useState<{ timeA: string[]; timeB: string[] } | null>(null)
  const [carregando, setCarregando] = useState(false)

  function embaralharTimes() {
    const ids = presencas.map(p => p.jogador_id)
    const nomes = ids.map(id => jogadores.find(j => j.id === id)?.nome || '').filter(Boolean)

    const embaralhado = [...nomes].sort(() => Math.random() - 0.5)
    const meio = Math.ceil(embaralhado.length / 2)

    setTimes({
      timeA: embaralhado.slice(0, meio),
      timeB: embaralhado.slice(meio)
    })
  }

  async function salvarTimes() {
    if (!times) return

    setCarregando(true)
    try {
      const { error } = await supabase.from('times').insert({
        data_jogo: dataJogo,
        time_a: times.timeA,
        time_b: times.timeB,
        gols_a: 0,
        gols_b: 0
      })

      if (error) throw error
      setTimes(null)
      onGerado()
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setCarregando(false)
    }
  }

  if (times) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-red-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Times Gerados</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-100 rounded-lg p-4">
            <h3 className="font-bold text-blue-700 text-center mb-3">Time A</h3>
            <ul className="space-y-2">
              {times.timeA.map((nome, i) => (
                <li key={i} className="bg-blue-500 text-white px-3 py-2 rounded text-center font-medium">
                  {nome}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-red-100 rounded-lg p-4">
            <h3 className="font-bold text-red-700 text-center mb-3">Time B</h3>
            <ul className="space-y-2">
              {times.timeB.map((nome, i) => (
                <li key={i} className="bg-red-500 text-white px-3 py-2 rounded text-center font-medium">
                  {nome}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={embaralharTimes}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            🔄 Embaralhar
          </button>
          <button
            onClick={salvarTimes}
            disabled={carregando}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {carregando ? 'Salvando...' : '✓ Confirmar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={embaralharTimes}
      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition"
    >
      🎲 Gerar Times
    </button>
  )
}
