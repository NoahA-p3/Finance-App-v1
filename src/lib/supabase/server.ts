import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In Server Components, cookies are read-only in Next.js 15.
          // Middleware/Route Handlers refresh auth cookies when needed.
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              (cookieStore as unknown as { set: (key: string, val: string, opts?: Record<string, unknown>) => void }).set(
                name,
                value,
                options
              );
            });
          } catch {
            // no-op for read-only contexts
          }
        }
      }
    }
  );
}
