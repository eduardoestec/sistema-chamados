import { Suspense } from 'react'
import FormularioChamado from './FormularioChamado'

export default function NovoChamadoPage() {
  return (
    <Suspense fallback={<div className='flex items-center justify-center min-h-screen'>Carregando...</div>}>
      <FormularioChamado />
    </Suspense>
  )
}