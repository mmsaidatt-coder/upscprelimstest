import type { ExamTest } from "@/lib/types";

export const tests: ExamTest[] = [
  {
    slug: "gs-mini-mock-01",
    title: "GS Mini Mock 01",
    tagline: "A full-spectrum prelims warm-up built for decision speed.",
    description:
      "Ten multi-subject UPSC-style questions with negative marking, review states, and instant analytics.",
    durationMinutes: 18,
    difficultyLabel: "Premium modern demo",
    questions: [
      {
        id: "gs1",
        subject: "Polity",
        difficulty: "Easy",
        prompt: "Which Article of the Constitution of India guarantees equality before the law?",
        options: [
          { id: "A", text: "Article 14" },
          { id: "B", text: "Article 19" },
          { id: "C", text: "Article 21" },
          { id: "D", text: "Article 32" },
        ],
        correctOptionId: "A",
        explanation:
          "Article 14 is the constitutional anchor for equality before the law and equal protection of the laws.",
        takeaway:
          "Anchor Article 14 with the broad equality principle; Article 19 covers freedoms, 21 covers life and liberty, and 32 is the constitutional remedy.",
        marks: 2,
        negativeMarks: 0.67,
      },
      {
        id: "gs2",
        subject: "History",
        difficulty: "Moderate",
        prompt: "The Permanent Settlement introduced by Lord Cornwallis was first implemented in which region?",
        options: [
          { id: "A", text: "Madras Presidency" },
          { id: "B", text: "Bombay Presidency" },
          { id: "C", text: "Bengal Presidency" },
          { id: "D", text: "Punjab Province" },
        ],
        correctOptionId: "C",
        explanation:
          "The Permanent Settlement of 1793 was introduced in Bengal Presidency and created a zamindari revenue structure.",
        takeaway:
          "Link Cornwallis with Bengal and the Permanent Settlement; Ryotwari and Mahalwari belong to different land revenue arrangements.",
        marks: 2,
        negativeMarks: 0.67,
      },
      {
        id: "gs3",
        subject: "Economy",
        difficulty: "Easy",
        prompt:
          "In monetary policy, the repo rate is the rate at which the Reserve Bank of India lends to:",
        options: [
          { id: "A", text: "Commercial banks" },
          { id: "B", text: "State governments" },
          { id: "C", text: "NBFCs directly" },
          { id: "D", text: "Large corporations" },
        ],
        correctOptionId: "A",
        explanation:
          "The repo rate is the policy rate at which RBI lends short-term funds to commercial banks against government securities.",
        takeaway:
          "Repo is a bank-facing liquidity tool. Reverse repo is the opposite direction.",
        marks: 2,
        negativeMarks: 0.67,
      },
      {
        id: "gs4",
        subject: "Geography",
        difficulty: "Moderate",
        prompt: "The Tropic of Cancer passes through how many states in India?",
        options: [
          { id: "A", text: "6" },
          { id: "B", text: "7" },
          { id: "C", text: "8" },
          { id: "D", text: "9" },
        ],
        correctOptionId: "C",
        explanation:
          "The Tropic of Cancer passes through eight states: Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram.",
        takeaway:
          "Remember the count first, then revise the west-to-east order for map confidence.",
        marks: 2,
        negativeMarks: 0.67,
      },
      {
        id: "gs5",
        subject: "Environment",
        difficulty: "Moderate",
        prompt: "Keoladeo National Park, known for its avian biodiversity, is located in:",
        options: [
          { id: "A", text: "Rajasthan" },
          { id: "B", text: "Gujarat" },
          { id: "C", text: "Madhya Pradesh" },
          { id: "D", text: "Uttarakhand" },
        ],
        correctOptionId: "A",
        explanation:
          "Keoladeo National Park, formerly Bharatpur Bird Sanctuary, is in Rajasthan and is a major wetland habitat for migratory birds.",
        takeaway:
          "Map protected areas with one signature feature: Bharatpur equals Keoladeo wetland bird habitat.",
        marks: 2,
        negativeMarks: 0.67,
      },
      {
        id: "gs6",
        subject: "Science",
        difficulty: "Easy",
        prompt: "Vaccination primarily prepares the human body by:",
        options: [
          { id: "A", text: "Destroying all microbes already present in the bloodstream" },
          { id: "B", text: "Creating memory cells and stimulating an immune response" },
          { id: "C", text: "Reducing the need for any future immune reaction" },
          { id: "D", text: "Replacing white blood cells with antibodies" },
        ],
        correctOptionId: "B",
        explanation:
          "Vaccines expose the immune system to an antigen safely so the body develops antibodies and immune memory.",
        takeaway:
          "Vaccines train the immune system; they do not replace or bypass it.",
        marks: 2,
        negativeMarks: 0.67,
      },
      {
        id: "gs7",
        subject: "Current Affairs",
        difficulty: "Easy",
        prompt: "NITI Aayog replaced the Planning Commission in:",
        options: [
          { id: "A", text: "2012" },
          { id: "B", text: "2014" },
          { id: "C", text: "2015" },
          { id: "D", text: "2017" },
        ],
        correctOptionId: "C",
        explanation:
          "NITI Aayog was constituted on January 1, 2015, replacing the Planning Commission.",
        takeaway:
          "Use 2015 as the shift from centralized planning architecture to NITI Aayog.",
        marks: 2,
        negativeMarks: 0.67,
      },
      {
        id: "gs8",
        subject: "Polity",
        difficulty: "Moderate",
        prompt: "A Money Bill can be introduced only in:",
        options: [
          { id: "A", text: "Rajya Sabha" },
          { id: "B", text: "Lok Sabha" },
          { id: "C", text: "Either House of Parliament" },
          { id: "D", text: "A joint sitting of both Houses" },
        ],
        correctOptionId: "B",
        explanation:
          "Under the Constitution, a Money Bill can be introduced only in Lok Sabha and only with the President's recommendation.",
        takeaway:
          "Remember the trio for Money Bills: Lok Sabha introduction, Speaker certification, limited Rajya Sabha role.",
        marks: 2,
        negativeMarks: 0.67,
      },
      {
        id: "gs9",
        subject: "Environment",
        difficulty: "Hard",
        prompt: "Consider the following statements regarding mangrove ecosystems:",
        contextLines: [
          "1. Mangroves thrive in saline coastal environments.",
          "2. Mangroves help reduce coastal erosion.",
          "3. Mangroves are found only on the eastern coast of India.",
        ],
        options: [
          { id: "A", text: "1 only" },
          { id: "B", text: "1 and 2 only" },
          { id: "C", text: "2 and 3 only" },
          { id: "D", text: "1, 2 and 3" },
        ],
        correctOptionId: "B",
        explanation:
          "Statements 1 and 2 are correct. Statement 3 is incorrect because mangroves exist on both eastern and western coasts and in island ecosystems.",
        takeaway:
          "Use elimination aggressively on ecology statements: absolute words such as only often signal a trap.",
        marks: 2,
        negativeMarks: 0.67,
      },
      {
        id: "gs10",
        subject: "History",
        difficulty: "Easy",
        prompt: "The original Sanchi Stupa is traditionally associated with which ruler?",
        options: [
          { id: "A", text: "Samudragupta" },
          { id: "B", text: "Ashoka" },
          { id: "C", text: "Harsha" },
          { id: "D", text: "Kanishka" },
        ],
        correctOptionId: "B",
        explanation:
          "The Great Stupa at Sanchi is traced to Emperor Ashoka, though later dynasties added embellishments.",
        takeaway:
          "For Buddhist architecture basics, anchor Ashoka with early stupas and pillars.",
        marks: 2,
        negativeMarks: 0.67,
      },
    ],
  },
  {
    slug: "csat-sprint-01",
    title: "CSAT Sprint 01",
    tagline: "Reasoning, comprehension, and pace-control in one timed drill.",
    description:
      "A quick CSAT-format practice set designed to test calculation discipline and reading accuracy.",
    durationMinutes: 15,
    difficultyLabel: "Timed reasoning set",
    questions: [
      {
        id: "csat1",
        subject: "CSAT",
        difficulty: "Easy",
        prompt: "If 12 workers can complete a task in 15 days, how many days will 18 workers take, assuming equal efficiency?",
        options: [
          { id: "A", text: "8 days" },
          { id: "B", text: "10 days" },
          { id: "C", text: "12 days" },
          { id: "D", text: "15 days" },
        ],
        correctOptionId: "B",
        explanation:
          "Work remains constant. Workers multiplied by days remains equal: 12 x 15 = 18 x d, so d = 10.",
        takeaway:
          "For work and time, preserve the product when efficiency is unchanged.",
        marks: 2,
        negativeMarks: 0.67,
      },
      {
        id: "csat2",
        subject: "CSAT",
        difficulty: "Moderate",
        prompt: "A number is increased by 20% and then reduced by 20%. What is the net effect?",
        options: [
          { id: "A", text: "No change" },
          { id: "B", text: "4% increase" },
          { id: "C", text: "4% decrease" },
          { id: "D", text: "8% decrease" },
        ],
        correctOptionId: "C",
        explanation:
          "Take 100 as a base. After a 20% increase it becomes 120; reducing 120 by 20% gives 96, so there is a 4% decrease.",
        takeaway:
          "Equal percentage increase and decrease never cancel out; the result is a decrease.",
        marks: 2,
        negativeMarks: 0.67,
      },
      {
        id: "csat3",
        subject: "CSAT",
        difficulty: "Moderate",
        prompt: "Statements: All maps are diagrams. Some diagrams are sketches. Conclusion: Some maps are sketches.",
        options: [
          { id: "A", text: "Conclusion definitely follows" },
          { id: "B", text: "Conclusion definitely does not follow" },
          { id: "C", text: "Conclusion may follow" },
          { id: "D", text: "Data inadequate" },
        ],
        correctOptionId: "B",
        explanation:
          "From the statements we know all maps are inside the set of diagrams, but the overlap of sketches with diagrams does not guarantee any overlap with maps.",
        takeaway:
          "In syllogisms, avoid assuming an overlap that is not explicitly forced by the premises.",
        marks: 2,
        negativeMarks: 0.67,
      },
      {
        id: "csat4",
        subject: "CSAT",
        difficulty: "Hard",
        prompt: "Choose the correct order if the words are arranged alphabetically.",
        contextLines: ["1. Legislature", "2. Legacy", "3. Legend", "4. Legitimate"],
        options: [
          { id: "A", text: "2, 3, 1, 4" },
          { id: "B", text: "2, 3, 4, 1" },
          { id: "C", text: "3, 2, 4, 1" },
          { id: "D", text: "3, 2, 1, 4" },
        ],
        correctOptionId: "A",
        explanation:
          "Legacy comes before Legend because c precedes e after the shared 'leg'. Legislature comes before Legitimate because s precedes t after 'legi'.",
        takeaway:
          "For alphabetical order, compare only until the first differing letter.",
        marks: 2,
        negativeMarks: 0.67,
      },
      {
        id: "csat5",
        subject: "CSAT",
        difficulty: "Moderate",
        prompt: "Read the passage and answer the question.",
        contextLines: [
          "A mock test is most useful when it changes tomorrow's revision plan.",
          "Scores without diagnosis are emotionally loud but strategically weak.",
          "The best learners convert every attempt into a pattern of mistakes, not just a final number.",
          "Which statement is most consistent with the passage?",
        ],
        options: [
          { id: "A", text: "Mock tests matter only when scores improve immediately." },
          { id: "B", text: "High scores are sufficient even without analysis." },
          { id: "C", text: "Post-test diagnosis is central to improvement." },
          { id: "D", text: "Revision plans should never change after a test." },
        ],
        correctOptionId: "C",
        explanation:
          "The passage clearly argues that diagnosis and pattern recognition after the test create value, not the raw score alone.",
        takeaway:
          "In comprehension, anchor the answer to the author's main claim, not the loudest word in the passage.",
        marks: 2,
        negativeMarks: 0.67,
      },
      {
        id: "csat6",
        subject: "CSAT",
        difficulty: "Easy",
        prompt: "If SOUTH is coded as TPVUI, then NORTH will be coded as:",
        options: [
          { id: "A", text: "OPSUI" },
          { id: "B", text: "NQSTI" },
          { id: "C", text: "PQTUI" },
          { id: "D", text: "OPTUI" },
        ],
        correctOptionId: "A",
        explanation:
          "Each letter is advanced by one alphabetic position: N-O, O-P, R-S, T-U, H-I.",
        takeaway:
          "Decode the rule first; after that, the coded word is mechanical.",
        marks: 2,
        negativeMarks: 0.67,
      },
      {
        id: "csat7",
        subject: "CSAT",
        difficulty: "Moderate",
        prompt: "A train 120 metres long crosses a pole in 6 seconds. What is its speed?",
        options: [
          { id: "A", text: "20 m/s" },
          { id: "B", text: "18 m/s" },
          { id: "C", text: "24 m/s" },
          { id: "D", text: "30 m/s" },
        ],
        correctOptionId: "A",
        explanation:
          "Speed equals distance divided by time. Crossing a pole means the train covers its own length: 120 / 6 = 20 m/s.",
        takeaway:
          "When crossing a pole, use only the train's length as distance.",
        marks: 2,
        negativeMarks: 0.67,
      },
      {
        id: "csat8",
        subject: "CSAT",
        difficulty: "Hard",
        prompt: "In a code language, if DELHI is written as 73541 and IDEAL is written as 47362, what is the code for HAIL?",
        options: [
          { id: "A", text: "1452" },
          { id: "B", text: "1542" },
          { id: "C", text: "1432" },
          { id: "D", text: "1532" },
        ],
        correctOptionId: "B",
        explanation:
          "From DELHI and IDEAL, H = 1, A = 5, I = 4, L = 2. Therefore HAIL becomes 1542.",
        takeaway:
          "Build the symbol table first, then decode the target word.",
        marks: 2,
        negativeMarks: 0.67,
      },
    ],
  },
];

export function getTestBySlug(slug: string) {
  return tests.find((test) => test.slug === slug) ?? null;
}
