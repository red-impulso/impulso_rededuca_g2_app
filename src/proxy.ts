import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const RUTA_INGRESAR = "/ingresar";

// El "portero": antes de abrir cualquier página se fija si hay sesión.
// Sin sesión → a /ingresar. Con sesión y en /ingresar → a /inicio.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let hayUsuario = false;

  if (url && anonKey) {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    hayUsuario = data.user !== null;
  }

  const enIngresar = request.nextUrl.pathname === RUTA_INGRESAR;

  if (!hayUsuario && !enIngresar) {
    return NextResponse.redirect(new URL(RUTA_INGRESAR, request.url));
  }

  if (hayUsuario && enIngresar) {
    return NextResponse.redirect(new URL("/inicio", request.url));
  }

  return response;
}

export const config = {
  // Todo menos los archivos internos de Next y las imágenes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
