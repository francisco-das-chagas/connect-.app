export const metadata = {
  title: 'Connect Valley 2026',
  description: 'O maior evento de inovação de Sobral'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#030816] text-white antialiased">
        {/* Aqui tiramos qualquer <AuthProvider> ou verificador de sessão que estava a bloquear o seu caminho */}
        {children}
      </body>
    </html>
  )
}
