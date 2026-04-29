'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Bell } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Notificacao = {
  id: string
  titulo: string
  mensagem: string
  lido: boolean
  criado_em: string
}

export default function NotificacoesPage() {
  const router = useRouter()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (localStorage.getItem('admin_nivel') !== 'gestor') { router.push('/admin'); return }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/admin/login'); return }
      carregarNotificacoes()
    })
  }, [])

  async function carregarNotificacoes() {
    setCarregando(true)
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .order('criado_em', { ascending: false })
    setNotificacoes(data || [])
    setCarregando(false)
  }

  async function marcarComoLida(id: string) {
    await supabase.from('notificacoes').update({ lido: true }).eq('id', id)
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lido: true } : n))
  }

  return (
    <main className='min-h-screen p-4 sm:p-6 max-w-3xl mx-auto'>
      <button onClick={() => router.push('/admin')} className='flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4'>
        <ArrowLeft size={16} /> Voltar
      </button>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Notificacoes</h1>
          <p className='text-sm text-gray-500'>{notificacoes.length} notificacoes</p>
        </div>
      </div>

      {carregando && <p className='text-gray-400 text-sm'>Carregando...</p>}
      <div className='flex flex-col gap-3'>
        {notificacoes.map(n => (
          <div key={n.id} className={`bg-white rounded-2xl shadow p-4 ${!n.lido ? 'border-l-4 border-[#604404]' : ''}`}>
            <div className='flex justify-between items-start mb-2'>
              <h3 className='font-semibold text-gray-800'>{n.titulo}</h3>
              {!n.lido && (
                <button onClick={() => marcarComoLida(n.id)}
                  className='text-xs bg-[#604404] hover:bg-[#4a3203] text-white px-2 py-1 rounded-lg'>
                  Marcar como lida
                </button>
              )}
            </div>
            <p className='text-sm text-gray-600 mb-2'>{n.mensagem}</p>
            <p className='text-xs text-gray-400'>{new Date(n.criado_em).toLocaleString('pt-BR')}</p>
          </div>
        ))}
      </div>
    </main>
  )
}