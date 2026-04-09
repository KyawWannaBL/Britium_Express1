import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js 16 requires the function name to match 'proxy' 
 * when using the proxy.ts convention.
 */
export async function proxy(request: NextRequest) {
  // Add a simple log to verify the proxy is active during the build
  console.log("Britium Express: Proxying request for", request.nextUrl.pathname);
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
