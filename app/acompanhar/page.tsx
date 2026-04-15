'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search } from 'lucide-react'

const statusLabel: Record<string, string> = { enviado: 'Enviado', recebido: 'Recebido', em_analise: 'Em Analise', em_andamento: 'Em Andamento', resolvido: 'Resolvido' }
const statusOrdem = ['enviado', 'recebido', 'em_analise', 'em_andamento', 'resolvido']

export default function AcompanharPage() {
  const router = useRouter()
  const [codigo, setCodigo] = useState('')
  const [chamado, setChamado] = useState<any>(null)
  const [historico, setHistorico] = useState<any[]>([])
  const [erro, setErro] = useState('')
  const [buscando, setBuscando] = useState(false)

  async function buscar() {
    if (!codigo) return
    setBuscando(true)
    setErro('')
    setChamado(null)
    try {
      const res = await fetch('/api/chamados/' + codigo)
      const data = await res.json()
      if (data.erro) { setErro('Chamado nao encontrado. Verifique o codigo.') }
      else { setChamado(data.chamado); setHistorico(data.historico) }
    } catch { setErro('Erro ao buscar chamado.') }
    finally { setBuscando(false) }
  }

  return (
    <main className='min-h-screen bg-[#f8f7f7] p-6'>
      <div className='max-w-lg mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <button onClick={() => router.back()} className='flex items-center gap-2 text-[#6b7280] hover:text-[#1a1a1a] transition-all duration-200'>
            <ArrowLeft size={20} />
            <span className='text-sm font-medium'>Voltar</span>
          </button>
          <div className='bg-[#767171] rounded-xl w-12 h-12 flex items-center justify-center'>
            <span className='text-white font-black text-lg'>AS</span>
          </div>
        </div>

        <h1 className='text-2xl font-bold text-[#2c2c2c] tracking-tight mb-2'>Acompanhar Chamado</h1>
        <p className='text-sm text-[#6b7280] mb-8'>Digite o código recebido ao abrir o chamado</p>

        {/* Campo de Busca */}
        <div className='bg-white rounded-xl shadow-sm p-6 mb-6'>
          <div className='flex gap-3'>
            <div className='relative flex-1'>
              <Search size={18} className='absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7280]' />
              <input
                className='w-full border border-[#e5e3e3] rounded-lg pl-10 pr-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#767171] focus:ring-1 focus:ring-[#767171] transition-all duration-200'
                placeholder='Ex: AS-0001'
                value={codigo}
                onChange={e => setCodigo(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && buscar()}
              />
            </div>
            <button
              onClick={buscar}
              disabled={buscando}
              className='bg-[#767171] hover:bg-[#5a5555] text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {buscando ? '...' : 'Buscar'}
            </button>
          </div>
          {erro && (
            <div className='mt-4 bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg p-3'>
              <p className='text-sm text-[#dc2626]'>{erro}</p>
            </div>
          )}
        </div>

        {chamado && (
          <div className='bg-white rounded-xl shadow-sm p-6'>
            {/* Código e Tipo */}
            <div className='flex justify-between items-center mb-6'>
              <div>
                <p className='text-xs uppercase tracking-wider text-[#6b7280] mb-1'>Código</p>
                <p className='text-lg font-bold text-[#2c2c2c]'>{chamado.codigo_unico}</p>
              </div>
              <div className='text-right'>
                <p className='text-xs uppercase tracking-wider text-[#6b7280] mb-1'>Tipo</p>
                <p className='text-sm font-medium text-[#1a1a1a]'>{chamado.tipo_problema}</p>
              </div>
            </div>

            {/* Timeline */}
            <h2 className='text-xs uppercase tracking-wider text-[#6b7280] mb-4'>Linha do Tempo</h2>
            <div className='relative'>
              {statusOrdem.map((s, index) => {
                const item = historico.find(h => h.status_novo === s)
                const ativo = item != null
                const atual = chamado.status === s
                const isLast = index === statusOrdem.length - 1

                return (
                  <div key={s} className='flex items-start gap-4 mb-6 relative'>
                    {/* Linha vertical */}
                    {!isLast && (
                      <div className={`absolute left-2 top-6 w-0.5 h-12 ${atual || ativo ? 'bg-[#767171]' : 'bg-[#e5e3e3]'}`} />
                    )}

                    {/* Círculo */}
                    <div className={`w-4 h-4 rounded-full mt-0.5 flex-shrink-0 ${atual ? 'bg-[#767171]' : ativo ? 'bg-[#16a34a]' : 'bg-[#e5e3e3]'}`} />

                    {/* Conteúdo */}
                    <div className='flex-1'>
                      <p className={`text-sm font-medium ${atual ? 'text-[#767171]' : ativo ? 'text-[#1a1a1a]' : 'text-[#6b7280]'}`}>
                        {statusLabel[s]}
                      </p>
                      {item && (
                        <p className='text-xs text-[#6b7280] mt-1'>
                          {new Date(item.criado_em).toLocaleString('pt-BR')}
                        </p>
                      )}
                      {item && item.observacao && (
                        <p className='text-xs text-[#6b7280] mt-2 bg-[#f5f4f4] rounded-lg p-3'>{item.observacao}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Previsão */}
            {chamado.previsao_resolucao && (
              <div className='mt-6 bg-[#f5f4f4] rounded-xl p-4'>
                <p className='text-xs uppercase tracking-wider text-[#6b7280] mb-2'>Previsão de Resolução</p>
                <p className='text-sm font-semibold text-[#1a1a1a]'>{new Date(chamado.previsao_resolucao).toLocaleString('pt-BR')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
