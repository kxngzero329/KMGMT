// Only public marketing queries use this helper. Preserve the normal client-side
// loading/error UI if a backend read is unavailable; never fail the whole page.
export async function publicSeoData<T>(
  load: () => Promise<T>,
  cancel: () => Promise<void>,
): Promise<T | null> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      load(),
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => {
          // Stop cache updates before returning fallback loader data, so the
          // initial server render and client hydration use the same content.
          void cancel().then(
            () => resolve(null),
            () => resolve(null),
          );
        }, 5000);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
