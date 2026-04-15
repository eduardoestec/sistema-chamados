'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import QRCode from 'qrcode'
import { Plus, Trash2, X, ArrowLeft } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
          <div className='bg-[#767171] rounded-lg w-7 h-7 flex items-center justify-center'>
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
            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#767171]'
            placeholder='Ex: Sala de Reuniao'
          />
        </div>
        <div className='mb-6'>
          <label className='block text-sm font-semibold text-gray-700 mb-1'>Localizacao</label>
          <input
            value={localizacao}
            onChange={e => setLocalizacao(e.target.value)}
            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#767171]'
            placeholder='Ex: 2° andar, bloco B'
          />
        </div>
        {erro && <p className='text-red-500 text-sm mb-4'>{erro}</p>}
        <button
          onClick={handleConfirmar}
          disabled={salvando || !nome.trim()}
          className='w-full bg-[#767171] hover:bg-[#5a5555] text-white font-bold py-3 rounded-xl transition disabled:opacity-50'
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

  useEffect(() => {
    if (localStorage.getItem('admin_nivel') !== 'gestor') { router.push('/admin'); return }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push('/admin/login'); return }
      carregarSalas()
    })
  }, [])

  async function carregarSalas() {
    setCarregando(true)
    const { data } = await supabase.from('salas').select('*').order('nome')
    setSalas(data || [])
    setCarregando(false)
  }

  async function criarSala(nome: string, localizacao: string): Promise<string | null> {
    // Verificar duplicatas
    const { data: existente } = await supabase
      .from('salas')
      .select('id')
      .ilike('nome', nome)
      .ilike('localizacao', localizacao)
      .limit(1)
    if (existente && existente.length > 0) {
      return 'Já existe uma sala com este nome e localização'
    }

    const token = nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
    const { error } = await supabase.from('salas').insert({ nome, localizacao, qrcode_token: token })
    if (error) return error.message
    setModalNova(false)
    carregarSalas()
    return null
  }

  async function excluirSala(id: string) {
    await supabase.from('salas').delete().eq('id', id)
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
            className='flex items-center gap-2 border border-gray-200 hover:border-[#767171] text-gray-700 font-bold px-4 py-3 rounded-xl transition'
          >
            <Plus size={16} /> Nova Sala
          </button>
          <button
            onClick={() => window.print()}
            className='bg-[#767171] hover:bg-[#5a5555] text-white font-bold px-6 py-3 rounded-xl transition'
          >
            Imprimir Todos
          </button>
        </div>
      </div>

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
