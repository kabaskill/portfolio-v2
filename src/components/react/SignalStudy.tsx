import { createElement, useMemo, useState } from "react";

export default function SignalStudy() {
  const [shape, setShape] = useState(0);
  const [playing, setPlaying] = useState(false);
  const bars = useMemo(() => Array.from({ length: 28 }, (_, index) => {
    const height = 16 + Math.abs(Math.sin(index * 0.31 + shape * 1.4) * Math.cos(index * 0.16 + shape * 0.7)) * 84;
    return { height: `${height.toFixed(3)}%`, delay: `${index * -97}ms` };
  }), [shape]);

  return createElement(
    "div",
    { className: "signal-study grid grid-cols-[1.5fr_1fr] items-center gap-12 rounded-xl bg-card p-10 max-[767px]:grid-cols-1 max-[767px]:gap-8 max-[767px]:p-6" },
    createElement(
      "div",
      { className: "signal-study__wave flex h-[9.375rem] items-center gap-1", role: "img", "aria-label": playing ? "Moving abstract waveform" : "Abstract waveform" },
      bars.map((bar, index) => createElement("span", {
        key: index,
        className: playing ? "signal-study__bar signal-study__bar--playing min-w-0 flex-1 rounded-full bg-primary" : "signal-study__bar min-w-0 flex-1 rounded-full bg-primary",
        style: { height: bar.height, animationDelay: bar.delay },
      })),
    ),
    createElement(
      "div",
      null,
      createElement("h2", { className: "m-0 text-2xl font-semibold leading-tight" }, "A little rhythm."),
      createElement("p", { className: "mt-3 max-w-[22rem] text-sm leading-relaxed text-muted-foreground" }, "A visual sketch of rhythm. Change the shape, or set it in motion."),
      createElement(
        "div",
      { className: "signal-study__actions mt-5 flex flex-wrap gap-2" },
        createElement("button", { type: "button", className: "inline-flex min-h-11 items-center justify-center gap-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5", "aria-pressed": playing, onClick: () => setPlaying((value) => !value) }, createElement("span", { "aria-hidden": true }, playing ? "Ⅱ" : "▶"), playing ? "Pause" : "Play"),
        createElement("button", { type: "button", className: "inline-flex min-h-11 items-center justify-center gap-4 rounded-full border border-border bg-transparent px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background", onClick: () => setShape((value) => value + 1) }, "Reshape", createElement("span", { "aria-hidden": true }, "↻")),
      ),
    ),
  );
}
