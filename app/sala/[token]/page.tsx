import Link from 'next/link'
import Image from 'next/image'
import { Wrench, Search } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  params: Promise<{ token: string }>
}

export default async function SalaPage({ params }: Props) {
  const { token } = await params

  const { data: sala } = await supabase
    .from('salas')
    .select('*')
    .eq('qrcode_token', token)
    .single()

  return (
    <main className='min-h-screen flex bg-gray-50'>

      <aside className='w-20 bg-gray-900 flex flex-col items-center justify-between py-6 flex-shrink-0'>

        <Link href='/admin/login' className='flex flex-col items-center gap-1 group'>
          <div className='bg-[#767171] group-hover:bg-[#5a5555] rounded-xl w-12 h-12 flex items-center justify-center transition'>
            <Wrench size={24} className='text-white' />
          </div>
          <span className='text-white text-xs font-bold mt-1'>Admin</span>
        </Link>

        <Link href='/acompanhar' className='flex flex-col items-center gap-1 group'>
          <div className='bg-gray-700 group-hover:bg-[#767171] rounded-xl w-12 h-12 flex items-center justify-center transition'>
            <Search size={20} className='text-white transition' />
          </div>
          <span className='text-gray-400 text-xs group-hover:text-[#767171] transition text-center leading-tight'>Acompanhar</span>
        </Link>

      </aside>

      <div className='flex-1 flex items-center justify-center p-4 sm:p-6'>
        <div className='bg-white rounded-3xl shadow-lg w-full max-w-sm p-8 flex flex-col min-h-96'>

          <div className='mb-auto'>
            <p className='text-xs text-gray-400 uppercase tracking-wide mb-1'>Sistema de Chamados</p>
            <h1 className='text-xl font-bold text-gray-800 mb-4'>Manutenção</h1>

            {sala ? (
              <div className='flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3'>
                <div className='w-2 h-2 rounded-full bg-[#767171]'></div>
                <div>
                  <p className='text-xs text-gray-400'>Localizacao detectada</p>
                  <p className='text-sm font-semibold text-gray-700'>{sala.nome}</p>
                  {sala.localizacao && (
                    <p className='text-xs text-gray-400 mt-0.5'>{sala.localizacao}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className='flex items-center gap-2 bg-red-50 rounded-xl px-4 py-3'>
                <div className='w-2 h-2 rounded-full bg-red-400'></div>
                <p className='text-sm text-red-500'>Sala não encontrada. QR Code inválido.</p>
              </div>
            )}
          </div>

          <div className='mt-8'>
            <div className='flex justify-center mb-6'>
              <Image
                src='/AS - 350x350.png'
                alt='Logo'
                width={120}
                height={120}
              />
            </div>

            {sala ? (
              <Link
                href={'/novo-chamado?sala_id=' + sala.id + '&sala_nome=' + encodeURIComponent(sala.nome)}
                className='block w-full bg-[#767171] hover:bg-[#5a5555] text-white font-bold py-4 rounded-2xl text-center text-base transition'
              >
                Novo Chamado
              </Link>
            ) : (
              <button disabled className='block w-full bg-gray-300 text-gray-500 font-bold py-4 rounded-2xl text-center text-base cursor-not-allowed'>
                Novo Chamado
              </button>
            )}
            <p className='text-xs text-gray-400 text-center mt-4'>Nenhum dado pessoal é armazenado</p>
          </div>

        </div>
      </div>

    </main>
  )
}
