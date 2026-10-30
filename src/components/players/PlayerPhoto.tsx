import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  playerPhotoPath,
  playerPhotoUrlQuery,
  refreshPlayerPhoto,
} from "@/features/players/photos";

/** Admin previews keep the stored object path separate from its display URL. */
export function PlayerPhoto({
  source,
  alt,
  className,
}: {
  source: string | null;
  alt: string;
  className: string;
}) {
  const photo = useQuery(playerPhotoUrlQuery(source));
  const queryClient = useQueryClient();
  const retriedPath = useRef<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = photo.data;
  if (!url || url === failedUrl) return null;
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onLoad={() => {
        retriedPath.current = null;
      }}
      onError={() => {
        setFailedUrl(url);
        const path = playerPhotoPath(source);
        if (!source || !path || retriedPath.current === path) return;
        retriedPath.current = path;
        void refreshPlayerPhoto(queryClient, source);
      }}
    />
  );
}
