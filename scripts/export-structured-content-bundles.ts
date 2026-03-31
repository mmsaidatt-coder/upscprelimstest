import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

type PageClassification =
  | "blank"
  | "cover"
  | "copyright"
  | "toc"
  | "advertisement"
  | "content"
  | "appendix"
  | "unclear";

type Subject =
  | "Polity"
  | "History"
  | "Economy"
  | "Geography"
  | "Environment"
  | "Science"
  | "Current Affairs"
  | "CSAT";

type ExtractedPage = {
  pageNumber: number;
  rawText: string;
  cleanedText: string;
  textLength: number;
  heuristicClassification: PageClassification;
  needsVisionRescue: boolean;
  ocrClassification?: PageClassification;
  ocrQuestionQuotaHint?: number;
  ocrRationale?: string;
  rescuedText?: string;
};

type PagesFile = {
  fileName: string;
  filePath: string;
  pdfLabel: string;
  defaultSubject: Subject;
  pages: ExtractedPage[];
};

type TopicPacket = {
  id: string;
  topic: string;
  subtopic: string;
  pageNumbers: number[];
  questionQuota: number;
  rationale: string;
};

type Section = {
  id: string;
  packetId: string;
  topic: string;
  subtopic: string;
  title: string;
  focus: string;
  pageNumbers: number[];
  questionQuota: number;
  rationale: string;
  sectionExcerpt: string;
  evidenceBullets: string[];
};

type Claim = {
  id: string;
  sectionId: string;
  claimType: string;
  claimText: string;
  evidenceExcerpt: string;
  pageNumbers: number[];
  examUse: string;
  distractorHooks: string[];
};

type Args = {
  outDir: string;
  bundleDir: string;
};

function parseArgs(argv: string[]): Args {
  const result: Args = {
    outDir: path.resolve(process.cwd(), "data", "generated", "current-affairs-2025-pt365-sections-gemini-3"),
    bundleDir: "content-bundles",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--out-dir" && next) {
      result.outDir = path.resolve(process.cwd(), next);
      i += 1;
    } else if (arg === "--bundle-dir" && next) {
      result.bundleDir = next;
      i += 1;
    } else if (arg === "--help") {
      console.log([
        "Usage: npx tsx scripts/export-structured-content-bundles.ts [options]",
        "",
        "Options:",
        "  --out-dir <path>     Generated batch directory with cache/ (default: current-affairs-2025-pt365-sections-gemini-3)",
        "  --bundle-dir <name>  Relative directory name under out-dir for content bundles (default: content-bundles)",
      ].join("\n"));
      process.exit(0);
    }
  }

  return result;
}

async function exists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(filePath: string): Promise<T | null> {
  if (!(await exists(filePath))) {
    return null;
  }

  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalizeWhitespace(text: string) {
  return String(text ?? "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function readJsonFilesFromDir<T>(dirPath: string): Promise<T[]> {
  if (!(await exists(dirPath))) {
    return [];
  }

  const entries = (await readdir(dirPath))
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .sort();

  const values: T[] = [];
  for (const entry of entries) {
    const filePath = path.join(dirPath, entry);
    const payload = await readJson<T | T[]>(filePath);
    if (!payload) continue;
    if (Array.isArray(payload)) {
      values.push(...payload);
    } else {
      values.push(payload);
    }
  }

  return values;
}

function uniqueNumbers(values: number[]) {
  return [...new Set(values)].sort((left, right) => left - right);
}

function formatPages(pageNumbers: number[]) {
  const sorted = uniqueNumbers(pageNumbers);
  if (!sorted.length) return "";

  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let index = 1; index < sorted.length; index += 1) {
    const page = sorted[index];
    if (page === end + 1) {
      end = page;
      continue;
    }

    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    start = page;
    end = page;
  }

  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(", ");
}

async function exportBundleForCacheDir(cacheDir: string, bundlesRoot: string) {
  const pagesFile = await readJson<PagesFile>(path.join(cacheDir, "pages.json"));
  if (!pagesFile) {
    return null;
  }

  const packets = (await readJson<TopicPacket[]>(path.join(cacheDir, "packets.json"))) ?? [];
  const sections = await readJsonFilesFromDir<Section>(path.join(cacheDir, "sections"));
  const claims = await readJsonFilesFromDir<Claim>(path.join(cacheDir, "claims"));

  const sectionsByPacket = new Map<string, Section[]>();
  for (const section of sections) {
    const bucket = sectionsByPacket.get(section.packetId) ?? [];
    bucket.push(section);
    sectionsByPacket.set(section.packetId, bucket);
  }

  const claimsBySection = new Map<string, Claim[]>();
  for (const claim of claims) {
    const bucket = claimsBySection.get(claim.sectionId) ?? [];
    bucket.push(claim);
    claimsBySection.set(claim.sectionId, bucket);
  }

  const classificationCounts = pagesFile.pages.reduce<Record<string, number>>((acc, page) => {
    const key = page.ocrClassification ?? page.heuristicClassification ?? "unclear";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const contentPages = pagesFile.pages
    .filter((page) => (page.ocrClassification ?? page.heuristicClassification) === "content")
    .map((page) => page.pageNumber);

  const packetsWithSections = packets.filter((packet) => (sectionsByPacket.get(packet.id) ?? []).length > 0).length;
  const sectionsWithClaims = sections.filter((section) => (claimsBySection.get(section.id) ?? []).length > 0).length;

  const slug = path.basename(cacheDir);
  const bundleDir = path.join(bundlesRoot, slug);

  const outline = {
    generatedAt: new Date().toISOString(),
    partial: packetsWithSections < packets.length || sectionsWithClaims < sections.length,
    pdf: {
      slug,
      fileName: pagesFile.fileName,
      filePath: pagesFile.filePath,
      label: pagesFile.pdfLabel,
      subject: pagesFile.defaultSubject,
    },
    coverage: {
      totalPages: pagesFile.pages.length,
      contentPages: contentPages.length,
      contentPageNumbers: contentPages,
      classifications: classificationCounts,
      totalPackets: packets.length,
      packetsWithSections,
      totalSections: sections.length,
      sectionsWithClaims,
      totalClaims: claims.length,
    },
    packets: packets.map((packet) => {
      const packetSections = (sectionsByPacket.get(packet.id) ?? []).sort((left, right) =>
        left.pageNumbers[0] - right.pageNumbers[0],
      );
      return {
        id: packet.id,
        topic: packet.topic,
        subtopic: packet.subtopic,
        pageNumbers: packet.pageNumbers,
        pageRangeLabel: formatPages(packet.pageNumbers),
        questionQuota: packet.questionQuota,
        rationale: packet.rationale,
        sectionCount: packetSections.length,
        claimCount: packetSections.reduce(
          (sum, section) => sum + (claimsBySection.get(section.id)?.length ?? 0),
          0,
        ),
        sections: packetSections.map((section) => ({
          id: section.id,
          title: section.title,
          pageNumbers: section.pageNumbers,
          questionQuota: section.questionQuota,
          claimCount: claimsBySection.get(section.id)?.length ?? 0,
        })),
      };
    }),
  };

  const sectionsPayload = {
    generatedAt: outline.generatedAt,
    partial: outline.partial,
    pdf: outline.pdf,
    totalSections: sections.length,
    sections: sections
      .map((section) => ({
        id: section.id,
        packetId: section.packetId,
        topic: section.topic,
        subtopic: section.subtopic,
        title: section.title,
        focus: section.focus,
        pageNumbers: section.pageNumbers,
        pageRangeLabel: formatPages(section.pageNumbers),
        questionQuota: section.questionQuota,
        rationale: section.rationale,
        sectionExcerpt: normalizeWhitespace(section.sectionExcerpt),
        evidenceBullets: section.evidenceBullets.map(normalizeWhitespace).filter(Boolean),
        claimCount: claimsBySection.get(section.id)?.length ?? 0,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  };

  const sectionLookup = new Map(sections.map((section) => [section.id, section] as const));
  const packetLookup = new Map(packets.map((packet) => [packet.id, packet] as const));

  const claimsPayload = {
    generatedAt: outline.generatedAt,
    partial: outline.partial,
    pdf: outline.pdf,
    totalClaims: claims.length,
    claims: claims
      .map((claim) => {
        const section = sectionLookup.get(claim.sectionId);
        const packet = section ? packetLookup.get(section.packetId) : null;
        return {
          id: claim.id,
          sectionId: claim.sectionId,
          packetId: section?.packetId ?? null,
          topic: section?.topic ?? packet?.topic ?? null,
          subtopic: section?.subtopic ?? packet?.subtopic ?? null,
          sectionTitle: section?.title ?? null,
          pageNumbers: claim.pageNumbers,
          pageRangeLabel: formatPages(claim.pageNumbers),
          claimType: claim.claimType,
          claimText: normalizeWhitespace(claim.claimText),
          evidenceExcerpt: normalizeWhitespace(claim.evidenceExcerpt),
          examUse: normalizeWhitespace(claim.examUse),
          distractorHooks: claim.distractorHooks.map(normalizeWhitespace).filter(Boolean),
        };
      })
      .sort((left, right) => `${left.sectionId}-${left.id}`.localeCompare(`${right.sectionId}-${right.id}`)),
  };

  const digestLines: string[] = [
    `# ${pagesFile.pdfLabel}`,
    "",
    `- File: ${pagesFile.fileName}`,
    `- Subject: ${pagesFile.defaultSubject}`,
    `- Total pages: ${pagesFile.pages.length}`,
    `- Content pages: ${contentPages.length}`,
    `- Packets: ${packets.length}`,
    `- Sections: ${sections.length}`,
    `- Claims: ${claims.length}`,
    `- Partial bundle: ${outline.partial ? "yes" : "no"}`,
    "",
    "## Coverage",
    "",
    ...Object.entries(classificationCounts)
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([classification, count]) => `- ${classification}: ${count}`),
    "",
    "## Topic Outline",
    "",
  ];

  for (const packet of packets) {
    const packetSections = (sectionsByPacket.get(packet.id) ?? []).sort((left, right) =>
      left.pageNumbers[0] - right.pageNumbers[0],
    );
    digestLines.push(`### ${packet.subtopic || packet.topic}`);
    digestLines.push("");
    digestLines.push(`- Topic: ${packet.topic}`);
    digestLines.push(`- Pages: ${formatPages(packet.pageNumbers)}`);
    digestLines.push(`- Question quota hint: ${packet.questionQuota}`);
    digestLines.push(`- Rationale: ${normalizeWhitespace(packet.rationale)}`);
    digestLines.push(`- Sections: ${packetSections.length}`);
    digestLines.push("");

    for (const section of packetSections) {
      const sectionClaims = claimsBySection.get(section.id) ?? [];
      digestLines.push(`#### ${section.title}`);
      digestLines.push("");
      digestLines.push(`- Pages: ${formatPages(section.pageNumbers)}`);
      digestLines.push(`- Focus: ${normalizeWhitespace(section.focus)}`);
      digestLines.push(`- Claims: ${sectionClaims.length}`);
      if (section.evidenceBullets.length) {
        digestLines.push("- Evidence anchors:");
        for (const bullet of section.evidenceBullets.slice(0, 4)) {
          digestLines.push(`  - ${normalizeWhitespace(bullet)}`);
        }
      }
      digestLines.push("");
    }
  }

  const sectionsMdLines: string[] = [
    `# ${pagesFile.pdfLabel}`,
    "",
    `- File: ${pagesFile.fileName}`,
    `- Subject: ${pagesFile.defaultSubject}`,
    `- Total pages: ${pagesFile.pages.length}`,
    `- Sections captured: ${sections.length}`,
    `- Claims captured: ${claims.length}`,
    `- Partial bundle: ${outline.partial ? "yes" : "no"}`,
    "",
    "## Sections",
    "",
  ];

  const orderedPackets = packets.map((packet) => ({
    packet,
    sections: (sectionsByPacket.get(packet.id) ?? []).sort((left, right) =>
      `${formatPages(left.pageNumbers)}-${left.title}`.localeCompare(`${formatPages(right.pageNumbers)}-${right.title}`),
    ),
  }));

  for (const { packet, sections: packetSections } of orderedPackets) {
    sectionsMdLines.push(`## ${packet.subtopic || packet.topic}`);
    sectionsMdLines.push("");
    sectionsMdLines.push(`- Topic: ${packet.topic}`);
    sectionsMdLines.push(`- Pages: ${formatPages(packet.pageNumbers)}`);
    sectionsMdLines.push(`- Rationale: ${normalizeWhitespace(packet.rationale)}`);
    sectionsMdLines.push("");

    for (const section of packetSections) {
      const sectionClaims = claimsBySection.get(section.id) ?? [];
      sectionsMdLines.push(`### ${section.title}`);
      sectionsMdLines.push("");
      sectionsMdLines.push(`- Pages: ${formatPages(section.pageNumbers)}`);
      sectionsMdLines.push(`- Focus: ${normalizeWhitespace(section.focus)}`);
      sectionsMdLines.push(`- Question quota hint: ${section.questionQuota}`);
      sectionsMdLines.push(`- Claim count: ${sectionClaims.length}`);
      sectionsMdLines.push("");

      if (section.evidenceBullets.length) {
        sectionsMdLines.push("#### Evidence Bullets");
        sectionsMdLines.push("");
        for (const bullet of section.evidenceBullets) {
          sectionsMdLines.push(`- ${normalizeWhitespace(bullet)}`);
        }
        sectionsMdLines.push("");
      }

      if (section.sectionExcerpt) {
        sectionsMdLines.push("#### Section Excerpt");
        sectionsMdLines.push("");
        sectionsMdLines.push(normalizeWhitespace(section.sectionExcerpt));
        sectionsMdLines.push("");
      }

      if (sectionClaims.length) {
        sectionsMdLines.push("#### Claims");
        sectionsMdLines.push("");
        for (const claim of sectionClaims) {
          sectionsMdLines.push(`- ${normalizeWhitespace(claim.claimText)}`);
        }
        sectionsMdLines.push("");
      }
    }
  }

  await mkdir(bundleDir, { recursive: true });
  await writeJson(path.join(bundleDir, "content-outline.json"), outline);
  await writeJson(path.join(bundleDir, "content-sections.json"), sectionsPayload);
  await writeJson(path.join(bundleDir, "content-claims.json"), claimsPayload);
  await writeFile(path.join(bundleDir, "content-digest.md"), `${digestLines.join("\n")}\n`, "utf8");
  await writeFile(path.join(bundleDir, "content-sections.md"), `${sectionsMdLines.join("\n")}\n`, "utf8");

  return {
    slug,
    packets: packets.length,
    sections: sections.length,
    claims: claims.length,
    partial: outline.partial,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cacheRoot = path.join(args.outDir, "cache");
  const bundlesRoot = path.join(args.outDir, args.bundleDir);

  if (!(await exists(cacheRoot))) {
    throw new Error(`Cache directory not found: ${cacheRoot}`);
  }

  const cacheDirs = (await readdir(cacheRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(cacheRoot, entry.name))
    .sort();

  if (!cacheDirs.length) {
    throw new Error(`No cache directories found in ${cacheRoot}`);
  }

  const summaries = [];
  for (const cacheDir of cacheDirs) {
    const summary = await exportBundleForCacheDir(cacheDir, bundlesRoot);
    if (summary) {
      summaries.push(summary);
      console.log(
        `Bundled ${summary.slug}: packets=${summary.packets} sections=${summary.sections} claims=${summary.claims} partial=${summary.partial}`,
      );
    }
  }

  await writeJson(path.join(bundlesRoot, "index.json"), {
    generatedAt: new Date().toISOString(),
    bundleCount: summaries.length,
    bundles: summaries,
  });

  console.log(`Content bundles written to ${bundlesRoot}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
