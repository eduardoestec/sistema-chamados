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

type Chamado = {
  id: string
  codigo_unico: string
  tipo_problema: string
  descricao: string
  status: string
  urgencia: string
  criado_em: string
}

const statusLabel: Record<string, string> = {
  enviado: 'Enviado',
  recebido: 'Recebido',
  em_analise: 'Em Analise',
  em_andamento: 'Em Andamento',
  resolvido: 'Resolvido'
}

const urgenciaCor: Record<string, string> = {
  baixa: 'bg-gray-100 text-gray-600',
  media: 'bg-yellow-100 text-yellow-700',
  alta: 'bg-orange-100 text-orange-700',
  muito_alta: 'bg-red-100 text-red-700'
}

const urgenciaLabel: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Media',
  alta: 'Alta',
  muito_alta: 'Muito Alta'
}

export default function AdminPage() {
  const router = useRouter()

  const [chamados, setChamados] = useState<Chamado[]>([])
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroUrgencia, setFiltroUrgencia] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/admin/login')
        return
      }
      carregarDados()
    })
  }, [])

  async function carregarDados() {
    setCarregando(true)

    const { data } = await supabase
      .from('chamados')
      .select('*')
      .order('criado_em', { ascending: false })

    setChamados((data as Chamado[]) || [])
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
  const muitoAlta = chamados.filter(
    c => c.urgencia === 'muito_alta' && c.status !== 'resolvido'
  ).length

  return (
    <main className='min-h-screen bg-gray-50 flex'>

      {/* Sidebar */}
      <aside className='w-20 bg-gray-900 flex flex-col items-center justify-between py-6'>
        <div className='flex flex-col items-center gap-1'>
          <div className='bg-yellow-400 rounded-xl w-12 h-12 flex items-center justify-center'>
            <Wrench size={22} className='text-gray-900' />
          </div>
          <span className='text-white text-xs font-bold mt-1'>A.S</span>
        </div>

        <div className='flex flex-col items-center gap-6'>
          <Link href='/admin/qrcodes' className='flex flex-col items-center gap-1 group'>
            <div className='bg-gray-700 group-hover:bg-yellow-400 rounded-xl w-12 h-12 flex items-center justify-center'>
              <QrCode size={20} className='text-white group-hover:text-gray-900' />
            </div>
            <span className='text-gray-400 text-xs group-hover:text-yellow-400'>QR Codes</span>
          </Link>

          <Link href='/admin/relatorios' className='flex flex-col items-center gap-1 group'>
            <div className='bg-gray-700 group-hover:bg-yellow-400 rounded-xl w-12 h-12 flex items-center justify-center'>
              <BarChart2 size={20} className='text-white group-hover:text-gray-900' />
            </div>
            <span className='text-gray-400 text-xs group-hover:text-yellow-400'>Relatorios</span>
          </Link>

          <button onClick={sair} className='flex flex-col items-center gap-1 group'>
            <div className='bg-gray-700 group-hover:bg-red-500 rounded-xl w-12 h-12 flex items-center justify-center'>
              <LogOut size={20} className='text-white' />
            </div>
            <span className='text-gray-400 text-xs group-hover:text-red-400'>Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteudo */}
      <div className='flex-1 p-6 overflow-auto'>
        <h1 className='text-2xl font-bold text-gray-800 mb-6'>Relatórios</h1>

        <div className='grid grid-cols-3 gap-4 mb-6'>
          <div className='bg-white rounded-2xl shadow p-5'>
            <p className='text-xs text-gray-400'>Total</p>
            <p className='text-3xl font-black'>{chamados.length}</p>
          </div>

          <div className='bg-white rounded-2xl shadow p-5'>
            <p className='text-xs text-gray-400'>Em Aberto</p>
            <p className='text-3xl font-black text-yellow-400'>{emAberto}</p>
          </div>

          <div className='bg-white rounded-2xl shadow p-5'>
            <p className='text-xs text-gray-400'>Muito Urgentes</p>
            <p className='text-3xl font-black text-red-500'>{muitoAlta}</p>
          </div>
        </div>

        {carregando && <p>Carregando...</p>}

        <div className='flex flex-col gap-3'>
          {filtrados.map(c => (
            <Link key={c.id} href={'/admin/chamado/' + c.id}
              className='bg-white rounded-2xl shadow p-4 hover:shadow-md'>
              <div className='flex justify-between'>
                <span className='font-bold'>{c.codigo_unico}</span>
                <span className={urgenciaCor[c.urgencia] + ' px-2 py-1 rounded-full text-xs'}>
                  {urgenciaLabel[c.urgencia]}
                </span>
              </div>
              <p className='text-sm text-gray-600'>{c.tipo_problema}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
