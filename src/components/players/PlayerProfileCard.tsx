import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Shirt, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PitchLines } from "@/components/common/PitchLines";
import type { RepresentedPlayer } from "@/types/domain";

export function PlayerProfileCard({
  player,
  number,
}: {
  player: RepresentedPlayer;
  number: number;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const hasPhoto = !!player.image_url && player.image_url !== failedImage;
  const initials = player.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const facts = [
    ["Position", player.position],
    ["Current club", player.current_club],
    ["Nationality", player.nationality],
    ["Age", player.age != null ? String(player.age) : null],
    ["Previous clubs", player.previous_clubs],
  ].filter(([, value]) => value);

  const portrait = (dialog = false) =>
    hasPhoto ? (
      <img
        src={player.image_url!}
        alt={player.name}
        loading={dialog ? "eager" : "lazy"}
        width={600}
        height={750}
        className={`h-full w-full object-cover ${dialog ? "" : "roster-photo"}`}
        onError={() => setFailedImage(player.image_url)}
      />
    ) : (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-ink">
        <PitchLines className="absolute inset-0 h-full w-full text-gold/15" />
        <span
          className="font-display text-7xl font-bold tracking-tight text-ink-foreground/20"
          aria-hidden
        >
          {initials}
        </span>
        <span className="sr-only">Portrait coming soon</span>
      </div>
    );

  return (
    <Dialog.Root>
      <article className="roster-card group flex h-full min-w-0 flex-col overflow-hidden rounded-md border border-gold/20 bg-ink text-ink-foreground">
        <div className="relative isolate aspect-[4/5] overflow-hidden">
          {portrait()}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink via-ink/10 to-transparent" />
          <span
            className="absolute left-5 top-5 border-b border-gold/60 pb-1 font-display text-xs text-gold"
            aria-hidden
          >
            {String(number).padStart(2, "0")}
          </span>
          <Shirt
            className="absolute right-5 top-5 h-4 w-4 text-white/50"
            strokeWidth={1.2}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-6">
            {player.position && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                {player.position}
              </p>
            )}
            <h3 className="mt-2 break-words text-2xl font-bold leading-tight sm:text-3xl">
              {player.name}
            </h3>
            {player.current_club && (
              <p className="mt-3 break-words text-sm text-ink-foreground/70">
                {player.current_club}
              </p>
            )}
          </div>
        </div>
        <div className="mt-auto px-6 pb-5">
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="booking-button flex min-h-12 w-full items-center justify-between gap-3 border-t border-white/15 pt-3 text-xs font-semibold text-ink-foreground/70 hover:text-gold"
              aria-label={`View profile for ${player.name}`}
            >
              View player profile
              <ArrowUpRight className="cta-arrow h-4 w-4 text-gold" aria-hidden />
            </button>
          </Dialog.Trigger>
        </div>
      </article>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <Dialog.Content className="player-profile-dialog fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-md border border-gold/30 bg-background shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none">
          <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gold/20 bg-background px-5">
            <span className="eyebrow home-eyebrow">Player profile · KMGMT</span>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close player profile"
                className="flex h-11 w-11 items-center justify-center rounded-md border border-gold/25 hover:border-gold"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </Dialog.Close>
          </div>
          <div className="grid sm:grid-cols-[0.85fr_1.15fr]">
            <div className="relative aspect-[5/4] overflow-hidden bg-ink sm:aspect-auto">
              <div className="absolute inset-0">{portrait(true)}</div>
            </div>
            <div className="min-w-0 p-6 sm:p-8">
              <Dialog.Title className="break-words font-display text-3xl font-bold leading-tight">
                {player.name}
              </Dialog.Title>
              <Dialog.Description className="mt-3 break-words text-sm text-muted-foreground">
                {player.position || "Player profile"}
                {player.current_club ? ` · ${player.current_club}` : ""}
              </Dialog.Description>
              {facts.length > 0 ? (
                <dl className="mt-6 divide-y divide-gold/20 border-t border-gold/20">
                  {facts.map(([label, value]) => (
                    <div key={label} className="py-4">
                      <dt className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium leading-relaxed">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-7 text-sm leading-relaxed text-muted-foreground">
                  More player information will be shared as the profile is updated.
                </p>
              )}
              <Dialog.Close asChild>
                <Button variant="outline" className="mt-5 w-full">
                  Back to players
                </Button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
