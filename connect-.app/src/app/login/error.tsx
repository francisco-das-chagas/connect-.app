'use client';
export default function LoginError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#030816] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-white text-lg font-semibold mb-2">Erro no Login</h2>
        <p className="text-gray-400 text-sm mb-6">{error.message || 'Ocorreu um erro inesperado.'}</p>
        <button onClick={reset} className="px-6 py-3 bg-cyan-500 text-black font-semibold rounded-xl hover:bg-cyan-400 transition-colors">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
