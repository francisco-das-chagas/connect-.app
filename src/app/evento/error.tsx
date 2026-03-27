'use client';

export default function EventoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="text-center">
        <span className="text-5xl block mb-4">⚠️</span>
        <h1 className="text-xl font-bold text-white mb-2">Algo deu errado</h1>
        <p className="text-sm text-silver/50 mb-6">
          Ocorreu um erro ao carregar esta pagina.
        </p>
        <button onClick={reset} className="btn-primary">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
