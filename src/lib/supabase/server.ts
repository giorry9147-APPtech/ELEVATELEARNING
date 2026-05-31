import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { config } from "@/lib/config";

/**
 * Supabase server-client (Server Components, Route Handlers, Server Actions).
 * Geeft `null` terug zonder keys, zodat aanroepers netjes kunnen terugvallen.
 *
 * `cookies()` is async in Next 16 — vandaar dat deze functie async is.
 */
export async function createClient() {
  if (!config.supabase.enabled) return null;

  const cookieStore = await cookies();

  return createServerClient(config.supabase.url, config.supabase.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll kan falen in een Server Component (read-only cookies);
          // dat is veilig te negeren wanneer er middleware/route-handler is.
        }
      },
    },
  });
}
