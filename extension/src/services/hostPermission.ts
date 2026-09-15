export function documentOriginPattern(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Apenas documentos HTTP ou HTTPS podem receber acesso.");
  }
  return `${url.protocol}//${url.host}/*`;
}
