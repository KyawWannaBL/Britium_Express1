

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    let email = identifier;

    // 1. Smart ID Lookup Logic
    // If it looks like an ID (contains a dash or is the Smart ID format)
    if (identifier.includes("-") || identifier.length > 8) {
      const { data: operator } = await supabase
        .from("operators")
        .select("email")
        .eq("display_id", identifier.toUpperCase().trim())
        .single();
      
      if (operator?.email) {
        email = operator.email;
      }
    }

    // 2. Perform the Login
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 3. Success - Redirect to Dashboard
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <form onSubmit={handleSignIn} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Britium Express Login</h1>
        
        {error && <div className="p-3 text-sm text-white bg-red-500 rounded">{error}</div>}

        <input
          type="text"
          placeholder="Email or Smart ID (e.g. H-SADM-0001)"
          className="w-full p-2 border rounded text-black"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
