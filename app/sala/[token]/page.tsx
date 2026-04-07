import Link from 'next/link'
import { Wrench, Search } from 'lucide-react'

interface Props {
  params: Promise<{ token: string }>
}

export default async function SalaPage({ params }: Props) {
  const { token } = await params
  const sala = token.replace(/-/g, ' ')

  return (
    <main className='min-h-screen flex bg-gray-50'>

      <aside className='w-20 bg-gray-900 flex flex-col items-center justify-between py-6 flex-shrink-0'>

        <Link href='/admin/login' className='flex flex-col items-center gap-1 group'>
          <div className='bg-yellow-400 group-hover:bg-yellow-500 rounded-xl w-12 h-12 flex items-center justify-center transition'>
            <Wrench size={24} className='text-gray-900' />
          </div>
          <span className='text-white text-xs font-bold mt-1'>A.S</span>
        </Link>

        <Link href='/acompanhar' className='flex flex-col items-center gap-1 group'>
          <div className='bg-gray-700 group-hover:bg-yellow-400 rounded-xl w-12 h-12 flex items-center justify-center transition'>
            <Search size={20} className='text-white group-hover:text-gray-900 transition' />
          </div>
          <span className='text-gray-400 text-xs group-hover:text-yellow-400 transition text-center leading-tight'>Acompanhar</span>
        </Link>

      </aside>

      <div className='flex-1 flex items-center justify-center p-6'>
        <div className='bg-white rounded-3xl shadow-lg w-full max-w-sm p-8 flex flex-col min-h-96'>

          <div className='mb-auto'>
            <p className='text-xs text-gray-400 uppercase tracking-wide mb-1'>Sistema de Chamados</p>
            <h1 className='text-xl font-bold text-gray-800 mb-4'>Manutencao Predial</h1>
            <div className='flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3'>
              <div className='w-2 h-2 rounded-full bg-yellow-400'></div>
              <div>
                <p className='text-xs text-gray-400'>Localizacao detectada</p>
                <p className='text-sm font-semibold text-gray-700 capitalize'>{sala}</p>
              </div>
            </div>
          </div>

          <div className='mt-8'>
            <Link
              href={'/novo-chamado?sala=' + token}
              className='block w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-2xl text-center text-base transition'
            >
              Novo Chamado
            </Link>
            <p className='text-xs text-gray-400 text-center mt-4'>Nenhum dado pessoal e armazenado</p>
          </div>

        </div>
      </div>

    </main>
  )
}
