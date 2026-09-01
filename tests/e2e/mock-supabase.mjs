import http from "node:http";

const host = "127.0.0.1";
const port = 55431;
const now = "2026-06-14T12:00:00.000Z";
const userId = "00000000-0000-4000-8000-000000000001";
const accountId = "00000000-0000-4000-8000-000000000010";
const categoryId = "00000000-0000-4000-8000-000000000020";
const accessToken = createUnsignedJwt({
  aud: "authenticated",
  exp: Math.floor(Date.now() / 1000) + 60 * 60,
  role: "authenticated",
  sub: userId,
});

const user = {
  id: userId,
  aud: "authenticated",
  role: "authenticated",
  email: "mobile@catatz.test",
  email_confirmed_at: now,
  phone: "",
  app_metadata: {
    provider: "email",
    providers: ["email"],
  },
  user_metadata: {
    name: "Mobile Tester",
  },
  identities: [],
  created_at: now,
  updated_at: now,
};

const account = {
  id: accountId,
  user_id: userId,
  nama: "SeaBank",
  jenis: "Bank",
  saldo_awal: 5_000_000,
  saldo_saat_ini: 4_984_585,
  warna: "#cf202f",
  logo: null,
  exclude_total: false,
  urutan: 1,
  created_at: now,
  updated_at: now,
};

const category = {
  id: categoryId,
  user_id: null,
  nama: "Games",
  ikon: "🎮",
  warna: "#0052ff",
  tipe: "expense",
  is_system: true,
  created_at: now,
};

const transaction = {
  id: "00000000-0000-4000-8000-000000000030",
  user_id: userId,
  tipe: "expense",
  judul: "TopUp Games",
  nominal: 15_415,
  tanggal: "2026-06-14",
  waktu: "04:42:00",
  kategori_id: categoryId,
  rekening_id: accountId,
  rekening_tujuan: null,
  catatan: "Topup saldo untuk pengujian mobile",
  tags: [],
  is_recurring: false,
  recurring_id: null,
  created_at: now,
  updated_at: now,
  kategori: category,
  rekening: {
    id: accountId,
    nama: account.nama,
    jenis: account.jenis,
    logo: account.logo,
    warna: account.warna,
  },
  rekening_tujuan_data: null,
};

const debt = {
  id: "00000000-0000-4000-8000-000000000040",
  user_id: userId,
  tipe: "memberi",
  nama_entitas: "Dempok",
  total_pinjaman: 10_000,
  sisa_tagihan: 10_000,
  tanggal_mulai: "2026-06-14",
  tanggal_jatuh_tempo: null,
  waktu: "22:07:00",
  rekening_id: accountId,
  status: "aktif",
  catatan: null,
  created_at: now,
  updated_at: now,
  cicilan: [],
};

function createUnsignedJwt(payload) {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.e2e`;
}

function json(response, status, data, extraHeaders = {}) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    ...extraHeaders,
  });
  response.end(JSON.stringify(data));
}

function getTableRows(tableName) {
  const rows = {
    profiles: [{ id: userId, name: "Mobile Tester", avatar_url: null }],
    user_preferences: [
      {
        user_id: userId,
        theme: "system",
        currency: "IDR",
        date_format: "id-ID",
        number_format: "id-ID",
        default_landing_page: "/transactions",
        show_decimal_places: false,
        time_format: "24h",
      },
    ],
    rekening: [account],
    kategori: [category],
    transaksi: [transaction],
    hutang: [debt],
    user_sessions: [],
  };

  return rows[tableName] ?? [];
}

function handleRestRequest(request, response, url) {
  const tableName = url.pathname.split("/").pop();
  const rows = getTableRows(tableName);
  const wantsSingle = request.headers.accept?.includes(
    "application/vnd.pgrst.object+json",
  );

  if (request.method === "GET" || request.method === "HEAD") {
    const body = wantsSingle ? (rows[0] ?? null) : rows;
    json(response, 200, request.method === "HEAD" ? null : body, {
      "Content-Range": `0-${Math.max(rows.length - 1, 0)}/${rows.length}`,
    });
    return;
  }

  if (
    request.method === "POST" ||
    request.method === "PATCH" ||
    request.method === "DELETE"
  ) {
    json(response, 200, wantsSingle ? (rows[0] ?? {}) : []);
    return;
  }

  json(response, 405, { message: "Method not allowed" });
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${host}:${port}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Origin": "*",
    });
    response.end();
    return;
  }

  if (url.pathname === "/health") {
    json(response, 200, { status: "ok" });
    return;
  }

  if (
    url.pathname === "/auth/v1/token" &&
    url.searchParams.get("grant_type") === "password"
  ) {
    json(response, 200, {
      access_token: accessToken,
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: "catatz-e2e-refresh-token",
      user,
    });
    return;
  }

  if (url.pathname === "/auth/v1/user") {
    const authorization = request.headers.authorization ?? "";
    if (authorization.includes(accessToken)) {
      json(response, 200, user);
      return;
    }

    json(response, 401, { message: "Auth session missing" });
    return;
  }

  if (url.pathname.startsWith("/rest/v1/")) {
    handleRestRequest(request, response, url);
    return;
  }

  json(response, 404, { message: "Not found" });
});

server.listen(port, host, () => {
  process.stdout.write(`Mock Supabase listening on http://${host}:${port}\n`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
