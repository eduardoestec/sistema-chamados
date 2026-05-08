'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { ArrowLeft, Plus, QrCode, Trash2, X } from 'lucide-react'

function ModalQR({ sala, onFechar }: { sala: any, onFechar: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const url = window.location.origin + '/sala/' + sala.qrcode_token
    QRCode.toCanvas(canvasRef.current, url, {
      width: 200,
      margin: 2,
      color: { dark: '#101828', light: '#ffffff' }
    })
  }, [sala])

  return (
    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs flex flex-col items-center'>
        <div className='flex justify-between items-center w-full mb-4'>
          <h2 className='font-bold text-gray-800'>{sala.nome}</h2>
          <button onClick={onFechar} className='text-gray-400 hover:text-gray-600'><X size={20} /></button>
        </div>
        <canvas ref={canvasRef} className='rounded-lg mb-3' />
        {sala.localizacao && <p className='text-xs text-gray-500 text-center'>{sala.localizacao}</p>}
      </div>
    </div>
  )
}

function ModalNovaSala({ onSalvar, onFechar }: { onSalvar: (nome: string, localizacao: string) => void, onFechar: () => void }) {
  const [nome, setNome] = useState('')
  const [localizacao, setLocalizacao] = useState('')

  return (
    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='font-bold text-gray-800'>Nova Sala</h2>
          <button onClick={onFechar} className='text-gray-400 hover:text-gray-600'><X size={20} /></button>
        </div>
        <div className='mb-4'>
          <label className='block text-sm font-semibold text-gray-700 mb-1'>Nome</label>
          <input value={nome} onChange={e => setNome(e.target.value)}
            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#604404]'
            placeholder='Ex: Sala de Reuniao' />
        </div>
        <div className='mb-6'>
          <label className='block text-sm font-semibold text-gray-700 mb-1'>Localizacao</label>
          <input value={localizacao} onChange={e => setLocalizacao(e.target.value)}
            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#604404]'
            placeholder='Ex: 2° andar, bloco B' />
        </div>
        <button onClick={() => nome.trim() && onSalvar(nome.trim(), localizacao.trim())}
          className='w-full bg-[#604404] hover:bg-[#4a3203] text-white font-bold py-3 rounded-xl transition'>
          Criar Sala
        </button>
      </div>
    </div>
  )
}

export default function SalasPage() {
  const router = useRouter()
  const [salas, setSalas] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalNova, setModalNova] = useState(false)
  const [salaQR, setSalaQR] = useState<any>(null)

  useEffect(() => {
    if (!localStorage.getItem('admin_id')) { router.push('/admin/login'); return }
    carregarSalas()
  }, [])

  async function carregarSalas() {
    setCarregando(true)
    const res = await fetch('/api/salas?order=criado_em')
    if (!res.ok) { setCarregando(false); return }
    const data = await res.json()
    setSalas(data)
    setCarregando(false)
  }

  async function criarSala(nome: string, localizacao: string) {
    await fetch('/api/salas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, localizacao })
    })
    setModalNova(false)
    carregarSalas()
  }

  async function apagarSala(id: string) {
    if (!confirm('Tem certeza que deseja apagar esta sala?')) return
    const res = await fetch(`/api/salas/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      alert(data.erro || 'Erro ao apagar sala')
      return
    }
    carregarSalas()
  }

  return (
    <main className='min-h-screen p-4 sm:p-6 max-w-2xl mx-auto'>
      <button onClick={() => router.push('/admin')} className='flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4'>
        <ArrowLeft size={16} /> Voltar
      </button>
      <div className='flex justify-between items-center mb-6 flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Gestao de Salas</h1>
          <p className='text-sm text-gray-500'>{salas.length} salas cadastradas</p>
        </div>
        <button onClick={() => setModalNova(true)}
          className='flex items-center gap-2 bg-[#604404] hover:bg-[#4a3203] text-white font-bold px-4 py-2 rounded-xl transition'>
          <Plus size={16} /> Nova Sala
        </button>
      </div>

      {carregando && <p className='text-gray-400 text-sm'>Carregando...</p>}
      <div className='flex flex-col gap-3'>
        {salas.map(s => (
          <div key={s.id} className='bg-white rounded-2xl shadow p-4 flex items-center justify-between gap-3 flex-wrap'>
            <div>
              <p className='font-semibold text-gray-800'>{s.nome}</p>
              {s.localizacao && <p className='text-xs text-gray-400 mt-0.5'>{s.localizacao}</p>}
            </div>
            <div className='flex gap-2 flex-shrink-0'>
              <button onClick={() => setSalaQR(s)}
                className='flex items-center gap-1 text-sm text-gray-600 hover:text-[#604404] border border-gray-200 px-3 py-1.5 rounded-lg transition'>
                <QrCode size={15} /> QR Code
              </button>
              <button onClick={() => apagarSala(s.id)}
                className='flex items-center gap-1 text-sm text-red-500 hover:text-red-700 border border-red-100 px-3 py-1.5 rounded-lg transition'>
                <Trash2 size={15} /> Apagar
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalNova && <ModalNovaSala onSalvar={criarSala} onFechar={() => setModalNova(false)} />}
      {salaQR && <ModalQR sala={salaQR} onFechar={() => setSalaQR(null)} />}
    </main>
  )
}
