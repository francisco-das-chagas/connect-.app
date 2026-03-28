'use client'

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex items-center justify-center p-8">
      {/* CORREÇÃO: Usando a tag de fechamento explícita </div> em vez de /> */}
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-3 border-white/10 border-t-accent-500`}
      ></div>
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        {/* CORREÇÃO: Usando a tag de fechamento explícita </div> em vez de /> */}
        <div className="w-10 h-10 animate-spin rounded-full border-3 border-white/10 border-t-accent-500 mx-auto mb-3"></div>
        <p className="text-sm text-silver/50">Carregando...</p>
      </div>
    </div>
  )
}
