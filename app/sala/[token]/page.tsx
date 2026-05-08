import Link from 'next/link'
import Image from 'next/image'
import { Wrench, Search, MapPin } from 'lucide-react'
import { queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ token: string }>
}

export default async function SalaPage({ params }: Props) {
  const { token } = await params

  const sala = await queryOne<any>(
    'SELECT * FROM salas WHERE qrcode_token = $1',
    [token]
  )

  return (
    <main className='min-h-screen bg-[#f8f7f7] flex'>

      <aside className='w-20 bg-[#2c2c2c] flex flex-col items-center justify-between py-6 flex-shrink-0'>

        <Link href='/admin/login' className='flex flex-col items-center gap-1 group'>
          <div className='bg-[#604404] group-hover:bg-[#4a3203] rounded-xl w-12 h-12 flex items-center justify-center transition-all duration-200'>
            <Wrench size={24} className='text-white' />
          </div>
          <span className='text-white text-xs font-bold mt-1'>Admin</span>
        </Link>

        <Link href='/acompanhar' className='flex flex-col items-center gap-1 group'>
          <div className='bg-gray-700 group-hover:bg-[#604404] rounded-xl w-12 h-12 flex items-center justify-center transition-all duration-200'>
            <Search size={20} className='text-white transition-all duration-200' />
          </div>
          <span className='text-gray-400 text-xs group-hover:text-[#604404] transition-all duration-200 text-center leading-tight'>Acompanhar</span>
        </Link>

      </aside>

      <div className='flex-1 flex items-center justify-center p-6'>
        <div className='bg-white rounded-xl shadow-sm w-full max-w-md p-8 flex flex-col min-h-96'>

          <div className='mb-auto'>
            <div className='flex justify-center mb-6'>
              <Image
                src='/AS - 350x350.png'
                alt='Logo'
                width={120}
                height={120}
                className='rounded-lg'
              />
            </div>

            <div className='text-center mb-6'>
              <h1 className='text-2xl font-bold text-[#2c2c2c] tracking-tight mb-2'>Sistema de Chamados</h1>
              <p className='text-sm text-[#6b7280]'>Manutenção Predial</p>
            </div>

            {sala ? (
              <div className='bg-[#fdf8f0] rounded-xl p-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-3 h-3 rounded-full bg-[#16a34a]'></div>
                  <div>
                    <p className='text-xs uppercase tracking-wider text-[#6b7280] mb-1'>Localização Detectada</p>
                    <p className='text-sm font-semibold text-[#1a1a1a]'>{sala.nome}</p>
                    {sala.localizacao && (
                      <div className='flex items-center gap-1 mt-1'>
                        <MapPin size={12} className='text-[#6b7280]' />
                        <p className='text-xs text-[#6b7280]'>{sala.localizacao}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className='bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-xl p-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-3 h-3 rounded-full bg-[#dc2626]'></div>
                  <p className='text-sm text-[#dc2626]'>Sala não encontrada. QR Code inválido.</p>
                </div>
              </div>
            )}
          </div>

          <div className='mt-8'>
            {sala ? (
              <Link
                href={'/novo-chamado?sala_id=' + sala.id + '&sala_nome=' + encodeURIComponent(sala.nome)}
                className='block w-full bg-[#604404] hover:bg-[#4a3203] text-white font-medium py-4 rounded-lg text-center text-base transition-all duration-200'
              >
                Novo Chamado
              </Link>
            ) : (
              <button disabled className='block w-full bg-gray-300 text-gray-500 font-medium py-4 rounded-lg text-center text-base cursor-not-allowed'>
                Novo Chamado
              </button>
            )}
            <p className='text-xs text-[#6b7280] text-center mt-4'>Nenhum dado pessoal é armazenado</p>
          </div>

        </div>
      </div>

    </main>
  )
}
