# Environment Variables

## Daftar Variable

| Variable | Scope | Required | Description |
|---|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Yes | URL project Supabase. Dipakai browser client, server client, metadata preconnect, dan normalisasi environment. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Yes | Supabase anon key untuk browser/server client dengan RLS. Aman berada di client selama RLS benar. |
| `NEXT_PUBLIC_APP_NAME` | Public | No | Nama aplikasi. Default di code: `CatatZ`. |
| `NEXT_PUBLIC_APP_URL` | Public | Yes di production | Origin aplikasi. Dipakai untuk auth redirect dan metadata. Default development: `http://localhost:3000`. |
| `ALLOWED_DEV_ORIGINS` | Development | No | Daftar host development tambahan untuk local network/mobile testing dan allowed server action origins. Jangan set di production. |
| `AI_API_KEY` | Server-only | Yes untuk voice AI | API key Gemini. Dipakai di `src/configs/server-environment.ts` dan `src/lib/voice-parser.ts`. |
| `AI_MODEL` | Server-only | No | Model Gemini. Default: `gemini-2.5-flash-lite`. |
| `ANALYZE` | Build tooling | No | Jika `true`, mengaktifkan `@next/bundle-analyzer` di `next.config.ts`. |
| `NODE_ENV` | Runtime | Otomatis | Dipakai untuk menentukan production/development dan secure cookie. |

## Contoh `.env.example`

```env
# Supabase public browser-safe configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# AI - Gemini. Server-only; never expose with NEXT_PUBLIC_ prefix.
AI_API_KEY=
AI_MODEL=gemini-2.5-flash-lite

# App public configuration
NEXT_PUBLIC_APP_NAME=CatatZ
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Development only. Comma-separated host list for local network/mobile testing.
# Example: 192.168.1.10:3000,localhost:3000
# Do not set this in Vercel Production.
ALLOWED_DEV_ORIGINS=
```

## Public vs Server-only

Public variable:

- Berawalan `NEXT_PUBLIC_`.
- Bisa terbaca di browser bundle.
- Jangan pernah dipakai untuk secret.

Server-only variable:

- Tidak memakai prefix `NEXT_PUBLIC_`.
- Dipakai hanya dari Server Action, server module, atau build/runtime server.
- `AI_API_KEY` wajib tetap server-only.

## Catatan Keamanan

- Jangan commit `.env`, `.env.local`, key production, service role key, token OAuth, atau credential lain.
- `SUPABASE_SERVICE_ROLE_KEY` tidak digunakan di codebase saat ini dan tidak perlu ditambahkan kecuali ada kebutuhan server-only yang jelas.
- Jika suatu hari service role key diperlukan, jangan pernah memakai prefix `NEXT_PUBLIC_` dan jangan import module tersebut dari Client Component.
- Untuk production, `NEXT_PUBLIC_APP_URL` harus memakai domain production agar email verification/callback Supabase benar.
