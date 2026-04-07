'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

function Confirmacao() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const codigo = searchParams.get('codigo')
  return (
    <main className='min-h-screen flex flex-col items-center justify-center p-6 text-center'>
      <div className='w-full max-w-sm'>
        <button onClick={() => router.back()} className='flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6'>
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>
      <div className='bg-green-100 rounded-full p-6 mb-6'>
        <span className='text-5xl'>✅</span>
      </div>
      <h1 className='text-2xl font-bold text-gray-800 mb-2'>Chamado enviado!</h1>
      <p className='text-gray-500 mb-8'>Guarde o codigo abaixo para acompanhar o andamento</p>
      <div className='bg-[#767171] rounded-2xl px-10 py-6 mb-8'>
        <p className='text-xs text-gray-200 uppercase tracking-wide mb-1'>Seu codigo</p>
        <p className='text-4xl font-black text-white'>{codigo}</p>
      </div>
      <Link href='/acompanhar' className='bg-gray-900 text-white font-semibold py-3 px-8 rounded-xl mb-4 hover:bg-gray-700 transition'>
        Acompanhar Chamado
      </Link>
      <Link href='/' className='text-gray-400 text-sm hover:text-gray-600'>
        Voltar ao inicio
      </Link>
    </main>
  )
}

export default function ConfirmacaoPage() {
  return (
    <Suspense fallback={<div className='flex items-center justify-center min-h-screen'>Carregando...</div>}>
      <Confirmacao />
    </Suspense>
  )
}
