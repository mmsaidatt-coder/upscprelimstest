type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

type PageRunner<T> = (from: number, to: number) => Promise<PageResult<T>>;

const DEFAULT_PAGE_SIZE = 500;
const DEFAULT_MAX_PAGES = 200;

export async function fetchAllPages<T>({
  runPage,
  pageSize = DEFAULT_PAGE_SIZE,
  maxPages = DEFAULT_MAX_PAGES,
}: {
  runPage: PageRunner<T>;
  pageSize?: number;
  maxPages?: number;
}): Promise<T[]> {
  const rows: T[] = [];

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await runPage(from, to);

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.length) {
      return rows;
    }

    rows.push(...data);

    if (data.length < pageSize) {
      return rows;
    }
  }

  throw new Error(
    `Exceeded pagination guard while fetching Supabase rows (${pageSize * maxPages}+ rows).`,
  );
}
