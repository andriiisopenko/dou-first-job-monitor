import { Vacancy } from "../models/vacancy";

const PRIMARY_KEYWORDS = [
  "intern",
  "trainee",
  "junior",
  "graduate",
  "entry level",
  "entry-level",
];

const STACK_KEYWORDS = [
  "javascript",
  "js",
  "python",
  "node.js",
  "nodejs",
  "react",
  "typescript",
  "nestjs",
  "next.js",
  "nextjs",
];

const CATEGORY_WHITELIST = [
  "frontend",
  "backend",
  "fullstack",
  "full-stack",
  "software engineer",
  "developer",
  "engineer",
];

const BLACKLIST_KEYWORDS = [
  "sales",
  "support",
  "manager",
  "seo",
  "hr",
  "recruiter",
  "marketing",
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function findMatches(text: string, keywords: string[]): string[] {
  return keywords.filter((keyword) => text.includes(keyword));
}

export interface VacancyAnalysis {
  isRelevant: boolean;
  matchedPrimary: string[];
  matchedStack: string[];
  matchedWhitelist: string[];
  matchedBlacklist: string[];
  reason: string;
  matchSummary: string;
}

export function analyzeVacancy(
  vacancy: Pick<Vacancy, "title" | "description">,
): VacancyAnalysis {
  const haystack = normalize(`${vacancy.title} ${vacancy.description}`);

  const matchedPrimary = findMatches(haystack, PRIMARY_KEYWORDS);
  const matchedStack = findMatches(haystack, STACK_KEYWORDS);
  const matchedWhitelist = findMatches(haystack, CATEGORY_WHITELIST);
  const matchedBlacklist = findMatches(haystack, BLACKLIST_KEYWORDS);

  if (matchedBlacklist.length > 0) {
    return {
      isRelevant: false,
      matchedPrimary,
      matchedStack,
      matchedWhitelist,
      matchedBlacklist,
      reason: `blacklist matched: ${matchedBlacklist.join(", ")}`,
      matchSummary: matchedBlacklist.join(", "),
    };
  }

  if (matchedPrimary.length === 0) {
    return {
      isRelevant: false,
      matchedPrimary,
      matchedStack,
      matchedWhitelist,
      matchedBlacklist,
      reason: "missing primary keyword",
      matchSummary: "",
    };
  }

  if (matchedStack.length === 0) {
    return {
      isRelevant: false,
      matchedPrimary,
      matchedStack,
      matchedWhitelist,
      matchedBlacklist,
      reason: "missing stack keyword",
      matchSummary: matchedPrimary.join(", "),
    };
  }

  const combinedMatches = [
    ...matchedPrimary,
    ...matchedStack,
    ...matchedWhitelist,
  ];

  const uniqueMatches = Array.from(new Set(combinedMatches));

  return {
    isRelevant: true,
    matchedPrimary,
    matchedStack,
    matchedWhitelist,
    matchedBlacklist,
    reason: "matched relevance rules",
    matchSummary: uniqueMatches.join(" + "),
  };
}
