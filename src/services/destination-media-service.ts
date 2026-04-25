interface WikiSearchResponse {
  query?: {
    pages?: Record<
      string,
      {
        title: string;
        original?: {
          source: string;
        };
        thumbnail?: {
          source: string;
        };
        terms?: {
          description?: string[];
        };
      }
    >;
  };
}

export interface DestinationMediaPayload {
  imageUrl?: string;
  caption?: string;
}

export async function fetchDestinationMedia(
  destination: string,
  country?: string,
): Promise<DestinationMediaPayload | null> {
  const queries = [
    [destination, country].filter(Boolean).join(' '),
    destination,
  ].filter(Boolean);

  for (const query of queries) {
    const result = await searchWikipediaImage(query);
    if (result?.imageUrl) {
      return result;
    }
  }

  return null;
}

async function searchWikipediaImage(query: string) {
  const url =
    'https://en.wikipedia.org/w/api.php' +
    `?action=query&format=json&origin=*` +
    `&generator=search&gsrsearch=${encodeURIComponent(query)}` +
    '&gsrlimit=1&prop=pageimages|pageterms&piprop=original|thumbnail&pithumbsize=1200';

  const response = await fetch(url, {
    headers: {
      'Api-User-Agent': 'VoyagrPlanner/1.0 (calendar travel planner)',
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as WikiSearchResponse;
  const page = payload.query?.pages
    ? Object.values(payload.query.pages)[0]
    : null;

  if (!page) {
    return null;
  }

  return {
    imageUrl: page.original?.source ?? page.thumbnail?.source,
    caption: page.terms?.description?.[0] ?? page.title,
  } satisfies DestinationMediaPayload;
}
