import { useEffect, useId, useRef, useState } from "react";

type Embed = {
  provider: "youtube" | "vimeo" | "spotify";
  title: string;
  url: string;
};

type GalleryImage = {
  src: string;
  alt: string;
  caption?: string;
};

type MediaItem =
  | { type: "image"; title: string; src: string; alt: string }
  | { type: "embed"; title: string; provider: Embed["provider"]; src: string };

interface Props {
  cover: GalleryImage;
  coverTitle: string;
  embeds?: Embed[];
  images?: GalleryImage[];
}

function getEmbedUrl(embed: Embed) {
  try {
    const url = new URL(embed.url);

    if (embed.provider === "youtube") {
      const host = url.hostname.replace(/^www\./, "");
      let id = host === "youtu.be" ? url.pathname.split("/").filter(Boolean)[0] : null;
      if ((host === "youtube.com" || host === "m.youtube.com") && url.pathname === "/watch") {
        id = url.searchParams.get("v");
      }
      if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
      const start = url.searchParams.get("t") ?? url.searchParams.get("start");
      return `https://www.youtube-nocookie.com/embed/${id}${start ? `?rel=0&start=${encodeURIComponent(start)}` : "?rel=0"}`;
    }

    if (embed.provider === "vimeo") {
      const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }

    if (url.hostname !== "open.spotify.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "embed") parts.shift();
    const [type, id] = parts;
    if (!type || !id || !["album", "episode", "playlist", "show", "track"].includes(type)) return null;
    return `https://open.spotify.com/embed/${type}/${id}`;
  } catch {
    return null;
  }
}

export default function MediaCollection({ cover, coverTitle, embeds = [], images = [] }: Props) {
  const items: MediaItem[] = [
    ...embeds.flatMap((embed) => {
      const src = getEmbedUrl(embed);
      return src ? [{ type: "embed" as const, title: embed.title, provider: embed.provider, src }] : [];
    }),
    ...images.map((image, index) => ({
      type: "image" as const,
      title: image.caption || `Supporting image ${index + 1}`,
      src: image.src,
      alt: image.alt,
    })),
    { type: "image" as const, title: `${coverTitle} cover`, src: cover.src, alt: cover.alt },
  ];
  const coverIndex = items.length - 1;
  const supportingItems = items.slice(0, coverIndex);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (activeIndex !== null && !dialog.open) dialog.showModal();
    if (activeIndex === null && dialog.open) dialog.close();

    const previousOverflow = document.body.style.overflow;
    if (activeIndex !== null) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (activeIndex === null) return;
      if (event.key === "ArrowLeft") setActiveIndex((index) => index === null ? null : (index - 1 + items.length) % items.length);
      if (event.key === "ArrowRight") setActiveIndex((index) => index === null ? null : (index + 1) % items.length);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, items.length]);

  const activeItem = activeIndex === null ? null : items[activeIndex];

  return (
    <div>
      <button
        type="button"
        className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-xl border-0 bg-card p-0"
        onClick={() => setActiveIndex(coverIndex)}
        aria-label={`Open ${coverTitle} cover in media viewer`}
      >
        <img className="block size-full p-1 object-contain transition-transform duration-500 ease-out group-hover:scale-[1.025]" src={cover.src} alt={cover.alt} loading="eager" />
        <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-[#18191dcc] text-xl text-white transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-105" aria-hidden="true">⌕</span>
      </button>

      {supportingItems.length > 0 ? (
        <section className="mt-7" aria-labelledby={`${titleId}-list`}>
          <h2 className="m-0 font-mono text-xs font-medium leading-snug tracking-wide" id={`${titleId}-list`}>Media</h2>
          <ol className="m-0 mt-3 list-none border-b border-border p-0">
            {supportingItems.map((item, index) => (
              <li className="border-t border-border" key={`${item.type}-${item.title}-${index}`}>
                <button className="grid w-full grid-cols-[1fr_auto] items-center gap-3 border-0 bg-transparent py-3.5 text-left transition-colors hover:text-primary" type="button" onClick={() => setActiveIndex(index)} aria-label={`Open ${item.title}`}>
                  <span>
                    <strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-sm font-[550]">{item.title}</strong>
                    <small className="mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[.62rem] uppercase tracking-[.1em] text-muted-foreground">{item.type === "image" ? "Image" : item.provider}</small>
                  </span>
                  <span aria-hidden="true">{item.type === "image" ? "⤢" : "▶"}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <dialog
        ref={dialogRef}
        className="media-dialog"
        aria-labelledby={titleId}
        onCancel={(event) => { event.preventDefault(); setActiveIndex(null); }}
        onClick={(event) => { if (event.target === event.currentTarget) setActiveIndex(null); }}
      >
        {activeItem ? (
          <div className="media-dialog__panel">
            <header>
              <div>
                <small>{activeItem.type === "image" ? "Image" : activeItem.provider}</small>
                <h2 id={titleId}>{activeItem.title}</h2>
              </div>
              <button type="button" className="media-dialog__close" onClick={() => setActiveIndex(null)} aria-label="Close media viewer">×</button>
            </header>
            <div className="media-dialog__stage">
              {activeItem.type === "image" ? (
                <img key={activeIndex} src={activeItem.src} alt={activeItem.alt} />
              ) : (
                <div className={`media-dialog__embed media-dialog__embed--${activeItem.provider}`}>
                  <iframe
                    key={activeIndex}
                    src={activeItem.src}
                    title={activeItem.title}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen={activeItem.provider !== "spotify"}
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              )}
            </div>
            {items.length > 1 ? (
              <nav aria-label="Media navigation">
                <button type="button" onClick={() => setActiveIndex((index) => index === null ? null : (index - 1 + items.length) % items.length)} aria-label="Previous media">←</button>
                <button type="button" onClick={() => setActiveIndex((index) => index === null ? null : (index + 1) % items.length)} aria-label="Next media">→</button>
              </nav>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
