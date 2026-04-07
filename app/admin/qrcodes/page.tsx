'use client'
import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

const salas = [
  { id: 'sala-a', nome: 'Sala A' },
  { id: 'sala-b', nome: 'Sala B' },
  { id: 'sala-c', nome: 'Sala C' },
  { id: 'banheiro-masc', nome: 'Banheiro Masculino' },
  { id: 'banheiro-fem', nome: 'Banheiro Feminino' },
  { id: 'copa', nome: 'Copa' },
  { id: 'recepcao', nome: 'Recepcao' },
  { id: 'jardim', nome: 'Jardim' },
]

function PlacaQR({ sala }: { sala: { id: string, nome: string } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const url = typeof window !== 'undefined' ? window.location.origin + '/sala/' + sala.id : ''

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 160,
        margin: 1,
        color: { dark: '#101828', light: '#ffffff' }
      })
    }
  }, [url])

  return (
    <div className='bg-white border-4 border-gray-900 rounded-2xl p-6 flex flex-col items-center w-56 print-card'>
      <div className='flex items-center gap-2 mb-3'>
        <div className='bg-[#767171] rounded-lg w-7 h-7 flex items-center justify-center'>
          <span className='text-white font-black text-xs'>AS</span>
        </div>
        <span className='text-gray-800 font-bold text-sm'>Manutencao</span>
      </div>
      <canvas ref={canvasRef} className='rounded-lg mb-3' />
      <p className='text-xs text-gray-500 text-center mb-1'>Encontrou um problema?</p>
      <p className='text-sm font-bold text-gray-800 text-center'>{sala.nome}</p>
      <p className='text-xs text-gray-400 text-center mt-1'>Escaneie para abrir um chamado</p>
    </div>
  )
}

export default function QRCodesPage() {
  return (
    <main className='min-h-screen p-4 sm:p-6 max-w-4xl mx-auto'>
      <div className='flex justify-between items-center mb-8 print-hide flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>QR Codes das Salas</h1>
          <p className='text-sm text-gray-500'>Imprima e cole ao lado dos interruptores</p>
        </div>
        <button onClick={() => window.print()}
          className='bg-[#767171] hover:bg-[#5a5555] text-white font-bold px-6 py-3 rounded-xl transition'>
          Imprimir Todos
        </button>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
        {salas.map(s => <PlacaQR key={s.id} sala={s} />)}
      </div>
    </main>
  )
}
