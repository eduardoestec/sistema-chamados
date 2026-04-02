'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const statusLabel: Record<string, string> = { enviado: 'Enviado', recebido: 'Recebido', em_analise: 'Em Analise', em_andamento: 'Em Andamento', resolvido: 'Resolvido' }
const statusOrdem = ['enviado', 'recebido', 'em_analise', 'em_andamento', 'resolvido']
const urgenciaLabel: Record<string, string> = { baixa: 'Baixa', media: 'Media', alta: 'Alta', muito_alta: 'Muito Alta' }

export default function DetalheChamado({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [chamado, setChamado] = useState<any>(null)
const [historico, setHistorico] = useState<any[]>([])
  const [novoStatus, setNovoStatus] = useState('')
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [adminId, setAdminId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/admin/login'); return }
      setAdminId(data.session.user.id)
      params.then(p => carregarChamado(p.id))
    })
  }, [])

  async function carregarChamado(id: string) {
    const { data: c } = await supabase.from('chamados').select('*').eq('id', id).single()
    const { data: h } = await supabase.from('chamado_historico').select('*').eq('chamado_id', id).order('criado_em', { ascending: true })
    setChamado(c)
    setHistorico(h || [])
    setNovoStatus(c.status)
  }

  async function salvar() {
    if (!chamado) return
    setSalvando(true)
    const statusAnterior = chamado.status
    await supabase.from('chamados').update({ status: novoStatus, atualizado_em: new Date().toISOString() }).eq('id', chamado.id)
    await supabase.from('chamado_historico').insert({
      chamado_id: chamado.id,
      status_anterior: statusAnterior,
      status_novo: novoStatus,
      observacao: observacao || null,
      admin_id: adminId
    })
    setObservacao('')
    await params.then(p => carregarChamado(p.id))
    setSalvando(false)
    alert('Status atualizado!')
  }

  if (!chamado) return <div className='flex items-center justify-center min-h-screen'>Carregando...</div>

  return (
    <main className='min-h-screen p-6 max-w-lg mx-auto'>
      <button onClick={() => router.push('/admin')} className='text-sm text-gray-500 hover:text-gray-800 mb-4 block'>
        Voltar
      </button>
      <div className='bg-white rounded-2xl shadow p-5 mb-4'>
        <div className='flex justify-between items-center mb-4'>
          <span className='font-bold text-gray-800 text-lg'>{chamado.codigo_unico}</span>
          <span className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full'>{urgenciaLabel[chamado.urgencia]}</span>
        </div>
        <p className='text-sm font-semibold text-gray-700 mb-1'>{chamado.tipo_problema}</p>
        <p className='text-sm text-gray-500 mb-4'>{chamado.descricao}</p>
        <p className='text-xs text-gray-400'>Aberto em: {new Date(chamado.criado_em).toLocaleString('pt-BR')}</p>
      </div>
      <div className='bg-white rounded-2xl shadow p-5 mb-4'>
        <p className='text-sm font-semibold text-gray-700 mb-3'>Atualizar Status</p>
        <div className='grid grid-cols-2 gap-2 mb-4'>
          {statusOrdem.map(s => (
            <button key={s} onClick={() => setNovoStatus(s)}
              className={novoStatus === s ? 'py-2 px-3 rounded-lg border text-sm font-medium bg-yellow-400 border-yellow-400 text-gray-900' : 'py-2 px-3 rounded-lg border text-sm font-medium bg-white border-gray-200 text-gray-600'}>
              {statusLabel[s]}
            </button>
          ))}
        </div>
        <textarea
          className='w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 min-h-20 focus:outline-none focus:border-yellow-400 mb-3'
          placeholder='Observacao (opcional)...'
          value={observacao}
          onChange={e => setObservacao(e.target.value)}
        />
        <button onClick={salvar} disabled={salvando}
          className='w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl transition disabled:opacity-50'>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
      <div className='bg-white rounded-2xl shadow p-5'>
        <p className='text-sm font-semibold text-gray-700 mb-3'>Historico</p>
        <div className='flex flex-col gap-3'>
          {historico.map(h => (
            <div key={h.id} className='flex items-start gap-3'>
              <div className='w-2 h-2 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0' />
              <div>
                <p className='text-sm font-medium text-gray-700'>{statusLabel[h.status_novo]}</p>
                <p className='text-xs text-gray-400'>{new Date(h.criado_em).toLocaleString('pt-BR')}</p>
                {h.observacao && <p className='text-xs text-gray-500 mt-1'>{h.observacao}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}