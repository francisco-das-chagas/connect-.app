import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="text-center px-6">
        <span className="text-6xl block mb-4">🔍</span>
        <h1 className="text-2xl font-bold text-white mb-2">Pagina nao encontrada</h1>
        <p className="text-silver/50 mb-6">
          A pagina que voce esta procurando nao existe ou foi removida.
        </p>
        <Link href="/" className="btn-primary inline-block">
          Voltar ao inicio
        </Link>
      </div>
    </div>
  );
}
