'use client'
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import EditorFoto from '@/components/EditorFoto'

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
    <main className='min-h-screen p-6 max-w-lg mx-auto'>
      <h1 className='text-2xl font-bold text-gray-800 mb-1'>Novo Chamado</h1>
      <p className='text-sm text-gray-500 mb-6'>Sala: {sala}</p>

      <div className='mb-5'>
        <label className='block text-sm font-semibold text-gray-700 mb-2'>Tipo de Problema</label>
        <div className='grid grid-cols-2 gap-2'>
          {tipos.map(t => (
            <button key={t} onClick={() => setTipo(t)}
              className={tipo === t ? 'py-2 px-3 rounded-lg border text-sm font-medium bg-yellow-400 border-yellow-400 text-gray-900' : 'py-2 px-3 rounded-lg border text-sm font-medium bg-white border-gray-200 text-gray-600'}>
              {t}</button>
          ))}
        </div>
      </div>

      <div className='mb-5'>
        <label className='block text-sm font-semibold text-gray-700 mb-2'>Descricao</label>
        <textarea className='w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 min-h-28 focus:outline-none focus:border-yellow-400'
          placeholder='Descreva o problema...' value={descricao} onChange={e => setDescricao(e.target.value)} />
      </div>

      <div className='mb-5'>
        <label className='block text-sm font-semibold text-gray-700 mb-2'>Urgencia</label>
        <div className='grid grid-cols-2 gap-2'>
          {urgencias.map(u => (
            <button key={u} onClick={() => setUrgencia(u)}
              className={urgencia === u ? 'py-2 px-3 rounded-lg border text-sm font-medium bg-yellow-400 border-yellow-400 text-gray-900' : 'py-2 px-3 rounded-lg border text-sm font-medium bg-white border-gray-200 text-gray-600'}>
              {urgenciaLabel[u]}</button>
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
              className='absolute bottom-2 right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-lg'>
              Editar Foto
            </button>
          </div>
        )}
      </div>

      <button onClick={enviar} disabled={enviando}
        className='w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-xl text-lg transition disabled:opacity-50'>
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
