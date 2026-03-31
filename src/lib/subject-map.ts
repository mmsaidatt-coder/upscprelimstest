import type { Subject } from "./types";

/** Map from common UI subject names to canonical DB subject values. */
export const SUBJECT_MAP: Record<string, Subject> = {
  History: "History",
  Geography: "Geography",
  Economics: "Economy",
  Economy: "Economy",
  Environment: "Environment",
  Polity: "Polity",
  "Science & Tech": "Science",
  Science: "Science",
  "Current Affairs": "Current Affairs",
};
