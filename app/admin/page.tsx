'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { QrCode, BarChart2, LogOut, Wrench } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

export default function AdminPage() {
  const router = useRouter()

  // ⭐ CORREÇÃO REAL AQUI
  const [chamados, setChamados] = useState<Array<Chamado>>([])
  const [carregando, setCarregando] = useState<boolean>(true)

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

    const { data, error } = await supabase
      .from('chamados')
      .select('*')
      .order('criado_em', { ascending: false })

    if (!error && data) {
      // ⭐ CAST FINAL QUE REMOVE O NEVER[]
      setChamados(data as unknown as Chamado[])
    }

    setCarregando(false)
  }

  async function sair() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const emAberto = chamados.filter(c => c.status !== 'resolvido').length
  const muitoAlta = chamados.filter(c => c.urgencia === 'muito_alta' && c.status !== 'resolvido').length

  return (
    <main className='min-h-screen bg-gray-50 flex'>

      <aside className='w-20 bg-gray-900 flex flex-col items-center justify-between py-6'>
        <div className='flex flex-col items-center gap-1'>
          <div className='bg-yellow-400 rounded-xl w-12 h-12 flex items-center justify-center'>
            <Wrench size={22} className='text-gray-900' />
          </div>
          <span className='text-white text-xs font-bold mt-1'>A.S</span>
        </div>

        <div className='flex flex-col items-center gap-6'>
          <Link href='/admin/qrcodes' className='flex flex-col items-center gap-1'>
            <QrCode size={20} className='text-white'/>
            <span className='text-gray-400 text-xs'>QR Codes</span>
          </Link>

          <Link href='/admin/relatorios' className='flex flex-col items-center gap-1'>
            <BarChart2 size={20} className='text-white'/>
            <span className='text-gray-400 text-xs'>Relatorios</span>
          </Link>

          <button onClick={sair} className='flex flex-col items-center gap-1'>
            <LogOut size={20} className='text-white'/>
            <span className='text-gray-400 text-xs'>Sair</span>
          </button>
        </div>
      </aside>

      <div className='flex-1 p-6'>
        <h1 className='text-2xl font-bold mb-6'>Relatórios</h1>

        <div className='grid grid-cols-3 gap-4'>
          <div className='bg-white p-5 rounded-xl shadow'>
            <p>Total</p>
            <h2 className='text-3xl font-bold'>{chamados.length}</h2>
          </div>

          <div className='bg-white p-5 rounded-xl shadow'>
            <p>Em Aberto</p>
            <h2 className='text-3xl font-bold text-yellow-500'>{emAberto}</h2>
          </div>

          <div className='bg-white p-5 rounded-xl shadow'>
            <p>Muito Urgentes</p>
            <h2 className='text-3xl font-bold text-red-500'>{muitoAlta}</h2>
          </div>
        </div>

        {carregando && <p className='mt-6'>Carregando...</p>}
      </div>
    </main>
  )
}
