'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { QrCode, BarChart2, LogOut, Wrench } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const statusLabel = { enviado: 'Enviado', recebido: 'Recebido', em_analise: 'Em Analise', em_andamento: 'Em Andamento', resolvido: 'Resolvido' }
const urgenciaCor = { baixa: 'bg-gray-100 text-gray-600', media: 'bg-yellow-100 text-yellow-700', alta: 'bg-orange-100 text-orange-700', muito_alta: 'bg-red-100 text-red-700' }
const urgenciaLabel = { baixa: 'Baixa', media: 'Media', alta: 'Alta', muito_alta: 'Muito Alta' }

export default function AdminPage() {
  const router = useRouter()
  const [chamados, setChamados] = useState([])
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroUrgencia, setFiltroUrgencia] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/admin/login'); return }
      carregarChamados()
    })
  }, [])

  async function carregarChamados() {
    setCarregando(true)
    const { data } = await supabase.from('chamados').select('*').order('criado_em', { ascending: false })
    setChamados(data || [])
    setCarregando(false)
  }

  async function sair() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const filtrados = chamados.filter(c => {
    if (filtroStatus && c.status !== filtroStatus) return false
    if (filtroUrgencia && c.urgencia !== filtroUrgencia) return false
    return true
  })

  const emAberto = chamados.filter(c => c.status !== 'resolvido').length
  const resolvidos = chamados.filter(c => c.status === 'resolvido').length
  const muitoAlta = chamados.filter(c => c.urgencia === 'muito_alta' && c.status !== 'resolvido').length

  return (
    <main className='min-h-screen bg-gray-50 flex'>

      {/* Sidebar */}
      <aside className='w-20 bg-gray-900 flex flex-col items-center justify-between py-6 flex-shrink-0'>
        <div className='flex flex-col items-center gap-1'>
          <div className='bg-yellow-400 rounded-xl w-12 h-12 flex items-center justify-center'>
            <Wrench size={22} className='text-gray-900' />
          </div>
          <span className='text-white text-xs font-bold mt-1'>A.S</span>
        </div>
        <div className='flex flex-col items-center gap-6'>
          <Link href='/admin/qrcodes' className='flex flex-col items-center gap-1 group'>
            <div className='bg-gray-700 group-hover:bg-yellow-400 rounded-xl w-12 h-12 flex items-center justify-center transition'>
              <QrCode size={20} className='text-white group-hover:text-gray-900 transition' />
            </div>
            <span className='text-gray-400 text-xs group-hover:text-yellow-400 transition text-center leading-tight'>QR Codes</span>
          </Link>
          <Link href='/admin/relatorios' className='flex flex-col items-center gap-1 group'>
            <div className='bg-gray-700 group-hover:bg-yellow-400 rounded-xl w-12 h-12 flex items-center justify-center transition'>
              <BarChart2 size={20} className='text-white group-hover:text-gray-900 transition' />
            </div>
            <span className='text-gray-400 text-xs group-hover:text-yellow-400 transition text-center leading-tight'>Relatorios</span>
          </Link>
          <button onClick={sair} className='flex flex-col items-center gap-1 group'>
            <div className='bg-gray-700 group-hover:bg-red-500 rounded-xl w-12 h-12 flex items-center justify-center transition'>
              <LogOut size={20} className='text-white transition' />
            </div>
            <span className='text-gray-400 text-xs group-hover:text-red-400 transition'>Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteudo principal */}
      <div className='flex-1 p-6 overflow-auto'>

        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-800'>Painel de Chamados</h1>
          <p className='text-sm text-gray-500'>Manutencao Predial</p>
        </div>

        {/* Cards de resumo */}
        <div className='grid grid-cols-3 gap-4 mb-6'>
          <div className='bg-white rounded-2xl shadow p-5'>
            <p className='text-xs text-gray-400 mb-1'>Total de Chamados</p>
            <p className='text-3xl font-black text-gray-800'>{chamados.length}</p>
          </div>
          <div className='bg-white rounded-2xl shadow p-5'>
            <p className='text-xs text-gray-400 mb-1'>Em Aberto</p>
            <p className='text-3xl font-black text-yellow-400'>{emAberto}</p>
          </div>
          <div className='bg-white rounded-2xl shadow p-5'>
            <p className='text-xs text-gray-400 mb-1'>Urgencia Muito Alta</p>
            <p className='text-3xl font-black text-red-500'>{muitoAlta}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className='flex gap-2 mb-4'>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className='border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white'>
            <option value=''>Todos os status</option>
            {Object.entries(statusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={filtroUrgencia} onChange={e => setFiltroUrgencia(e.target.value)}
            className='border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white'>
            <option value=''>Todas as urgencias</option>
            {Object.entries(urgenciaLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <span className='text-sm text-gray-400 self-center ml-2'>{filtrados.length} chamados</span>
        </div>

        {/* Lista de chamados */}
        {carregando && <p className='text-gray-400 text-sm'>Carregando...</p>}
        <div className='flex flex-col gap-3'>
          {filtrados.map(c => (
            <Link key={c.id} href={'/admin/chamado/' + c.id}
              className='bg-white rounded-2xl shadow p-4 hover:shadow-md transition block'>
              <div className='flex justify-between items-start mb-2'>
                <span className='font-bold text-gray-800'>{c.codigo_unico}</span>
                <span className={urgenciaCor[c.urgencia] + ' text-xs px-2 py-1 rounded-full font-medium'}>
                  {urgenciaLabel[c.urgencia]}
                </span>
              </div>
              <p className='text-sm text-gray-600 mb-1'>{c.tipo_problema}</p>
              <p className='text-xs text-gray-400 truncate mb-3'>{c.descricao}</p>
              <div className='flex justify-between items-center'>
                <span className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full'>{statusLabel[c.status]}</span>
                <span className='text-xs text-gray-400'>{new Date(c.criado_em).toLocaleDateString('pt-BR')}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}