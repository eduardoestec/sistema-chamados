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

const statusLabel = {
  enviado: 'Enviado',
  recebido: 'Recebido',
  em_analise: 'Em Analise',
  em_andamento: 'Em Andamento',
  resolvido: 'Resolvido'
}

const urgenciaCor = {
  baixa: 'bg-gray-100 text-gray-600',
  media: 'bg-yellow-100 text-yellow-700',
  alta: 'bg-orange-100 text-orange-700',
  muito_alta: 'bg-red-100 text-red-700'
}

const urgenciaLabel = {
  baixa: 'Baixa',
  media: 'Media',
  alta: 'Alta',
  muito_alta: 'Muito Alta'
}

/* 👇 TIPAGEM DO CHAMADO (AQUI ESTÁ A CORREÇÃO) */
type Chamado = {
  id: string
  codigo_unico: string
  tipo_problema: string
  descricao: string
  status: keyof typeof statusLabel
  urgencia: keyof typeof urgenciaLabel
  criado_em: string
}

export default function AdminPage() {
  const router = useRouter()

  /* 👇 AGORA O STATE ESTÁ TIPADO */
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
      carregarChamados()
    })
  }, [])

  async function carregarChamados() {
    setCarregando(true)

    const { data, error } = await supabase
      .from('chamados')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) {
      console.error(error)
      setCarregando(false)
      return
    }

    /* 👇 CAST CORRETO PARA O TIPO */
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
  const resolvidos = chamados.filter(c => c.status === 'resolvido').length
  const muitoAlta = chamados.filter(
    c => c.urgencia === 'muito_alta' && c.status !== 'resolvido'
  ).length

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
            <span className='text-gray-400 text-xs group-hover:text-yellow-400'>QR Codes</span>
          </Link>

          <Link href='/admin/relatorios' className='flex flex-col items-center gap-1 group'>
            <div className='bg-gray-700 group-hover:bg-yellow-400 rounded-xl w-12 h-12 flex items-center justify-center transition'>
              <BarChart2 size={20} className='text-white group-hover:text-gray-900 transition' />
            </div>
            <span className='text-gray-400 text-xs group-hover:text-yellow-400'>Relatorios</span>
          </Link>

          <button onClick={sair} className='flex flex-col items-center gap-1 group'>
            <div className='bg-gray-700 group-hover:bg-red-500 rounded-xl w-12 h-12 flex items-center justify-center transition'>
              <LogOut size={20} className='text-white transition' />
            </div>
            <span className='text-gray-400 text-xs group-hover:text-red-400'>Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className='flex-1 p-6 overflow-auto'>
        <h1 className='text-2xl font-bold text-gray-800 mb-6'>Painel de Chamados</h1>

        {carregando && <p className='text-gray-400 text-sm'>Carregando...</p>}

        <div className='flex flex-col gap-3'>
          {filtrados.map(c => (
            <Link
              key={c.id}
              href={'/admin/chamado/' + c.id}
              className='bg-white rounded-2xl shadow p-4 hover:shadow-md transition block'
            >
              <div className='flex justify-between items-start mb-2'>
                <span className='font-bold text-gray-800'>{c.codigo_unico}</span>
                <span className={urgenciaCor[c.urgencia] + ' text-xs px-2 py-1 rounded-full'}>
                  {urgenciaLabel[c.urgencia]}
                </span>
              </div>

              <p className='text-sm text-gray-600'>{c.tipo_problema}</p>
              <p className='text-xs text-gray-400 truncate mb-3'>{c.descricao}</p>

              <div className='flex justify-between items-center'>
                <span className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full'>
                  {statusLabel[c.status]}
                </span>
                <span className='text-xs text-gray-400'>
                  {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}