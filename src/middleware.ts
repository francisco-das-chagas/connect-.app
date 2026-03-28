import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/request'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Forçamos o navegador a aceitar o JavaScript do Next.js
  response.headers.set(
    'Content-Security-Policy',
    "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
  )

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
