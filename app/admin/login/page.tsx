'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  async function entrar() {
    setEntrando(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) { setErro('Email ou senha incorretos'); setEntrando(false); return }
    router.push('/admin')
  }

  return (
    <main className='min-h-screen flex items-center justify-center p-6'>
      <div className='bg-white rounded-2xl shadow p-8 w-full max-w-sm'>
        <h1 className='text-2xl font-bold text-gray-800 mb-1'>Painel ADM</h1>
        <p className='text-sm text-gray-500 mb-6'>Manutencao Predial</p>
        <div className='mb-4'>
          <label className='block text-sm font-semibold text-gray-700 mb-1'>Email</label>
          <input type='email' value={email} onChange={e => setEmail(e.target.value)}
            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#767171]'
            placeholder='seu@email.com' />
        </div>
        <div className='mb-6'>
          <label className='block text-sm font-semibold text-gray-700 mb-1'>Senha</label>
          <input type='password' value={senha} onChange={e => setSenha(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && entrar()}
            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#767171]'
            placeholder='••••••••' />
        </div>
        {erro && <p className='text-red-500 text-sm mb-4'>{erro}</p>}
        <button onClick={entrar} disabled={entrando}
          className='w-full bg-[#767171] hover:bg-[#5a5555] text-white font-bold py-3 rounded-xl transition disabled:opacity-50'>
          {entrando ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </main>
  )
}
