'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  async function entrar() {
    setEntrando(true)
    setErro('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha })
    })
    const data = await res.json()
    if (!res.ok) { setErro(data.erro || 'Usuário ou senha incorretos'); setEntrando(false); return }
    localStorage.setItem('admin_id', data.id)
    localStorage.setItem('admin_nome', data.nome)
    localStorage.setItem('admin_nivel', data.nivel)
    router.push('/admin')
  }

  return (
    <main className='min-h-screen bg-[#f8f7f7] flex items-center justify-center p-6'>
      <div className='absolute top-6 left-6'>
        <Link href='/' className='flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors duration-200 text-sm font-medium'>
          <ArrowLeft size={18} />
          Voltar
        </Link>
      </div>
      <div className='bg-white rounded-xl shadow-sm p-8 w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='flex justify-center mb-4'>
            <Image
              src='/AS - 350x350.png'
              alt='Logo A.S Engenharia'
              width={100}
              height={100}
              className='rounded-lg'
            />
          </div>
          <h1 className='text-2xl font-bold text-[#2c2c2c] tracking-tight mb-2'>Painel Administrativo</h1>
          <p className='text-sm text-[#6b7280]'>Sistema de Chamados - Manutenção Predial</p>
        </div>

        <div className='space-y-6'>
          <div>
            <label className='block text-xs uppercase tracking-wider text-[#6b7280] mb-2'>Usuário</label>
            <div className='relative'>
              <User size={18} className='absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7280]' />
              <input
                type='text'
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                className='w-full border border-[#e5e3e3] rounded-lg pl-10 pr-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#604404] focus:ring-1 focus:ring-[#604404] transition-all duration-200'
                placeholder='nome.sobrenome'
              />
            </div>
          </div>

          <div>
            <label className='block text-xs uppercase tracking-wider text-[#6b7280] mb-2'>Senha</label>
            <div className='relative'>
              <Lock size={18} className='absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7280]' />
              <input
                type='password'
                value={senha}
                onChange={e => setSenha(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && entrar()}
                className='w-full border border-[#e5e3e3] rounded-lg pl-10 pr-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#604404] focus:ring-1 focus:ring-[#604404] transition-all duration-200'
                placeholder='••••••••'
              />
            </div>
          </div>

          {erro && (
            <div className='bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg p-3'>
              <p className='text-sm text-[#dc2626]'>{erro}</p>
            </div>
          )}

          <button
            onClick={entrar}
            disabled={entrando}
            className='w-full bg-[#604404] hover:bg-[#4a3203] text-white font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {entrando ? 'Entrando...' : 'Entrar'}
          </button>
        </div>

        <div className='mt-8 pt-6 border-t border-[#e5e3e3] text-center'>
          <p className='text-xs text-[#6b7280]'>Sistema de Chamados © A.S</p>
        </div>
      </div>
    </main>
  )
}
