'use client'
import { useRef, useState, useEffect } from 'react'
import { Pen, ArrowRight, Square, Type, Palette, Minus, Plus } from 'lucide-react'

type Ferramenta = 'caneta' | 'seta' | 'retangulo' | 'texto'

interface Props {
  onSalvar: (dataUrl: string) => void
  onCancelar: () => void
  imagemInicial: string
}

export default function EditorFoto({ onSalvar, onCancelar, imagemInicial }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ferramenta, setFerramenta] = useState<Ferramenta>('caneta')
  const [cor, setCor] = useState('#dc2626')
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
    { id: 'caneta', icon: Pen, label: 'Caneta' },
    { id: 'seta', icon: ArrowRight, label: 'Seta' },
    { id: 'retangulo', icon: Square, label: 'Retângulo' },
    { id: 'texto', icon: Type, label: 'Texto' },
  ]

  return (
    <div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-md w-full max-w-4xl flex flex-col max-h-screen overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-[#e5e3e3]'>
          <h2 className='text-lg font-semibold text-[#2c2c2c]'>Editor de Foto</h2>
          <button
            onClick={onCancelar}
            className='text-[#6b7280] hover:text-[#1a1a1a] transition-all duration-200 text-xl font-light'
          >
            ×
          </button>
        </div>

        {/* Toolbar */}
        <div className='flex items-center gap-4 p-6 border-b border-[#e5e3e3] bg-[#fdf8f0]'>
          <div className='flex items-center gap-2'>
            {ferramentas.map(f => {
              const Icon = f.icon
              return (
                <button
                  key={f.id}
                  onClick={() => setFerramenta(f.id as Ferramenta)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    ferramenta === f.id
                      ? 'bg-[#604404] text-white'
                      : 'bg-white text-[#1a1a1a] hover:bg-[#e5e3e3]'
                  }`}
                >
                  <Icon size={16} />
                  {f.label}
                </button>
              )
            })}
          </div>

          <div className='flex items-center gap-3 ml-auto'>
            <div className='flex items-center gap-2'>
              <Palette size={16} className='text-[#6b7280]' />
              <input
                type='color'
                value={cor}
                onChange={e => setCor(e.target.value)}
                className='w-8 h-8 rounded border border-[#e5e3e3] cursor-pointer'
              />
            </div>

            <div className='flex items-center gap-2'>
              <button
                onClick={() => setEspessura(Math.max(1, espessura - 1))}
                className='p-1 rounded bg-white hover:bg-[#e5e3e3] transition-all duration-200'
              >
                <Minus size={14} className='text-[#6b7280]' />
              </button>
              <span className='text-sm text-[#1a1a1a] font-medium min-w-8 text-center'>{espessura}</span>
              <button
                onClick={() => setEspessura(Math.min(20, espessura + 1))}
                className='p-1 rounded bg-white hover:bg-[#e5e3e3] transition-all duration-200'
              >
                <Plus size={14} className='text-[#6b7280]' />
              </button>
            </div>
          </div>
        </div>

        {/* Input de texto */}
        {ferramenta === 'texto' && posTexto && (
          <div className='flex gap-3 p-6 border-b border-[#e5e3e3]'>
            <input
              className='flex-1 border border-[#e5e3e3] rounded-lg px-4 py-3 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#604404] focus:ring-1 focus:ring-[#604404] transition-all duration-200'
              placeholder='Digite o texto...'
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && adicionarTexto()}
              autoFocus
            />
            <button
              onClick={adicionarTexto}
              className='bg-[#604404] hover:bg-[#4a3203] text-white font-medium px-6 py-3 rounded-lg transition-all duration-200'
            >
              Adicionar
            </button>
          </div>
        )}

        {/* Canvas */}
        <div className='p-6 overflow-auto flex-1 bg-[#f8f7f7]'>
          <div className='flex justify-center'>
            <canvas
              ref={canvasRef}
              style={{
                cursor: ferramenta === 'texto' ? 'text' : 'crosshair',
                maxWidth: '100%',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseDown={iniciarDesenho}
              onMouseMove={desenhar}
              onMouseUp={finalizarDesenho}
              onMouseLeave={finalizarDesenho}
              onTouchStart={iniciarDesenho}
              onTouchMove={desenhar}
              onTouchEnd={finalizarDesenho}
            />
          </div>
        </div>

        {/* Footer */}
        <div className='flex gap-3 p-6 border-t border-[#e5e3e3]'>
          <button
            onClick={onCancelar}
            className='flex-1 border border-[#e5e3e3] text-[#6b7280] hover:bg-[#fdf8f0] font-medium py-3 rounded-lg transition-all duration-200'
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            className='flex-1 bg-[#604404] hover:bg-[#4a3203] text-white font-medium py-3 rounded-lg transition-all duration-200'
          >
            Salvar Foto
          </button>
        </div>
      </div>
    </div>
  )
}
