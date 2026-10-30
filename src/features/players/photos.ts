import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { supabase, SUPABASE_URL } from "@/integrations/supabase/client";

const BUCKET = "player-photos";
const PHOTO_LINK_SECONDS = 60 * 60 * 6;
const PHOTO_LINK_CACHE_MS = 4 * 60 * 60 * 1000;
export const PHOTO_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
export const PHOTO_BROWSER_CACHE_SECONDS = 60 * 60;

type PhotoLinks = { urls: Record<string, string>; expiresAt: number; complete: boolean };

/** Recover the permanent object path, including from old, expired signed URLs. */
export function playerPhotoPath(source: string | null): string | null {
  if (!source) return null;
  if (!/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(source)) return source;
  try {
    const url = new URL(source);
    if (url.origin !== new URL(SUPABASE_URL).origin) return null;
    for (const access of ["sign", "public", "authenticated"]) {
      const prefix = `/storage/v1/object/${access}/${BUCKET}/`;
      if (url.pathname.startsWith(prefix)) {
        return decodeURIComponent(url.pathname.slice(prefix.length)) || null;
      }
    }
  } catch {
    // Keep other image sources separate from this project's private storage.
  }
  return null;
}

// Keep this cache in the router's QueryClient, never in process-global state or
// localStorage. SSR requests stay isolated and hydrated data remains plain JSON.
const photoLinksQuery = (paths: string[]) =>
  queryOptions({
    queryKey: ["player-photo-links", paths],
    queryFn: async (): Promise<PhotoLinks> => {
      const requestedAt = Date.now();
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, PHOTO_LINK_SECONDS);
      if (error) throw new Error("Player photo links could not be refreshed.");
      const photos = (data ?? []).filter((photo) => !photo.error && !!photo.signedUrl);
      return {
        urls: Object.fromEntries(photos.map((photo) => [photo.path, photo.signedUrl])),
        expiresAt: requestedAt + PHOTO_LINK_SECONDS * 1000,
        complete: photos.length === paths.length,
      };
    },
    staleTime: (query) => (query.state.data?.complete ? PHOTO_LINK_CACHE_MS : 60_000),
    // Avoid Node GC timers retaining a completed SSR request's cache for hours.
    gcTime: typeof window === "undefined" ? Infinity : PHOTO_LINK_SECONDS * 1000,
    retry: 1,
  });

/** Cache display links with a two-hour expiry buffer; persist object paths only. */
export async function withPlayerPhotos<T extends { image_url: string | null }>(
  players: T[],
  queryClient: QueryClient,
): Promise<T[]> {
  const paths = [
    ...new Set(
      players
        .map((player) => playerPhotoPath(player.image_url))
        .filter((path): path is string => !!path),
    ),
  ].sort();
  if (!paths.length) return players;
  const options = photoLinksQuery(paths);
  let links: PhotoLinks | undefined;
  try {
    links = await queryClient.fetchQuery(options);
  } catch {
    // A temporary outage must not discard an existing link that is still valid.
    links = queryClient.getQueryData(options.queryKey);
    console.warn("Player photo links could not be refreshed.");
  }
  const urls = links && links.expiresAt > Date.now() + 60_000 ? links.urls : undefined;
  return players.map((player) => {
    const path = playerPhotoPath(player.image_url);
    const url = path ? urls?.[path] : null;
    return {
      ...player,
      image_url: path ? (typeof url === "string" ? url : null) : player.image_url,
    };
  });
}

export const playerPhotoUrlQuery = (source: string | null) =>
  queryOptions({
    queryKey: ["player-photo-url", playerPhotoPath(source) ?? source],
    queryFn: async ({ client }) =>
      (await withPlayerPhotos([{ image_url: source }], client))[0]?.image_url ?? null,
    enabled: !!source,
    staleTime: 60_000,
    refetchInterval: PHOTO_REFRESH_INTERVAL_MS,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

/** Recover a failed image once without repeatedly retrying missing/corrupt files. */
export async function refreshPlayerPhoto(queryClient: QueryClient, source: string) {
  const path = playerPhotoPath(source);
  if (!path) return;
  await queryClient.invalidateQueries({
    queryKey: ["player-photo-links"],
    predicate: (query) => Array.isArray(query.queryKey[1]) && query.queryKey[1].includes(path),
    refetchType: "none",
  });
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["public", "players"] }, { cancelRefetch: false }),
    queryClient.invalidateQueries(
      { queryKey: ["player-photo-url", path] },
      { cancelRefetch: false },
    ),
  ]);
}
