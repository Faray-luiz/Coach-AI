/**
 * Divide um texto longo em pedaços (chunks) menores para busca vetorial.
 * Respeita limites de parágrafo, frase e palavra para não cortar no meio de conceitos.
 * @param text O texto completo.
 * @param chunkSize Tamanho máximo de cada pedaço (caracteres).
 * @param overlap Quantidade de caracteres que se repetem entre pedaços.
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let pos = 0;

  // Break candidates ordered by preference (separator, chars to keep after it)
  const BREAKS: Array<[string, number]> = [
    ['\n\n', 0],  // paragraph
    ['\n', 0],    // line
    ['. ', 1],    // sentence (keep period)
    ['! ', 1],
    ['? ', 1],
    [' ', 0],     // word
  ];
  const MIN_BREAK_RATIO = 0.5; // break point must be at least 50% into the window

  while (pos < text.length) {
    const end = Math.min(pos + chunkSize, text.length);

    if (end === text.length) {
      const last = text.substring(pos).trim();
      if (last) chunks.push(last);
      break;
    }

    const window = text.substring(pos, end);
    let breakOffset = -1;

    for (const [sep, keep] of BREAKS) {
      const idx = window.lastIndexOf(sep);
      if (idx >= chunkSize * MIN_BREAK_RATIO) {
        breakOffset = idx + keep;
        break;
      }
    }

    if (breakOffset <= 0) breakOffset = chunkSize;

    chunks.push(text.substring(pos, pos + breakOffset).trim());

    // Always advance by at least 30% of chunkSize to avoid getting stuck
    const advance = Math.max(breakOffset - overlap, Math.floor(chunkSize * 0.3));
    pos += advance;
  }

  return chunks.filter(c => c.length > 0);
}
