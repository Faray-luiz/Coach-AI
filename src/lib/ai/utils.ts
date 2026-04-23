/**
 * Divide um texto longo em pedaços (chunks) menores para busca vetorial.
 * @param text O texto completo.
 * @param chunkSize Tamanho máximo de cada pedaço (caracteres).
 * @param overlap Quantidade de caracteres que se repetem entre pedaços.
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let currentPos = 0;

  while (currentPos < text.length) {
    const chunk = text.substring(currentPos, currentPos + chunkSize);
    chunks.push(chunk);
    currentPos += (chunkSize - overlap);
  }

  return chunks;
}
