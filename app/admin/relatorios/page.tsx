'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const CORES = ['#fac800', '#05df72', '#fb2c36', '#6a7282', '#364153', '#fefce8', '#e5e7eb']

export default function RelatoriosPage() {
  const router = useRouter()
  const [chamados, setChamados] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/admin/login'); return }
      carregarDados()
    })
  }, [])

  async function carregarDados() {
    const { data } = await supabase.from('chamados').select('*').order('criado_em', { ascending: false })
    setChamados(data || [])
    setCarregando(false)
  }

  function agrupar(campo) {
    const mapa = {}
    chamados.forEach(c => {
      mapa[c[campo]] = (mapa[c[campo]] || 0) + 1
    })
    return Object.entries(mapa).map(([name, value]) => ({ name, value }))
  }

  function exportarCSV() {
    const cabecalho = 'Codigo,Tipo,Urgencia,Status,Criado Em'
    const linhas = chamados.map(c =>
      [c.codigo_unico, c.tipo_problema, c.urgencia, c.status, new Date(c.criado_em).toLocaleString('pt-BR')].join(',')
    )
    const csv = [cabecalho, ...linhas].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'chamados.csv'
    a.click()
  }

  if (carregando) return <div className='flex items-center justify-center min-h-screen'>Carregando...</div>

  const porTipo = agrupar('tipo_problema')
  const porStatus = agrupar('status')
  const porUrgencia = agrupar('urgencia')

  return (
    <main className='min-h-screen p-6 max-w-4xl mx-auto'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Relatorios</h1>
          <p className='text-sm text-gray-500'>{chamados.length} chamados no total</p>
        </div>
        <div className='flex gap-2'>
          <button onClick={() => router.push('/admin')} className='text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-4 py-2 rounded-xl'>
            Voltar
          </button>
          <button onClick={exportarCSV} className='text-sm bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-xl'>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className='grid grid-cols-3 gap-4 mb-8'>
        <div className='bg-white rounded-2xl shadow p-5 text-center'>
          <p className='text-3xl font-black text-gray-800'>{chamados.length}</p>
          <p className='text-sm text-gray-500'>Total de Chamados</p>
        </div>
        <div className='bg-white rounded-2xl shadow p-5 text-center'>
          <p className='text-3xl font-black text-yellow-400'>{chamados.filter(c => c.status !== 'resolvido').length}</p>
          <p className='text-sm text-gray-500'>Em Aberto</p>
        </div>
        <div className='bg-white rounded-2xl shadow p-5 text-center'>
          <p className='text-3xl font-black text-green-400'>{chamados.filter(c => c.status === 'resolvido').length}</p>
          <p className='text-sm text-gray-500'>Resolvidos</p>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4 mb-8'>
        <div className='bg-white rounded-2xl shadow p-5'>
          <p className='text-sm font-semibold text-gray-700 mb-4'>Por Tipo de Problema</p>
          <ResponsiveContainer width='100%' height={220}>
            <PieChart>
              <Pie data={porTipo} dataKey='value' nameKey='name' cx='50%' cy='50%' outerRadius={80} label>
                {porTipo.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className='bg-white rounded-2xl shadow p-5'>
          <p className='text-sm font-semibold text-gray-700 mb-4'>Por Status</p>
          <ResponsiveContainer width='100%' height={220}>
            <BarChart data={porStatus}>
              <XAxis dataKey='name' tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey='value' fill='#fac800' />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className='bg-white rounded-2xl shadow p-5 mb-8'>
        <p className='text-sm font-semibold text-gray-700 mb-4'>Por Urgencia</p>
        <ResponsiveContainer width='100%' height={200}>
          <BarChart data={porUrgencia}>
            <XAxis dataKey='name' />
            <YAxis />
            <Tooltip />
            <Bar dataKey='value' fill='#364153' />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className='bg-white rounded-2xl shadow p-5'>
        <p className='text-sm font-semibold text-gray-700 mb-4'>Todos os Chamados</p>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left text-xs text-gray-400 border-b border-gray-100'>
                <th className='pb-2'>Codigo</th>
                <th className='pb-2'>Tipo</th>
                <th className='pb-2'>Urgencia</th>
                <th className='pb-2'>Status</th>
                <th className='pb-2'>Data</th>
              </tr>
            </thead>
            <tbody>
              {chamados.map(c => (
                <tr key={c.id} className='border-b border-gray-50 hover:bg-gray-50'>
                  <td className='py-2 font-medium'>{c.codigo_unico}</td>
                  <td className='py-2 text-gray-600'>{c.tipo_problema}</td>
                  <td className='py-2 text-gray-600'>{c.urgencia}</td>
                  <td className='py-2 text-gray-600'>{c.status}</td>
                  <td className='py-2 text-gray-400'>{new Date(c.criado_em).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}