'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { Plus, Trash2, X, ArrowLeft } from 'lucide-react'

type Sala = { id: string; nome: string; localizacao: string; qrcode_token: string }

function PlacaQR({ sala, onExcluir }: { sala: Sala; onExcluir: (id: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const url = window.location.origin + '/sala/' + sala.qrcode_token
    QRCode.toCanvas(canvasRef.current, url, {
      width: 160,
      margin: 1,
      color: { dark: '#101828', light: '#ffffff' }
    })
  }, [sala.qrcode_token])

  function confirmarExclusao() {
    if (confirm('Tem certeza que deseja excluir a sala "' + sala.nome + '"?')) {
      onExcluir(sala.id)
    }
  }

  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='bg-white border-4 border-gray-900 rounded-2xl p-6 flex flex-col items-center w-56 print-card'>
        <div className='flex items-center gap-2 mb-3'>
          <div className='bg-[#604404] rounded-lg w-7 h-7 flex items-center justify-center'>
            <span className='text-white font-black text-xs'>AS</span>
          </div>
          <span className='text-gray-800 font-bold text-sm'>Manutencao</span>
        </div>
        <canvas ref={canvasRef} className='rounded-lg mb-3' />
        <p className='text-xs text-gray-500 text-center mb-1'>Encontrou um problema?</p>
        <p className='text-sm font-bold text-gray-800 text-center'>{sala.nome}</p>
        {sala.localizacao && (
          <p className='text-xs text-gray-400 text-center mt-0.5'>{sala.localizacao}</p>
        )}
        <p className='text-xs text-gray-400 text-center mt-1'>ID: {sala.qrcode_token.substring(0, 8)}</p>
        <p className='text-xs text-gray-400 text-center mt-1'>Escaneie para abrir um chamado</p>
      </div>
      <button
        onClick={confirmarExclusao}
        className='print-hide flex items-center gap-1 text-sm text-red-500 hover:text-red-700 border border-red-100 px-3 py-1.5 rounded-lg transition'
      >
        <Trash2 size={14} /> Excluir
      </button>
    </div>
  )
}

function ModalNovaSala({ onSalvar, onFechar }: { onSalvar: (nome: string, localizacao: string) => Promise<string | null>; onFechar: () => void }) {
  const [nome, setNome] = useState('')
  const [localizacao, setLocalizacao] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function handleConfirmar() {
    if (!nome.trim()) return
    setSalvando(true)
    setErro('')
    const erroMsg = await onSalvar(nome.trim(), localizacao.trim())
    if (erroMsg) { setErro(erroMsg); setSalvando(false) }
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='font-bold text-gray-800'>Nova Sala</h2>
          <button onClick={onFechar} className='text-gray-400 hover:text-gray-600'><X size={20} /></button>
        </div>
        <div className='mb-4'>
          <label className='block text-sm font-semibold text-gray-700 mb-1'>Nome</label>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#604404]'
            placeholder='Ex: Sala de Reuniao'
          />
        </div>
        <div className='mb-6'>
          <label className='block text-sm font-semibold text-gray-700 mb-1'>Localizacao</label>
          <input
            value={localizacao}
            onChange={e => setLocalizacao(e.target.value)}
            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#604404]'
            placeholder='Ex: 2° andar, bloco B'
          />
        </div>
        {erro && <p className='text-red-500 text-sm mb-4'>{erro}</p>}
        <button
          onClick={handleConfirmar}
          disabled={salvando || !nome.trim()}
          className='w-full bg-[#604404] hover:bg-[#4a3203] text-white font-bold py-3 rounded-xl transition disabled:opacity-50'
        >
          {salvando ? 'Criando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  )
}

export default function QRCodesPage() {
  const router = useRouter()
  const [salas, setSalas] = useState<Sala[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalNova, setModalNova] = useState(false)
  const [erroExclusao, setErroExclusao] = useState('')

  useEffect(() => {
    if (localStorage.getItem('admin_nivel') !== 'gestor') { router.push('/admin'); return }
    if (!localStorage.getItem('admin_id')) { router.push('/admin/login'); return }
    carregarSalas()
  }, [])

  async function carregarSalas() {
    setCarregando(true)
    const res = await fetch('/api/salas')
    if (!res.ok) { setCarregando(false); return }
    const data = await res.json()
    setSalas(data)
    setCarregando(false)
  }

  async function criarSala(nome: string, localizacao: string): Promise<string | null> {
    const res = await fetch('/api/salas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, localizacao })
    })
    const data = await res.json()
    if (!res.ok) return data.erro || 'Erro ao criar sala'
    setModalNova(false)
    carregarSalas()
    return null
  }

  function mostrarErro(msg: string) {
    setErroExclusao(msg)
    setTimeout(() => setErroExclusao(''), 5000)
  }

  async function excluirSala(id: string) {
    const res = await fetch(`/api/salas/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { mostrarErro(data.erro || 'Erro ao excluir sala'); return }
    carregarSalas()
  }

  return (
    <main className='min-h-screen p-4 sm:p-6 max-w-4xl mx-auto'>
      <button onClick={() => router.push('/admin')} className='print-hide flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4'>
        <ArrowLeft size={16} /> Voltar
      </button>
      <div className='flex justify-between items-center mb-8 print-hide flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>QR Codes das Salas</h1>
          <p className='text-sm text-gray-500'>Imprima e cole ao lado dos interruptores</p>
        </div>
        <div className='flex gap-2'>
          <button
            onClick={() => setModalNova(true)}
            className='flex items-center gap-2 border border-gray-200 hover:border-[#604404] text-gray-700 font-bold px-4 py-3 rounded-xl transition'
          >
            <Plus size={16} /> Nova Sala
          </button>
          <button
            onClick={() => window.print()}
            className='bg-[#604404] hover:bg-[#4a3203] text-white font-bold px-6 py-3 rounded-xl transition'
          >
            Imprimir Todos
          </button>
        </div>
      </div>

      {erroExclusao && (
        <div className='print-hide mb-6 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl'>
          {erroExclusao}
        </div>
      )}

      {carregando && <p className='text-gray-400 text-sm'>Carregando...</p>}
      {!carregando && salas.length === 0 && (
        <p className='text-gray-400 text-sm'>Nenhuma sala cadastrada. Clique em "Nova Sala" para começar.</p>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-8'>
        {salas.map(s => (
          <PlacaQR key={s.id} sala={s} onExcluir={excluirSala} />
        ))}
      </div>

      {modalNova && <ModalNovaSala onSalvar={criarSala} onFechar={() => setModalNova(false)} />}
    </main>
  )
}
