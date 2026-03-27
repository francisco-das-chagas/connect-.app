'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="text-center px-6">
        <span className="text-6xl block mb-4">⚠️</span>
        <h1 className="text-2xl font-bold text-white mb-2">Algo deu errado</h1>
        <p className="text-silver/50 mb-6">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        <button onClick={reset} className="btn-primary">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
