import { HttpResponse, http } from "msw";

export const externalServiceHandlers = [
  http.all("http://127.0.0.1:55431/*", () =>
    HttpResponse.json({ message: "Supabase request not configured for this test" }, { status: 503 }),
  ),
  http.post("https://generativelanguage.googleapis.com/*", () =>
    HttpResponse.json({ candidates: [] }),
  ),
];
