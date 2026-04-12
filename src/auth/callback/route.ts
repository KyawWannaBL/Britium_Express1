import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // The 'next' parameter is where the user wants to go after the callback
  // In your screenshot, this is '/auth/must-change-password'
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();

    // Initialize Supabase Server Client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // The `remove` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      }
    );

    // Exchange the secure code for an active session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // If successful, redirect the user to the "Must Change Password" page
      return NextResponse.redirect(`${origin}${next}`);
    }
    
    // Log the error for debugging if the exchange fails
    console.error("Auth Callback Error:", error.message);
  }

  // If there's no code or an error occurred, send them back to sign-in with an error flag
  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth_callback_failed`);
}
