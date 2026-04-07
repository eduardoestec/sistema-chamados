'use client'
import { useRef, useState, useEffect } from 'react'

type Ferramenta = 'caneta' | 'seta' | 'retangulo' | 'texto'

interface Props {
  onSalvar: (dataUrl: string) => void
  onCancelar: () => void
  imagemInicial: string
}

export default function EditorFoto({ onSalvar, onCancelar, imagemInicial }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ferramenta, setFerramenta] = useState<Ferramenta>('caneta')
  const [cor, setCor] = useState('#ff0000')
  const [espessura, setEspessura] = useState(3)
  const [desenhando, setDesenhando] = useState(false)
  const [inicio, setInicio] = useState({ x: 0, y: 0 })
  const [texto, setTexto] = useState('')
  const [posTexto, setPosTexto] = useState<{ x: number, y: number } | null>(null)
  const snapshotRef = useRef<ImageData | null>(null)
  const imagemRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width > 800 ? 800 : img.width
      canvas.height = img.width > 800 ? (img.height * 800 / img.width) : img.height
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      imagemRef.current = img
    }
    img.src = imagemInicial
  }, [imagemInicial])

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  function iniciarDesenho(e: React.MouseEvent | React.TouchEvent) {
    if (ferramenta === 'texto') {
      setPosTexto(getPos(e))
      return
    }
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setInicio(getPos(e))
    setDesenhando(true)
  }

  function desenhar(e: React.MouseEvent | React.TouchEvent) {
    if (!desenhando) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.strokeStyle = cor
    ctx.lineWidth = espessura
    ctx.lineCap = 'round'
    if (ferramenta === 'caneta') {
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    } else {
      ctx.putImageData(snapshotRef.current!, 0, 0)
      ctx.beginPath()
      if (ferramenta === 'retangulo') {
        ctx.strokeRect(inicio.x, inicio.y, pos.x - inicio.x, pos.y - inicio.y)
      } else if (ferramenta === 'seta') {
        const dx = pos.x - inicio.x
        const dy = pos.y - inicio.y
        const angle = Math.atan2(dy, dx)
        const len = Math.sqrt(dx * dx + dy * dy)
        ctx.moveTo(inicio.x, inicio.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(pos.x, pos.y)
        ctx.lineTo(pos.x - 15 * Math.cos(angle - 0.4), pos.y - 15 * Math.sin(angle - 0.4))
        ctx.lineTo(pos.x - 15 * Math.cos(angle + 0.4), pos.y - 15 * Math.sin(angle + 0.4))
        ctx.closePath()
        ctx.fillStyle = cor
        ctx.fill()
      }
    }
  }

  function finalizarDesenho() {
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) ctx.beginPath()
    setDesenhando(false)
  }

  function adicionarTexto() {
    if (!posTexto || !texto) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = cor
    ctx.font = espessura * 6 + 'px Arial'
    ctx.fillText(texto, posTexto.x, posTexto.y)
    setTexto('')
    setPosTexto(null)
  }

  function salvar() {
    const dataUrl = canvasRef.current?.toDataURL('image/jpeg', 0.8)
    if (dataUrl) onSalvar(dataUrl)
  }

  const ferramentas = [
    { id: 'caneta', label: 'Caneta' },
    { id: 'seta', label: 'Seta' },
    { id: 'retangulo', label: 'Retangulo' },
    { id: 'texto', label: 'Texto' },
  ]

  return (
    <div className='fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-screen overflow-auto'>
        <div className='flex items-center justify-between p-4 border-b border-gray-100'>
          <h2 className='font-bold text-gray-800'>Editor de Foto</h2>
          <button onClick={onCancelar} className='text-gray-400 hover:text-gray-600 text-xl'>x</button>
        </div>
        <div className='flex gap-2 p-3 border-b border-gray-100 flex-wrap'>
          {ferramentas.map(f => (
            <button key={f.id} onClick={() => setFerramenta(f.id as Ferramenta)}
              className={ferramenta === f.id ? 'px-3 py-1 rounded-lg text-sm font-medium bg-[#767171] text-white' : 'px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-600'}>
              {f.label}
            </button>
          ))}
          <input type='color' value={cor} onChange={e => setCor(e.target.value)} className='w-8 h-8 rounded cursor-pointer' />
          <select value={espessura} onChange={e => setEspessura(Number(e.target.value))} className='border border-gray-200 rounded-lg px-2 text-sm'>
            <option value={2}>Fino</option>
            <option value={4}>Medio</option>
            <option value={8}>Grosso</option>
          </select>
        </div>
        {ferramenta === 'texto' && posTexto && (
          <div className='flex gap-2 p-3 border-b border-gray-100'>
            <input className='flex-1 border border-gray-200 rounded-lg px-3 py-1 text-sm' placeholder='Digite o texto...'
              value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => e.key === 'Enter' && adicionarTexto()} autoFocus />
            <button onClick={adicionarTexto} className='bg-[#767171] text-white font-bold px-4 rounded-lg text-sm'>OK</button>
          </div>
        )}
        <div className='p-4 overflow-auto flex-1'>
          <canvas ref={canvasRef} style={{ cursor: ferramenta === 'texto' ? 'text' : 'crosshair', maxWidth: '100%' }}
            onMouseDown={iniciarDesenho} onMouseMove={desenhar} onMouseUp={finalizarDesenho} onMouseLeave={finalizarDesenho}
            onTouchStart={iniciarDesenho} onTouchMove={desenhar} onTouchEnd={finalizarDesenho}
          />
        </div>
        <div className='flex gap-2 p-4 border-t border-gray-100'>
          <button onClick={onCancelar} className='flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl'>Cancelar</button>
          <button onClick={salvar} className='flex-1 bg-[#767171] hover:bg-[#5a5555] text-white font-bold py-3 rounded-xl'>Salvar Foto</button>
        </div>
      </div>
    </div>
  )
}
