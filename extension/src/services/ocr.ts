export type OCRRegion = { text: string; confidence: number | null; box: number[][] };
export type OCRResult = { language: string; engine: string; image: { width: number; height: number }; regions: OCRRegion[]; text: string };
export async function recognizeImage(baseUrl: string, imageDataUrl: string, language: string): Promise<OCRResult> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/ocr`, {
    method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ image_data_url: imageDataUrl, language }), signal: AbortSignal.timeout(120000)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || `Falha no OCR (HTTP ${response.status}).`);
  return payload.result as OCRResult;
}
