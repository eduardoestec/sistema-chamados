'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'

function Confirmacao() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const codigo = searchParams?.get('codigo')
  return (
    <main className='min-h-screen bg-[#f8f7f7] flex flex-col items-center justify-center p-6 text-center'>
      <div className='w-full max-w-md'>
        {/* Header */}
        <div className='flex justify-start mb-8'>
          <button onClick={() => router.back()} className='flex items-center gap-2 text-[#6b7280] hover:text-[#1a1a1a] transition-all duration-200'>
            <ArrowLeft size={20} />
            <span className='text-sm font-medium'>Voltar</span>
          </button>
        </div>

        {/* Ícone de Check */}
        <div className='bg-[#16a34a] rounded-full p-6 mb-8 mx-auto w-fit'>
          <Check size={48} className='text-white' />
        </div>

        <h1 className='text-3xl font-bold text-[#2c2c2c] tracking-tight mb-4'>Chamado Enviado!</h1>
        <p className='text-[#6b7280] mb-8 max-w-sm mx-auto'>Guarde o código abaixo para acompanhar o andamento do seu chamado</p>

        {/* Código */}
        <div className='bg-white rounded-xl shadow-sm p-8 mb-8 border-2 border-[#604404]'>
          <p className='text-xs uppercase tracking-wider text-[#6b7280] mb-3'>Seu Código</p>
          <p className='text-4xl font-black text-[#2c2c2c] tracking-wider'>{codigo}</p>
        </div>

        {/* Botões */}
        <div className='space-y-4'>
          <Link
            href='/acompanhar'
            className='block w-full bg-[#604404] hover:bg-[#4a3203] text-white font-medium py-4 rounded-lg transition-all duration-200'
          >
            Acompanhar Chamado
          </Link>
          <Link
            href='/'
            className='block w-full border border-[#e5e3e3] text-[#6b7280] hover:bg-[#fdf8f0] font-medium py-4 rounded-lg transition-all duration-200'
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function ConfirmacaoPage() {
  return (
    <Suspense fallback={
      <div className='flex items-center justify-center min-h-screen bg-[#f8f7f7]'>
        <div className='text-center'>
          <div className='bg-[#604404] rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4'>
            <span className='text-white font-black text-xl'>AS</span>
          </div>
          <p className='text-[#6b7280]'>Carregando...</p>
        </div>
      </div>
    }>
      <Confirmacao />
    </Suspense>
  )
}
