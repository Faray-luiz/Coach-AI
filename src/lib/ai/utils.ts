/**
 * Limpa transcrições no formato incremental de STT (ex: Google Captions).
 * Nesse formato, cada fala aparece repetida várias vezes, com palavras
 * adicionadas progressivamente: "Oi Oi lara Oi lara tudo Oi lara tudo bem."
 * A função extrai apenas a versão final e mais completa de cada fala.
 */
export function cleanTranscript(text: string): string {
  if (!text) return text;

  // Separa parágrafos (cada bloco de fala)
  const paragraphs = text.split(/\n{2,}/);
  const cleaned: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Detecta "FALANTE: conteúdo" (nomes em maiúsculas como MENTORA, MENTEE)
    const match = trimmed.match(/^([A-ZÁÉÍÓÚÃÕA-Z][A-ZÁÉÍÓÚÃÕA-Z\s]{0,30}?):\s+([\s\S]+)$/);
    if (!match) {
      cleaned.push(trimmed);
      continue;
    }

    const speaker = match[1].trim();
    const content = match[2].replace(/\n+/g, ' ').trim();
    const finalContent = extractFinalUtterance(content);
    cleaned.push(`${speaker}: ${finalContent}`);
  }

  return cleaned.join('\n\n');
}

/**
 * Dentro de um bloco de fala com repetições incrementais, extrai a
 * versão mais completa (última ocorrência do padrão de início).
 */
function extractFinalUtterance(text: string): string {
  const words = text.trim().split(/\s+/);
  if (words.length < 5) return text.trim();

  const firstWord = words[0].replace(/[.,!?;:'"]/g, '').toLowerCase();
  if (!firstWord || firstWord.length < 2) return text.trim();

  // Procura a última ocorrência da primeira palavra a partir de 20% do texto
  const minPos = Math.floor(words.length * 0.2);
  let lastPos = 0;

  for (let i = words.length - 1; i >= minPos; i--) {
    const w = words[i].replace(/[.,!?;:'"]/g, '').toLowerCase();
    if (w === firstWord) {
      lastPos = i;
      break;
    }
  }

  if (lastPos > 0) {
    const result = words.slice(lastPos).join(' ');
    // Só usa se resultado tiver pelo menos 10% do original (evita extrações mínimas)
    if (result.length >= text.length * 0.1) return result;
  }

  // Fallback: pega os últimos 50% das palavras
  return words.slice(Math.floor(words.length / 2)).join(' ');
}

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
