import { Canvas } from "@react-three/fiber";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  ArrowsOutIcon,
  CircleNotchIcon,
  DotsNineIcon,
  MoonIcon,
  PauseIcon,
  PlayIcon,
  ShuffleIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
  SunIcon,
} from "@phosphor-icons/react";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import GalleryWorld from "./spatial/GalleryWorld";
import {
  categories,
  type Arrangement,
  type Project,
  type ProjectCategory,
  type ScenePalette,
} from "./spatial/types";
import "./spatial/spatial-gallery.css";

class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function SpatialGallery({ projects }: { projects: Project[] }) {
  const [category, setCategory] =
    useState<ProjectCategory>("development-design");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [arrangement, setArrangement] = useState<Arrangement>("orbit");
  const [dark, setDark] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
  const [palette, setPalette] = useState<ScenePalette>({ background: "#0b0f12", foreground: "#e9edf1", muted: "#a0aab4", surface: "#20262c", border: "#38414a", accent: "#e89565" });
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [moving, setMoving] = useState(
    () =>
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [reset, setReset] = useState(0);
  const [sound, setSound] = useState(false);
  const [notice, setNotice] = useState("");
  const root = useRef<HTMLElement>(null);
  const startup = useRef<HTMLAudioElement | null>(null);
  const filmstrip = useRef<HTMLDivElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const soundEnabled = useRef(false);
  const visibleProjects = useMemo(
    () => projects.filter((project) => project.categories.includes(category)),
    [projects, category],
  );
  const selectedIndex = visibleProjects.findIndex(
    (project) => project.slug === selectedSlug,
  );
  const selectedProject = visibleProjects[selectedIndex] ?? null;
  const hoveredProject = visibleProjects.find(
    (project) => project.slug === hoveredSlug,
  );
  const markReady = useCallback(() => setReady(true), []);
  const markFailed = useCallback(() => setWebgl(false), []);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    setWebgl(Boolean(context));
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(media.matches);
      if (media.matches) setMoving(false);
    };
    update();
    media.addEventListener("change", update);
    const syncTheme = () => {
      setDark(document.documentElement.classList.contains("dark"));
      const styles = getComputedStyle(document.documentElement);
      // Canvas resolves the site's OKLCH tokens into sRGB for Three.js.
      const probe = document.createElement("canvas");
      probe.width = probe.height = 1;
      const context = probe.getContext("2d");
      if (!context) return;
      const resolve = (token: string) => {
        context.fillStyle = styles.getPropertyValue(token).trim();
        context.fillRect(0, 0, 1, 1);
        const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
        return `rgb(${r}, ${g}, ${b})`;
      };
      setPalette({ background: resolve("--background"), foreground: resolve("--foreground"), muted: resolve("--muted"), surface: resolve("--surface"), border: resolve("--border"), accent: resolve("--accent") });
    };
    syncTheme();
    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      media.removeEventListener("change", update);
      themeObserver.disconnect();
      startup.current?.pause();
      void audio.current?.close();
    };
  }, []);

  const chime = useCallback((note = 0) => {
    if (!soundEnabled.current || !audio.current) return;
    const context = audio.current;
    if (context.state !== "running") return;
    const now = context.currentTime;
    [0, 7, 12].forEach((interval, i) => {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value =
        174.61 * 2 ** ((interval + (note % 12)) / 12);
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(0.035, now + 0.025 + i * 0.025);
      envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      oscillator.connect(envelope).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.9);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
      };
    });
  }, []);
  const select = useCallback(
    (slug: string | null) => {
      setSelectedSlug(slug);
      setHoveredSlug(null);
      if (slug)
        chime(
          visibleProjects.findIndex((project) => project.slug === slug) * 2,
        );
    },
    [chime, visibleProjects],
  );
  const overview = useCallback(() => {
    select(null);
    setReset((value) => value + 1);
  }, [select]);
  const step = useCallback(
    (direction: number) => {
      if (!visibleProjects.length) return;
      const next =
        selectedIndex === -1
          ? direction > 0
            ? 0
            : visibleProjects.length - 1
          : (selectedIndex + direction + visibleProjects.length) %
            visibleProjects.length;
      select(visibleProjects[next].slug);
    },
    [selectedIndex, visibleProjects, select],
  );
  const sendPulse = useCallback(() => {
    setPulse((value) => value + 1);
    if (!soundEnabled.current) return;
    if (!startup.current) {
      startup.current = new Audio("/audio/win95_startup.mp3");
      startup.current.volume = 0.45;
    }
    startup.current.currentTime = 0;
    void startup.current.play().catch(() => setNotice("Sound is unavailable in this browser."));
  }, []);
  const stopDrift = useCallback(() => setMoving(false), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        (event.target.closest(
          "input, textarea, select, [contenteditable=true]",
        ) ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey)
      )
        return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
      if (event.key === "Escape") overview();
      if (
        event.code === "Space" &&
        !(
          event.target instanceof HTMLElement &&
          event.target.closest("button, a")
        )
      ) {
        event.preventDefault();
        if (!reducedMotion) setMoving((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, overview, reducedMotion]);
  useEffect(() => {
    filmstrip.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({
        behavior: reducedMotion ? "instant" : "smooth",
        block: "nearest",
        inline: "center",
      });
  }, [selectedSlug, reducedMotion]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <main
      ref={root}
      className={`spatial-gallery ${dark ? "sg-dark" : "sg-light"} ${selectedProject ? "sg-focused" : ""}`}
      aria-label="Interactive spatial portfolio gallery"
    >
      <div className={`sg-canvas ${hoveredSlug ? "sg-hovering" : ""}`}>
        {webgl === true && (
          <SceneBoundary onError={markFailed}>
            <Canvas
              camera={{ fov: 44, position: [12, 12, 22], near: 0.1, far: 100 }}
              dpr={[1, 1.5]}
              gl={{ antialias: true, powerPreference: "high-performance" }}
              onPointerMissed={(event) => {
                if (event.type === "click") select(null);
              }}
              aria-label="Orbiting project exhibits. Use the project navigator below for keyboard access."
            >
              <GalleryWorld
                projects={visibleProjects}
                selectedSlug={selectedSlug}
                arrangement={arrangement}
                dark={dark}
                palette={palette}
                moving={moving}
                reducedMotion={reducedMotion}
                pulse={pulse}
                reset={reset}
                onSelect={select}
                onHover={setHoveredSlug}
                onPulse={sendPulse}
                onReady={markReady}
                onInteract={stopDrift}
                onError={markFailed}
              />
            </Canvas>
          </SceneBoundary>
        )}
      </div>
      <div className="sg-vignette" aria-hidden="true" />
      <div className="sg-grain" aria-hidden="true" />

      <header className="sg-header">
        <a className="sg-brand" href="/" aria-label="Back to portfolio">
          <ArrowLeftIcon size={17} />
          <span>Back</span>
        </a>
        <nav className="sg-categories" aria-label="Gallery categories">
          {categories.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={category === item.value}
              disabled={
                !projects.some((project) =>
                  project.categories.includes(item.value),
                )
              }
              onClick={() => {
                setCategory(item.value);
                setSelectedSlug(null);
                setHoveredSlug(null);
                chime(3);
              }}
            >
              {item.short}
            </button>
          ))}
        </nav>
        <aside className="sg-scene-tools" aria-label="Scene controls">
        <div className="sg-arrangements">
          <button
            type="button"
            aria-pressed={arrangement === "orbit"}
            onClick={() => {
              setArrangement("orbit");
              overview();
            }}
          >
            <CircleNotchIcon size={19} /> Orbit
          </button>
          <button
            type="button"
            aria-pressed={arrangement === "constellation"}
            onClick={() => {
              setArrangement("constellation");
              overview();
            }}
          >
            <DotsNineIcon size={19} /> Constellation
          </button>
        </div>
          <div className="sg-utilities">
            <button
              type="button"
              className="sg-motion-button"
              aria-label={moving ? "Pause scene motion" : "Resume scene motion"}
              aria-pressed={moving}
              disabled={reducedMotion}
              title={
                reducedMotion
                  ? "Motion reduced to match your system preference"
                  : undefined
              }
              onClick={() => setMoving((value) => !value)}
            >
              {moving ? <PauseIcon size={15} /> : <PlayIcon size={15} />}{" "}

            </button>
            <button
              type="button"
              aria-label={
                sound ? "Mute interaction sounds" : "Enable interaction sounds"
              }
              aria-pressed={sound}
              title={sound ? "Sound on" : "Sound off"}
              onClick={async () => {
                try {
                  if (!audio.current) audio.current = new AudioContext();
                  await audio.current.resume();
                  if (sound) startup.current?.pause();
                  soundEnabled.current = !sound;
                  setSound(!sound);
                  if (!sound) chime(0);
                } catch {
                  setNotice("Sound is unavailable in this browser.");
                }
              }}
            >
              {sound ? (
                <SpeakerHighIcon size={18} />
              ) : (
                <SpeakerSlashIcon size={18} />
              )}
            </button>
            <button
              type="button"
              aria-label={
                dark
                  ? "Switch to light atmosphere"
                  : "Switch to dark atmosphere"
              }
              onClick={() => {
                document.documentElement.classList.toggle("dark", !dark);
                setDark(!dark);
                try {
                  localStorage.setItem(
                    "theme",
                    dark ? "light" : "dark",
                  );
                } catch {
                  /* Optional preference. */
                }
              }}
            >
              {dark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>
            <button
              type="button"
              className="sg-fullscreen"
              aria-label="Toggle fullscreen"
              onClick={async () => {
                try {
                  if (document.fullscreenElement)
                    await document.exitFullscreen();
                  else if (root.current?.requestFullscreen)
                    await root.current.requestFullscreen();
                  else setNotice("Fullscreen isn’t available in this browser.");
                } catch {
                  setNotice("Fullscreen isn’t available in this browser.");
                }
              }}
            >
              <ArrowsOutIcon size={18} />
            </button>
          </div>
        <button
          type="button"
          className="sg-surprise"
          disabled={visibleProjects.length < 2}
          onClick={() => {
            const candidates = visibleProjects.filter(
              (project) => project.slug !== selectedSlug,
            );
            if (candidates.length)
              select(
                candidates[Math.floor(Math.random() * candidates.length)].slug,
              );
          }}
        >
          <ShuffleIcon size={16} /> Surprise me
        </button>
        </aside>
      </header>

      {webgl === false && (
        <section className="sg-fallback" role="status">
          <p>The 3D scene isn’t available on this device.</p>
          <a className="sg-primary" href="/work/">Browse projects <ArrowRightIcon size={17} /></a>
        </section>
      )}
      {webgl !== false && !ready && (
        <div className="sg-loading" role="status">
          <CircleNotchIcon size={30} />
          <p>Setting things in motion</p>
          <a href="/work/">Browse the project list</a>
        </div>
      )}

      <div className="sg-bottom">
        <div className="sg-caption-row">
          <section className="sg-caption" aria-live="polite" aria-atomic="true">
            {selectedProject ? (
              <div key={selectedProject.slug} className="sg-project-copy">
                <h2>{selectedProject.title}</h2>
                <p>{selectedProject.summary}</p>
                {selectedProject.link && (
                  <a
                    className="sg-project-link"
                    href={selectedProject.link}
                    target={
                      /^https?:\/\//.test(selectedProject.link)
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      /^https?:\/\//.test(selectedProject.link)
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    Explore project <ArrowUpRightIcon size={18} />
                  </a>
                )}
              </div>
            ) : (
              <div className="sg-overview-copy">
                <p>
                  {hoveredProject
                    ? hoveredProject.title
                    : null}
                </p>
                <span>
                  {hoveredProject
                    ? "Click to take a closer look"
                    : "Drag to orbit · Scroll to zoom · Select to explore"}
                </span>
              </div>
            )}
          </section>
          <div className="sg-navigation">
            {selectedProject && (
              <button
                className="sg-overview-icon"
                onClick={overview}
                title="Return to overview"
                aria-label="Return to overview"
              >
                <CircleNotchIcon size={20} />
              </button>
            )}
            <button
              aria-label="Previous project"
              onClick={() => step(-1)}
              disabled={!visibleProjects.length}
            >
              <ArrowLeftIcon size={20} />
            </button>
            <span>
              <strong>
                {selectedIndex === -1
                  ? "—"
                  : String(selectedIndex + 1).padStart(2, "0")}
              </strong>{" "}
              / {String(visibleProjects.length).padStart(2, "0")}
            </span>
            <button
              aria-label="Next project"
              onClick={() => step(1)}
              disabled={!visibleProjects.length}
            >
              <ArrowRightIcon size={20} />
            </button>
          </div>
        </div>
        <div
          className="sg-filmstrip"
          ref={filmstrip}
          aria-label="Choose a project"
        >
          {visibleProjects.map((project) => (
            <button
              key={project.slug}
              type="button"
              aria-label={`Focus ${project.title}`}
              title={project.title}
              aria-pressed={selectedSlug === project.slug}
              onClick={() => select(project.slug)}
            >
              <img src={project.cover} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      </div>
      <div className="sg-notice" role="status">
        {notice}
      </div>
    </main>
  );
}
