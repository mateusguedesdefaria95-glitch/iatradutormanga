export async function checkBackend(baseUrl: string): Promise<{ ok: boolean; detail?: string }> {
  const normalized = baseUrl.replace(/\/$/, "");
  try {
    const response = await fetch(`${normalized}/health`, {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(3500)
    });
    if (!response.ok) return { ok: false, detail: `HTTP ${response.status}` };
    const data = await response.json();
    return { ok: data.status === "ok", detail: data.service ?? "Backend respondeu." };
  } catch {
    return { ok: false, detail: "Backend indisponível. Verifique se o servidor local está em execução." };
  }
}
