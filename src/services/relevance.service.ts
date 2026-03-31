import { Vacancy } from "../models/vacancy";

const PRIMARY_KEYWORDS = ["intern", "trainee"];
const STACK_KEYWORDS = [
  "javascript",
  "python",
  "node.js",
  "react",
  "typescript",
];

function normalize(text: string): string {
  return text.toLowerCase();
}

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

export function isRelevantVacancy(
  vacancy: Pick<Vacancy, "title" | "description">,
): boolean {
  const haystack = normalize(`${vacancy.title} ${vacancy.description}`);

  const hasIntern = haystack.includes("intern");
  const hasTrainee = haystack.includes("trainee");
  const hasStackKeyword = containsAny(haystack, STACK_KEYWORDS);

  return (hasIntern && hasStackKeyword) || (hasTrainee && hasStackKeyword);
}
