import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  
  // 1. Extract the key (Supabase uses 'token' or 'token_hash')
  const token = searchParams.get('token') || searchParams.get('token_hash')
  const type = searchParams.get('type')
  
  // 2. Define the luxury destination
  // If it's a recovery, send them to the Emerald Reset screen
  const next = type === 'recovery' ? '/auth/must-change-password' : '/dashboard'

  if (token) {
    // 3. Construct the bridge to /auth/callback
    const callbackUrl = new URL('/auth/callback', origin)
    callbackUrl.searchParams.set('code', token)
    callbackUrl.searchParams.set('next', next)
    
    // 4. SECURITY: If the redirect_to is doubled, this clean redirect fixes it
    return NextResponse.redirect(callbackUrl)
  }

  // Fallback for expired or broken links
  return NextResponse.redirect(`${origin}/auth/sign-in?error=Protocol_Handshake_Failed`)
}