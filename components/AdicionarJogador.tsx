'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdicionarJogador({ onAdicionado }: { onAdicionado: () => void }) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function adicionarJogador(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return

    setCarregando(true)
    try {
      const { error } = await supabase.from('jogadores').insert({
        nome: nome.trim(),
        telefone: telefone.trim() || null
      })

      if (error) throw error
      setNome('')
      setTelefone('')
      onAdicionado()
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <form onSubmit={adicionarJogador} className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Adicionar Jogador</h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Nome do jogador"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      <div className="mb-4">
        <input
          type="tel"
          placeholder="Telefone (opcional)"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <button
        type="submit"
        disabled={carregando}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
      >
        {carregando ? 'Adicionando...' : '+ Adicionar'}
      </button>
    </form>
  )
}
