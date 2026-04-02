'use client'
import { useState } from 'react'

const statusLabel = { enviado: 'Enviado', recebido: 'Recebido', em_analise: 'Em Analise', em_andamento: 'Em Andamento', resolvido: 'Resolvido' }
const statusOrdem = ['enviado', 'recebido', 'em_analise', 'em_andamento', 'resolvido']

export default function AcompanharPage() {
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
    <main className='min-h-screen p-6 max-w-lg mx-auto'>
      <h1 className='text-2xl font-bold text-gray-800 mb-1'>Acompanhar Chamado</h1>
      <p className='text-sm text-gray-500 mb-6'>Digite o codigo recebido ao abrir o chamado</p>
      <div className='flex gap-2 mb-6'>
        <input
          className='flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400'
          placeholder='Ex: MAT-1234'
          value={codigo}
          onChange={e => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && buscar()}
        />
        <button onClick={buscar} disabled={buscando}
          className='bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 rounded-xl transition disabled:opacity-50'>
          {buscando ? '...' : 'Buscar'}
        </button>
      </div>
      {erro && <p className='text-red-500 text-sm mb-4'>{erro}</p>}
      {chamado && (
        <div className='bg-white rounded-2xl shadow p-5'>
          <div className='flex justify-between items-center mb-4'>
            <span className='text-xs text-gray-400'>Codigo</span>
            <span className='font-bold text-gray-800'>{chamado.codigo_unico}</span>
          </div>
          <div className='flex justify-between items-center mb-6'>
            <span className='text-xs text-gray-400'>Tipo</span>
            <span className='text-sm font-medium text-gray-700'>{chamado.tipo_problema}</span>
          </div>
          <p className='text-xs text-gray-400 uppercase tracking-wide mb-3'>Linha do tempo</p>
          <div className='flex flex-col gap-3'>
            {statusOrdem.map((s) => {
              const item = historico.find(h => h.status_novo === s)
              const ativo = item != null
              const atual = chamado.status === s
              const circulo = atual ? 'bg-yellow-400' : ativo ? 'bg-green-400' : 'bg-gray-200'
              const texto = ativo ? 'text-gray-800' : 'text-gray-400'
              return (
                <div key={s} className='flex items-start gap-3'>
                  <div className={circulo + ' w-4 h-4 rounded-full mt-0.5 flex-shrink-0'} />
                  <div>
                    <p className={texto + ' text-sm font-medium'}>{statusLabel[s]}</p>
                    {item && <p className='text-xs text-gray-400'>{new Date(item.criado_em).toLocaleString('pt-BR')}</p>}
                    {item && item.observacao && <p className='text-xs text-gray-500 mt-1'>{item.observacao}</p>}
                  </div>
                </div>
              )
            })}
          </div>
          {chamado.previsao_resolucao && (
            <div className='mt-5 bg-yellow-50 rounded-xl p-3'>
              <p className='text-xs text-gray-500'>Previsao de resolucao</p>
              <p className='text-sm font-semibold text-gray-800'>{new Date(chamado.previsao_resolucao).toLocaleString('pt-BR')}</p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}