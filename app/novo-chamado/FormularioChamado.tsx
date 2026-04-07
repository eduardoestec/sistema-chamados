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
  const sala = searchParams.get('sala') || 'desconhecida'
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
        body: JSON.stringify({ sala, tipo_problema: tipo, descricao, urgencia, foto: fotoEditada || fotoPreview || null })
      })
      const data = await res.json()
      if (data.codigo_unico) {
        router.push('/confirmacao?codigo=' + data.codigo_unico)
      } else { alert('Erro ao enviar. Tente novamente.') }
    } catch { alert('Erro ao enviar. Tente novamente.') }
    finally { setEnviando(false) }
  }

  return (
    <main className='min-h-screen p-4 sm:p-6 max-w-lg mx-auto'>
      <button onClick={() => router.back()} className='flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4'>
        <ArrowLeft size={16} /> Voltar
      </button>
      <h1 className='text-2xl font-bold text-gray-800 mb-1'>Novo Chamado</h1>
      <p className='text-sm text-gray-500 mb-6'>Sala: {sala}</p>

      <div className='mb-5'>
        <label className='block text-sm font-semibold text-gray-700 mb-2'>Tipo de Problema</label>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
          {tipos.map(t => (
            <button key={t} onClick={() => setTipo(t)}
              className={`flex items-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition ${tipo === t ? 'bg-[#767171] border-[#767171] text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              <span className={tipo === t ? 'text-white' : 'text-gray-400'}>{tipoIcons[t]}</span>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className='mb-5'>
        <label className='block text-sm font-semibold text-gray-700 mb-2'>Descricao</label>
        <textarea className='w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 min-h-28 focus:outline-none focus:border-[#767171]'
          placeholder='Descreva o problema...' value={descricao} onChange={e => setDescricao(e.target.value)} />
      </div>

      <div className='mb-5'>
        <label className='block text-sm font-semibold text-gray-700 mb-2'>Urgencia</label>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
          {urgencias.map(u => (
            <button key={u} onClick={() => setUrgencia(u)}
              className={`flex items-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition ${urgencia === u ? 'bg-[#767171] border-[#767171] text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              <span className={urgencia === u ? 'text-white' : 'text-gray-400'}>{urgenciaIcons[u]}</span>
              {urgenciaLabel[u]}
            </button>
          ))}
        </div>
      </div>

      <div className='mb-8'>
        <label className='block text-sm font-semibold text-gray-700 mb-2'>Foto (opcional)</label>
        <input type='file' accept='image/*' onChange={selecionarFoto}
          className='w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-600 mb-2' />
        {(fotoEditada || fotoPreview) && (
          <div className='relative mt-2'>
            <img src={fotoEditada || fotoPreview} alt='Preview' className='w-full rounded-xl max-h-48 object-cover' />
            <button onClick={() => setAbrirEditor(true)}
              className='absolute bottom-2 right-2 bg-[#767171] text-white text-xs font-bold px-3 py-1 rounded-lg'>
              Editar Foto
            </button>
          </div>
        )}
      </div>

      <button onClick={enviar} disabled={enviando}
        className='w-full bg-[#767171] hover:bg-[#5a5555] text-white font-bold py-4 rounded-xl text-lg transition disabled:opacity-50'>
        {enviando ? 'Enviando...' : 'Enviar Chamado'}
      </button>

      {abrirEditor && (fotoEditada || fotoPreview) && (
        <EditorFoto
          imagemInicial={fotoEditada || fotoPreview}
          onSalvar={dataUrl => { setFotoEditada(dataUrl); setAbrirEditor(false) }}
          onCancelar={() => setAbrirEditor(false)}
        />
      )}
    </main>
  )
}
