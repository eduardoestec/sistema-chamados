'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { QrCode, BarChart2, LogOut, Wrench, Users, Bell, FileText, Clock, AlertTriangle, User } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const statusLabel = { enviado: 'Enviado', recebido: 'Recebido', em_analise: 'Em Analise', em_andamento: 'Em Andamento', resolvido: 'Resolvido' }
const urgenciaCor = {
  baixa: 'bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/20',
  media: 'bg-[#d97706]/10 text-[#d97706] border-[#d97706]/20',
  alta: 'bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20',
  muito_alta: 'bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20'
}
const urgenciaLabel = { baixa: 'Baixa', media: 'Media', alta: 'Alta', muito_alta: 'Muito Alta' }

export default function AdminPage() {
  const router = useRouter()
  const [chamados, setChamados] = useState<any[]>([])
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroUrgencia, setFiltroUrgencia] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [nivel, setNivel] = useState('')
  const [adminNome, setAdminNome] = useState('')
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0)

  useEffect(() => {
    const nivelAtual = localStorage.getItem('admin_nivel') || ''
    setNivel(nivelAtual)
    setAdminNome(localStorage.getItem('admin_nome') || '')
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/admin/login'); return }
      carregarChamados()
      if (nivelAtual === 'gestor') carregarNotificacoes()
    })

    let intervalo: ReturnType<typeof setInterval> | null = null
    if (localStorage.getItem('admin_nivel') === 'gestor') {
      intervalo = setInterval(carregarNotificacoes, 30000)
    }
    return () => { if (intervalo) clearInterval(intervalo) }
  }, [])

  async function carregarChamados() {
    setCarregando(true)
    const { data: lista } = await supabase
      .from('chamados')
      .select('*')
      .order('criado_em', { ascending: false })

    if (!lista) { setChamados([]); setCarregando(false); return }

    // Buscar nomes dos responsáveis separadamente para não filtrar chamados sem responsavel_id
    const ids = [...new Set(lista.map(c => c.responsavel_id).filter(Boolean))]
    let nomes: Record<string, string> = {}
    if (ids.length > 0) {
      const { data: perfis } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', ids)
      for (const p of perfis || []) nomes[p.id] = p.nome
    }

    setChamados(lista.map(c => ({ ...c, responsavel_nome: nomes[c.responsavel_id] || null })))
    setCarregando(false)
  }

  async function carregarNotificacoes() {
    const { count } = await supabase
      .from('notificacoes')
      .select('*', { count: 'exact', head: true })
      .eq('lido', false)
    setNotificacoesNaoLidas(count || 0)
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
  const muitoAlta = chamados.filter(c => c.urgencia === 'muito_alta' && c.status !== 'resolvido').length

  return (
    <main className='bg-[#f8f7f7] flex min-h-screen'>

      {/* Sidebar */}
      <aside className='fixed left-0 top-0 z-10 w-20 h-screen bg-[#2c2c2c] flex flex-col items-center justify-between py-6 flex-shrink-0'>
        <div className='flex flex-col items-center gap-1'>
          <div className='bg-[#604404] rounded-xl w-12 h-12 flex items-center justify-center'>
            <Wrench size={22} className='text-white' />
          </div>
          <span className='text-white text-xs font-bold mt-1'>A.S</span>
        </div>
        <div className='flex flex-col items-center gap-4'>
          {nivel === 'gestor' && (
            <>
              <div className='w-8 h-px bg-[#6b7280]'></div>
              <Link href='/admin/notificacoes' className='flex flex-col items-center gap-1 group relative'>
                <div className='bg-gray-700 group-hover:bg-[#604404] rounded-xl w-12 h-12 flex items-center justify-center transition-all duration-200 relative'>
                  <Bell size={20} className='text-white transition-all duration-200' />
                  {notificacoesNaoLidas > 0 && (
                    <span className='absolute -top-1 -right-1 bg-[#dc2626] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium'>
                      {notificacoesNaoLidas > 9 ? '9+' : notificacoesNaoLidas}
                    </span>
                  )}
                </div>
                <span className='text-gray-400 text-xs group-hover:text-[#604404] transition-all duration-200 text-center leading-tight'>Notific.</span>
              </Link>
              <Link href='/admin/usuarios' className='flex flex-col items-center gap-1 group'>
                <div className='bg-gray-700 group-hover:bg-[#604404] rounded-xl w-12 h-12 flex items-center justify-center transition-all duration-200'>
                  <Users size={20} className='text-white transition-all duration-200' />
                </div>
                <span className='text-gray-400 text-xs group-hover:text-[#604404] transition-all duration-200 text-center leading-tight'>Usuários</span>
              </Link>
              <Link href='/admin/qrcodes' className='flex flex-col items-center gap-1 group'>
                <div className='bg-gray-700 group-hover:bg-[#604404] rounded-xl w-12 h-12 flex items-center justify-center transition-all duration-200'>
                  <QrCode size={20} className='text-white transition-all duration-200' />
                </div>
                <span className='text-gray-400 text-xs group-hover:text-[#604404] transition-all duration-200 text-center leading-tight'>QR Codes</span>
              </Link>
              <Link href='/admin/relatorios' className='flex flex-col items-center gap-1 group'>
                <div className='bg-gray-700 group-hover:bg-[#604404] rounded-xl w-12 h-12 flex items-center justify-center transition-all duration-200'>
                  <BarChart2 size={20} className='text-white transition-all duration-200' />
                </div>
                <span className='text-gray-400 text-xs group-hover:text-[#604404] transition-all duration-200 text-center leading-tight'>Relatórios</span>
              </Link>
            </>
          )}
          <div className='w-8 h-px bg-[#6b7280]'></div>
          <button onClick={sair} className='flex flex-col items-center gap-1 group'>
            <div className='bg-gray-700 group-hover:bg-[#dc2626] rounded-xl w-12 h-12 flex items-center justify-center transition-all duration-200'>
              <LogOut size={20} className='text-white transition-all duration-200' />
            </div>
            <span className='text-gray-400 text-xs group-hover:text-[#dc2626] transition-all duration-200'>Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className='ml-20 flex-1 flex flex-col min-h-screen'>

        {/* Header */}
        <div className='flex-shrink-0 bg-white border-b border-[#e5e3e3] p-6'>
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-2xl font-bold text-[#2c2c2c] tracking-tight'>Painel de Chamados</h1>
              <p className='text-sm text-[#6b7280]'>Manutenção Predial - Sistema de Chamados</p>
            </div>
            <div className='flex items-center gap-3'>
              <div className='text-right'>
                <p className='text-sm font-medium text-[#1a1a1a]'>{adminNome || 'Usuário'}</p>
                <p className='text-xs text-[#6b7280] capitalize'>{nivel}</p>
              </div>
              <div className='bg-[#604404] rounded-xl w-10 h-10 flex items-center justify-center'>
                <User size={20} className='text-white' />
              </div>
            </div>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className='sticky top-0 bg-[#f8f7f7] z-10 p-6 border-b border-[#e5e3e3]'>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8'>
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <div className='flex items-center gap-3 mb-3'>
                <div className='bg-[#604404]/10 rounded-lg p-2'>
                  <FileText size={24} className='text-[#604404]' />
                </div>
                <div>
                  <p className='text-xs uppercase tracking-wider text-[#6b7280]'>Total de Chamados</p>
                  <p className='text-3xl font-black text-[#2c2c2c]'>{chamados.length}</p>
                </div>
              </div>
            </div>
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <div className='flex items-center gap-3 mb-3'>
                <div className='bg-[#604404]/10 rounded-lg p-2'>
                  <Clock size={24} className='text-[#604404]' />
                </div>
                <div>
                  <p className='text-xs uppercase tracking-wider text-[#6b7280]'>Em Aberto</p>
                  <p className='text-3xl font-black text-[#604404]'>{emAberto}</p>
                </div>
              </div>
            </div>
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <div className='flex items-center gap-3 mb-3'>
                <div className='bg-[#dc2626]/10 rounded-lg p-2'>
                  <AlertTriangle size={24} className='text-[#dc2626]' />
                </div>
                <div>
                  <p className='text-xs uppercase tracking-wider text-[#6b7280]'>Urgência Muito Alta</p>
                  <p className='text-3xl font-black text-[#dc2626]'>{muitoAlta}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className='flex gap-4 mb-6 flex-wrap'>
            <div>
              <label className='block text-xs uppercase tracking-wider text-[#6b7280] mb-2'>Status</label>
              <select
                value={filtroStatus}
                onChange={e => setFiltroStatus(e.target.value)}
                className='border border-[#e5e3e3] rounded-lg px-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#604404] focus:ring-1 focus:ring-[#604404] transition-all duration-200 bg-white'
              >
                <option value=''>Todos os status</option>
                {Object.entries(statusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className='block text-xs uppercase tracking-wider text-[#6b7280] mb-2'>Urgência</label>
              <select
                value={filtroUrgencia}
                onChange={e => setFiltroUrgencia(e.target.value)}
                className='border border-[#e5e3e3] rounded-lg px-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#604404] focus:ring-1 focus:ring-[#604404] transition-all duration-200 bg-white'
              >
                <option value=''>Todas as urgências</option>
                {Object.entries(urgenciaLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className='flex items-end'>
              <span className='text-sm text-[#6b7280] bg-[#fdf8f0] px-4 py-3 rounded-lg'>{filtrados.length} chamados</span>
            </div>
          </div>
        </div>

        {/* Lista de chamados */}
        <div className='flex-1 overflow-y-auto px-6 pb-6'>
          {carregando && <p className='text-[#6b7280] text-sm'>Carregando...</p>}
          <div className='flex flex-col gap-4'>
            {filtrados.map(c => (
              <Link
                key={c.id}
                href={'/admin/chamado/' + c.id}
                className='bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 block border border-transparent hover:border-[#604404]/20'
              >
                <div className='flex justify-between items-start mb-4'>
                  <div>
                    <h3 className='font-bold text-[#2c2c2c] text-lg mb-1'>{c.codigo_unico}</h3>
                    <p className='text-sm text-[#6b7280]'>{c.tipo_problema}</p>
                  </div>
                  <span className={`${urgenciaCor[c.urgencia as keyof typeof urgenciaCor]} text-xs px-3 py-1.5 rounded-lg font-medium border`}>
                    {urgenciaLabel[c.urgencia as keyof typeof urgenciaLabel]}
                  </span>
                </div>
                <p className='text-sm text-[#6b7280] mb-4 line-clamp-2'>{c.descricao}</p>
                <div className='flex justify-between items-center'>
                  <span className='text-xs bg-[#fdf8f0] text-[#6b7280] px-3 py-1.5 rounded-lg font-medium'>{statusLabel[c.status as keyof typeof statusLabel]}</span>
                  <div className='flex items-center gap-4 text-xs text-[#6b7280]'>
                    <span className={c.responsavel_nome ? 'text-[#604404] font-medium' : ''}>
                      {c.responsavel_nome || 'Sem responsável'}
                    </span>
                    <span>{new Date(c.criado_em).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
