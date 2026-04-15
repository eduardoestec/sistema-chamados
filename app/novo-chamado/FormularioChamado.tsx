'use client'
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import EditorFoto from '@/components/EditorFoto'
import { Zap, Droplets, Lightbulb, Armchair, Monitor, Building2, HelpCircle, ArrowLeft, AlertTriangle, Minus, ChevronUp, ChevronDown } from 'lucide-react'

const tipoIcons: Record<string, React.ReactNode> = {
  Eletrica: <Zap size={18} />,
  Hidraulica: <Droplets size={18} />,
  Iluminacao: <Lightbulb size={18} />,
  Mobiliario: <Armchair size={18} />,
  Equipamentos: <Monitor size={18} />,
  Infraestrutura: <Building2 size={18} />,
  Outros: <HelpCircle size={18} />,
}

const urgenciaIcons: Record<string, React.ReactNode> = {
  baixa: <ChevronDown size={16} />,
  media: <Minus size={16} />,
  alta: <ChevronUp size={16} />,
  muito_alta: <AlertTriangle size={16} />,
}

export default function FormularioChamado() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const salaId = searchParams.get('sala_id') || null
  const sala = searchParams.get('sala_nome') || searchParams.get('sala') || 'desconhecida'
  const [tipo, setTipo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [urgencia, setUrgencia] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [fotoPreview, setFotoPreview] = useState('')
  const [fotoEditada, setFotoEditada] = useState('')
  const [abrirEditor, setAbrirEditor] = useState(false)

  const tipos = ['Eletrica','Hidraulica','Iluminacao','Mobiliario','Equipamentos','Infraestrutura','Outros']
  const urgencias = ['baixa','media','alta','muito_alta']
  const urgenciaLabel: Record<string, string> = { baixa: 'Baixa', media: 'Media', alta: 'Alta', muito_alta: 'Muito Alta' }

  function selecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setFotoPreview(reader.result as string)
      setFotoEditada('')
    }
    reader.readAsDataURL(file)
  }

  async function enviar() {
    if (!tipo || !descricao || !urgencia) { alert('Preencha todos os campos'); return }
    setEnviando(true)
    try {
      const res = await fetch('/api/chamados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sala_id: salaId, sala_nome: sala, tipo_problema: tipo, descricao, urgencia, foto: fotoEditada || fotoPreview || null })
      })
      const data = await res.json()
      if (data.codigo_unico) {
        router.push('/confirmacao?codigo=' + data.codigo_unico)
      } else { alert('Erro ao enviar. Tente novamente.') }
    } catch { alert('Erro ao enviar. Tente novamente.') }
    finally { setEnviando(false) }
  }

  return (
    <main className='min-h-screen bg-[#f8f7f7] p-6'>
      <div className='max-w-lg mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <button onClick={() => router.back()} className='flex items-center gap-2 text-[#6b7280] hover:text-[#1a1a1a] transition-all duration-200'>
            <ArrowLeft size={20} />
            <span className='text-sm font-medium'>Voltar</span>
          </button>
          <div className='bg-[#767171] rounded-xl w-12 h-12 flex items-center justify-center'>
            <span className='text-white font-black text-lg'>AS</span>
          </div>
        </div>

        <h1 className='text-2xl font-bold text-[#2c2c2c] tracking-tight mb-2'>Novo Chamado</h1>
        <p className='text-sm text-[#6b7280] mb-8'>Sala: {sala}</p>

        {/* Tipo de Problema */}
        <div className='bg-white rounded-xl shadow-sm p-6 mb-6'>
          <h2 className='text-xs uppercase tracking-wider text-[#6b7280] mb-4'>Tipo de Problema</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {tipos.map(t => (
              <button key={t} onClick={() => setTipo(t)}
                className={`flex items-center gap-3 py-4 px-4 rounded-lg border text-sm font-medium transition-all duration-200 min-h-[44px] cursor-pointer relative z-10 ${tipo === t ? 'bg-[#767171] border-[#767171] text-white' : 'bg-white border-[#e5e3e3] text-[#1a1a1a] hover:border-[#767171]'}`}>
                <span className={tipo === t ? 'text-white' : 'text-[#6b7280]'}>{tipoIcons[t]}</span>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Descrição */}
        <div className='bg-white rounded-xl shadow-sm p-6 mb-6'>
          <label className='block text-xs uppercase tracking-wider text-[#6b7280] mb-3'>Descrição</label>
          <textarea
            className='w-full border border-[#e5e3e3] rounded-lg p-4 text-sm text-[#1a1a1a] min-h-32 focus:outline-none focus:border-[#767171] focus:ring-1 focus:ring-[#767171] transition-all duration-200'
            placeholder='Descreva o problema detalhadamente...'
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
          />
        </div>

        {/* Urgência */}
        <div className='bg-white rounded-xl shadow-sm p-6 mb-6'>
          <h2 className='text-xs uppercase tracking-wider text-[#6b7280] mb-4'>Urgência</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {urgencias.map(u => {
              const cores: Record<string, string> = {
                baixa: urgencia === u ? 'bg-white text-[#16a34a] border-[#16a34a]' : 'bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/20 hover:bg-[#16a34a]/20',
                media: urgencia === u ? 'bg-white text-[#d97706] border-[#d97706]' : 'bg-[#d97706]/10 text-[#d97706] border-[#d97706]/20 hover:bg-[#d97706]/20',
                alta: urgencia === u ? 'bg-white text-[#dc2626] border-[#dc2626]' : 'bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20 hover:bg-[#dc2626]/20',
                muito_alta: urgencia === u ? 'bg-white text-[#dc2626] border-[#dc2626]' : 'bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20 hover:bg-[#dc2626]/20'
              }
              return (
                <button key={u} onClick={() => setUrgencia(u)}
                  className={`flex items-center gap-3 py-4 px-4 rounded-lg border text-sm font-medium transition-all duration-200 min-h-[44px] cursor-pointer relative z-10 ${cores[u]}`}>
                  <span>{urgenciaIcons[u]}</span>
                  {urgenciaLabel[u]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Foto */}
        <div className='bg-white rounded-xl shadow-sm p-6 mb-8'>
          <label className='block text-xs uppercase tracking-wider text-[#6b7280] mb-3'>Foto (opcional)</label>
          <input
            type='file'
            accept='image/*'
            onChange={selecionarFoto}
            className='w-full border border-[#e5e3e3] rounded-lg p-4 text-sm text-[#6b7280] focus:outline-none focus:border-[#767171] focus:ring-1 focus:ring-[#767171] transition-all duration-200'
          />
          {(fotoEditada || fotoPreview) && (
            <div className='relative mt-4'>
              <img src={fotoEditada || fotoPreview} alt='Preview' className='w-full rounded-lg max-h-48 object-cover border border-[#e5e3e3]' />
              <button
                onClick={() => setAbrirEditor(true)}
                className='absolute bottom-3 right-3 bg-[#767171] hover:bg-[#5a5555] text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200'
              >
                Editar Foto
              </button>
            </div>
          )}
        </div>

        {/* Botão Enviar */}
        <button
          onClick={enviar}
          disabled={enviando}
          className='w-full bg-[#767171] hover:bg-[#5a5555] text-white font-medium py-4 rounded-lg text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] cursor-pointer relative z-10'
        >
          {enviando ? 'Enviando...' : 'Enviar Chamado'}
        </button>

        {abrirEditor && (fotoEditada || fotoPreview) && (
          <EditorFoto
            imagemInicial={fotoEditada || fotoPreview}
            onSalvar={dataUrl => { setFotoEditada(dataUrl); setAbrirEditor(false) }}
            onCancelar={() => setAbrirEditor(false)}
          />
        )}
      </div>
    </main>
  )
}
