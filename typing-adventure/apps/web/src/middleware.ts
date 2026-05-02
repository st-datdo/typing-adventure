export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: ['/friends/:path*', '/admin/:path*', '/lobby', '/race/:path*'],
}
