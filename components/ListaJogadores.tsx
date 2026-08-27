'use client'

export default function ListaJogadores({
  jogadores,
  presencas,
  dataJogo,
  onAdicionarPresenca,
  onRemoverPresenca
}: {
  jogadores: any[]
  presencas: any[]
  dataJogo: string
  onAdicionarPresenca: (id: number) => void
  onRemoverPresenca: (id: number) => void
}) {
  const presencasIds = presencas.map(p => p.jogador_id)
  const jogadoresDisponiveis = jogadores.filter(j => !presencasIds.includes(j.id))

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Disponíveis</h2>

      {jogadoresDisponiveis.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Todos confirmaram presença!</p>
      ) : (
        <div className="space-y-2">
          {jogadoresDisponiveis.map((jogador) => (
            <div
              key={jogador.id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition"
            >
              <div>
                <p className="font-medium text-gray-800">{jogador.nome}</p>
                {jogador.telefone && <p className="text-sm text-gray-500">{jogador.telefone}</p>}
              </div>
              <button
                onClick={() => onAdicionarPresenca(jogador.id)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded transition"
              >
                +
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
