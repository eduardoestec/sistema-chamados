'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

type Chamado = {
  id: string
  codigo_unico: string
  descricao: string
  tipo_problema: string
  urgencia: 'baixa' | 'media' | 'alta' | 'muito_alta'
  status: 'enviado' | 'recebido' | 'em_analise' | 'em_andamento' | 'resolvido'
  criado_em: string
  atualizado_em?: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const statusLabel: Record<string, string> = {
  enviado: 'Enviado',
  recebido: 'Recebido',
  em_analise: 'Em Analise',
  em_andamento: 'Em Andamento',
  resolvido: 'Resolvido'
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

    const { data } = await supabase
      .from('chamados')
      .select('*')
      .order('criado_em', { ascending: false })

    setChamados((data ?? []) as Chamado[])
    setCarregando(false)
  }

  if (carregando) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        Carregando chamados...
      </div>
    )
  }

  return (
    <main className='min-h-screen p-6 max-w-3xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Chamados</h1>

      <div className='flex flex-col gap-4'>
        {chamados.map(chamado => (
          <div
            key={chamado.id}
            onClick={() => router.push(`/admin/${chamado.id}`)}
            className='bg-white rounded-2xl shadow p-5 cursor-pointer hover:shadow-lg transition'
          >
            <div className='flex justify-between items-center mb-2'>
              <span className='font-bold text-gray-800'>
                {chamado.codigo_unico}
              </span>

              <span className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full'>
                {urgenciaLabel[chamado.urgencia]}
              </span>
            </div>

            <p className='text-sm font-semibold text-gray-700'>
              {chamado.tipo_problema}
            </p>

            <p className='text-sm text-gray-500 line-clamp-2 mb-2'>
              {chamado.descricao}
            </p>

            <div className='flex justify-between items-center'>
              <span className='text-xs text-gray-400'>
                {new Date(chamado.criado_em).toLocaleString('pt-BR')}
              </span>

              <span className='text-xs font-semibold text-yellow-600'>
                {statusLabel[chamado.status]}
              </span>
            </div>
          </div>
        ))}

        {chamados.length === 0 && (
          <div className='text-center text-gray-500 mt-10'>
            Nenhum chamado encontrado
          </div>
        )}
      </div>
    </main>
  )
}
