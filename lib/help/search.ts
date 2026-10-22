import { HELP_TASKS, type HelpTask } from "./tasks";

// Busca simples e local (sem IA, sem rede): compara o que a pessoa escreveu ou falou com as
// frases-chave e o título de cada tarefa. Ignora acento, maiúsculas e palavras de ligação.

const STOPWORDS = new Set([
  "a", "o", "as", "os", "de", "da", "do", "das", "dos", "um", "uma", "para", "pra", "por", "como",
  "eu", "quero", "posso", "preciso", "fazer", "meu", "minha", "meus", "minhas", "na", "no", "nas",
  "nos", "em", "e", "ou", "que", "se", "ao", "aos", "ver", "onde", "qual", "tem", "ter", "mais",
]);

export function normalizeHelpText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string): string[] {
  return normalizeHelpText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

// "pecas" casa com "peca"; "cadastrando" com "cadastrar" (mesmo começo de 5 letras).
function sameWord(a: string, b: string): boolean {
  if (a === b) return true;
  const prefix = Math.min(5, a.length, b.length);
  return prefix >= 4 && a.slice(0, prefix) === b.slice(0, prefix);
}

export function scoreHelpTask(task: HelpTask, query: string): number {
  const normalized = normalizeHelpText(query);
  const queryTokens = tokens(query);
  if (queryTokens.length === 0) return 0;

  let score = 0;

  for (const keyword of task.keywords) {
    const phrase = normalizeHelpText(keyword);
    if (normalized.includes(phrase)) score += 4;

    const keywordTokens = tokens(keyword);
    const matched = queryTokens.filter((token) => keywordTokens.some((k) => sameWord(token, k))).length;
    // Frase inteira dita com outras palavras ("quero cadastrar um produto novo") vale mais.
    if (keywordTokens.length > 1 && matched === keywordTokens.length) score += 3;
    else score += matched;
  }

  const titleTokens = tokens(task.title);
  score += queryTokens.filter((token) => titleTokens.some((t) => sameWord(token, t))).length * 2;

  return score;
}

export function searchHelp(query: string, tasks: HelpTask[] = HELP_TASKS, limit = 5): HelpTask[] {
  return tasks
    .map((task) => ({ task, score: scoreHelpTask(task, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.task);
}
