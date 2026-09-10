import { Image as DreiImage, Grid, OrbitControls, useCursor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  getProjectCategoryLabel,
  projectCategories,
  type ProjectCategory,
} from "../../lib/project-taxonomy";

type Project = {
  title: string;
  slug: string;
  cover: string;
  summary: string;
  category: ProjectCategory;
  experiment: boolean;
  link: string | null;
};

const categories: Array<{ label: string; value: ProjectCategory }> = [
  // { label: "All projects", value: "all" },
  ...projectCategories,
];

const glassClass = "border border-border bg-background/90 backdrop-blur-md reduced-transparency:bg-background reduced-transparency:backdrop-blur-none";
const arrowClass = `${glassClass} pointer-events-auto size-[2.6rem] cursor-pointer rounded-control text-[1.3rem]`;
const infoHeadingClass = "mt-1 mb-[.45rem] text-[1.45rem] leading-none font-[550] tracking-[-.065em] text-foreground";
const infoCopyClass = "m-0 text-[.85rem] leading-normal text-muted-foreground";

export default function SpatialGallery({ projects }: { projects: Project[] }) {
  const [category, setCategory] = useState<ProjectCategory>("development-design");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  const [galleryReady, setGalleryReady] = useState(false);
  const markGalleryReady = useCallback(() => setGalleryReady(true), []);
  const visibleProjects = useMemo(
    () => projects.filter((project) => project.category === category),
    [category, projects],
  );
  const selectedProject = visibleProjects.find((project) => project.slug === selectedSlug) ?? null;
  const selectedIndex =
    selectedProject ?
      visibleProjects.findIndex((project) => project.slug === selectedProject.slug)
    : -1;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    setIsDark(document.documentElement.classList.contains("dark"));
    const theme = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark")),
    );
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    query.addEventListener("change", update);
    return () => {
      query.removeEventListener("change", update);
      theme.disconnect();
    };
  }, []);

  function selectRelative(offset: -1 | 1) {
    if (selectedIndex < 0 || visibleProjects.length < 2) return;
    const next = (selectedIndex + offset + visibleProjects.length) % visibleProjects.length;
    setSelectedSlug(visibleProjects[next].slug);
  }

  function openProject(project: Project) {
    if (!project.link) return;
    if (/^https?:\/\//.test(project.link))
      window.open(project.link, "_blank", "noopener,noreferrer");
    else window.location.assign(project.link);
  }

  return (
    <main className="relative h-dvh min-h-dvh w-full overflow-hidden rounded-none bg-background text-foreground [&_canvas]:absolute [&_canvas]:inset-0 [&_canvas]:size-full" aria-label="Interactive spatial portfolio gallery">
      <Canvas
        fallback={<p className="p-6 pt-28">WebGL is unavailable. <a className="underline" href="/work/">Browse the project list instead.</a></p>}
        aria-label="Interactive spatial portfolio gallery"
        camera={{ fov: 46, position: [0, 2.4, 8] }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onPointerMissed={() => setSelectedSlug(null)}
      >
        <Suspense fallback={null}>
          <GalleryWorld
            key={category}
            projects={visibleProjects}
            isDark={isDark}
            reducedMotion={reducedMotion}
            selectedSlug={selectedSlug}
            onSelect={setSelectedSlug}
            onReady={markGalleryReady}
          />
          <Grid
            args={[30, 30]}
            cellColor={isDark ? "#31363d" : "#bcc4cc"}
            cellSize={0.75}
            cellThickness={0.45}
            fadeDistance={15}
            fadeStrength={1.5}
            infiniteGrid
            position={[0, -0.85, 0]}
            sectionColor="#e85d39"
            sectionSize={3}
            sectionThickness={0.8}
          />
        </Suspense>
      </Canvas>

      {!galleryReady ? <GalleryLoadingState /> : null}

      <div className="pointer-events-none absolute inset-0 z-2 grid grid-cols-[1fr_auto_1fr] items-start p-6">
        <a className={`${glassClass} pointer-events-auto w-fit rounded-control px-[.8rem] py-[.65rem] text-sm leading-normal font-[650] hover:text-primary`} href="/">
          ← <span className="hidden md:inline-block">Portfolio</span>
        </a>
        <nav className={`${glassClass} pointer-events-auto flex justify-self-center gap-[.2rem] rounded-control p-1`} aria-label="Gallery categories">
          {categories.map((item) => {
            const count = projects.filter((project) => project.category === item.value).length;
            return (
              <button
                key={item.value}
                className="cursor-pointer rounded-[.45rem] border-0 bg-transparent px-[.8rem] py-2 text-sm leading-normal font-semibold text-foreground hover:text-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-35"
                type="button"
                disabled={count === 0}
                aria-pressed={category === item.value}
                onClick={() => {
                  if (item.value === category) return;
                  setGalleryReady(false);
                  setCategory(item.value);
                  setSelectedSlug(null);
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          className={`${glassClass} pointer-events-auto grid size-11 cursor-pointer place-items-center justify-self-end rounded-full text-[1.1rem]`}
          aria-label="Toggle color theme"
          onClick={() => {
            const next = !isDark;
            setIsDark(next);
            document.documentElement.classList.toggle("dark", next);
            try {
              localStorage.setItem("theme", next ? "dark" : "light");
            } catch {
              // Theme still works when storage is unavailable.
            }
          }}
        >
          {isDark ? "☀" : "☾"}
        </button>
      </div>

      {selectedProject && visibleProjects.length > 1 ?
        <div className="pointer-events-none absolute inset-x-4 top-1/2 z-2 flex -translate-y-1/2 justify-between" aria-label="Focused project navigation">
          <button className={arrowClass} type="button" aria-label="Next project" onClick={() => selectRelative(1)}>
            ←
          </button>
          <button className={arrowClass} type="button" aria-label="Previous project" onClick={() => selectRelative(-1)}>
            →
          </button>
        </div>
      : null}

      <div className={`${glassClass} pointer-events-auto absolute bottom-6 left-6 z-2 w-[min(30rem,calc(100%-3rem))] rounded-xl p-5`}>
        {selectedProject ?
          <>
            <p className="font-mono text-[.68rem] uppercase tracking-[.12em] text-primary">{projectLabel(selectedProject)}</p>
            <h2 className={infoHeadingClass}>{selectedProject.title}</h2>
            {/*<p className={infoCopyClass}>{selectedProject.summary}</p>*/}
            {selectedProject.link ?
              <button className="mt-[.9rem] cursor-pointer rounded-[.4rem] border-0 bg-primary px-3 py-[.6rem] text-[.8rem] font-[650] text-primary-foreground" type="button" onClick={() => openProject(selectedProject)}>
                Open project ↗
              </button>
            : null}
          </>
        : <>
            <h2 className={infoHeadingClass}>3D portfolio gallery</h2>
            <p className={infoCopyClass}>
              Drag to orbit. Select a frame to focus, select it again to open, or click outside to
              return.
            </p>
          </>
        }
      </div>

      <div className="sr-only">
        <h2>Projects in this gallery</h2>
        <ul>
          {visibleProjects.map((project) => (
            <li key={project.slug}>
              <a href={project.link ?? `/${project.slug}`}>{project.title}</a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function GalleryLoadingState() {
  return (
    <div
      className="absolute inset-0 z-4 grid place-items-center bg-background px-6 text-foreground"
      role="status"
      aria-label="Preparing 3D gallery"
      aria-busy="true"
    >
      <div className="grid w-full max-w-sm justify-items-center text-center">
        <span
          className="block size-10 animate-spin rounded-full border-2 border-border border-t-primary"
          aria-hidden="true"
        />
        <p className="mt-5 font-mono text-xs uppercase tracking-[.14em] text-primary">
          Preparing gallery
        </p>
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-card" aria-hidden="true">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}

function projectLabel(project: Project) {
  return `${project.experiment ? "Experiment · " : ""}${getProjectCategoryLabel(project.category)}`;
}

function GalleryWorld({
  projects,
  isDark,
  reducedMotion,
  selectedSlug,
  onSelect,
  onReady,
}: {
  projects: Project[];
  isDark: boolean;
  reducedMotion: boolean;
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  onReady: () => void;
}) {
  const radius = THREE.MathUtils.clamp(4.2 + projects.length * 0.12, 4.2, 7.5);
  const selectedFrame = useMemo(() => {
    const index = projects.findIndex((project) => project.slug === selectedSlug);
    if (index === -1) return null;
    const angle = getFrameAngle(index, projects.length);
    const [x, y, z] = getFramePosition(angle, index, radius);
    return { angle, position: [x, y + 0.2, z] as [number, number, number] };
  }, [projects, radius, selectedSlug]);

  useEffect(() => onReady(), [onReady]);

  return (
    <>
      <GalleryCameraRig reducedMotion={reducedMotion} selectedFrame={selectedFrame} />
      <color attach="background" args={[isDark ? "#0b0f12" : "#e9edf1"]} />
      <fog attach="fog" args={[isDark ? "#0b0f12" : "#e9edf1", 9, 19]} />
      <ambientLight intensity={isDark ? 1.3 : 2.2} />
      <directionalLight position={[4, 8, 4]} intensity={isDark ? 2.4 : 3.2} />
      <group position={[0, 0.2, 0]}>
        {projects.map((project, index) => {
          const angle = getFrameAngle(index, projects.length);
          return (
            <GalleryFrame
              key={project.slug}
              angle={angle}
              index={index}
              isDark={isDark}
              project={project}
              radius={radius}
              reducedMotion={reducedMotion}
              selected={selectedSlug === project.slug}
              onSelect={onSelect}
            />
          );
        })}
      </group>
    </>
  );
}

const CAMERA_TRANSITION_DURATION = 0.8;
const DESKTOP_FRAME_FOCUS_DISTANCE = 2.35;
const FOCUSED_FRAME_SCREEN_WIDTH = 0.78;
const FRAME_WIDTH = 1.76;
const SELECTED_FRAME_SCALE = 1.12;

type SelectedFrame = { angle: number; position: [number, number, number] };
type CameraPose = { lookAt: THREE.Vector3; position: THREE.Vector3 };

function getFrameAngle(index: number, projectCount: number) {
  return projectCount <= 5 ?
      Math.PI / 2 + (index - (projectCount - 1) / 2) * 0.55
    : (index / projectCount) * Math.PI * 2;
}

function getFramePosition(angle: number, index: number, radius: number): [number, number, number] {
  return [Math.cos(angle) * radius, index % 2 === 0 ? 0.15 : 0.55, -Math.sin(angle) * radius];
}

function GalleryCameraRig({
  reducedMotion,
  selectedFrame,
}: {
  reducedMotion: boolean;
  selectedFrame: SelectedFrame | null;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const homePose = useRef<CameraPose | null>(null);
  const transition = useRef({
    active: false,
    elapsed: 0,
    fromLookAt: new THREE.Vector3(),
    fromPosition: new THREE.Vector3(),
    toLookAt: new THREE.Vector3(),
    toPosition: new THREE.Vector3(),
  });
  const { camera, size } = useThree();

  useEffect(() => {
    const orbitControls = controls.current;
    if (!orbitControls) return;
    if (selectedFrame && !homePose.current)
      homePose.current = {
        lookAt: orbitControls.target.clone(),
        position: camera.position.clone(),
      };
    const destination =
      selectedFrame ?
        getFocusedCameraPose(
          selectedFrame,
          getResponsiveFocusDistance(camera, size.width / size.height),
        )
      : homePose.current;
    if (!destination) return;
    const nextTransition = transition.current;
    nextTransition.active = !reducedMotion;
    nextTransition.elapsed = 0;
    nextTransition.fromLookAt.copy(orbitControls.target);
    nextTransition.fromPosition.copy(camera.position);
    nextTransition.toLookAt.copy(destination.lookAt);
    nextTransition.toPosition.copy(destination.position);
    orbitControls.enabled = false;
    if (reducedMotion) {
      camera.position.copy(destination.position);
      orbitControls.target.copy(destination.lookAt);
      camera.lookAt(destination.lookAt);
      orbitControls.enabled = !selectedFrame;
      if (!selectedFrame) homePose.current = null;
    }
  }, [camera, reducedMotion, selectedFrame, size.height, size.width]);

  useFrame((_, delta) => {
    const orbitControls = controls.current;
    const currentTransition = transition.current;
    if (!orbitControls || !currentTransition.active) return;
    currentTransition.elapsed += delta;
    const linearProgress = Math.min(currentTransition.elapsed / CAMERA_TRANSITION_DURATION, 1);
    const progress = 1 - Math.pow(1 - linearProgress, 3);
    camera.position.lerpVectors(
      currentTransition.fromPosition,
      currentTransition.toPosition,
      progress,
    );
    orbitControls.target.lerpVectors(
      currentTransition.fromLookAt,
      currentTransition.toLookAt,
      progress,
    );
    camera.lookAt(orbitControls.target);
    if (linearProgress === 1) {
      currentTransition.active = false;
      orbitControls.enabled = !selectedFrame;
      if (!selectedFrame) homePose.current = null;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enableDamping={!reducedMotion}
      enabled={!selectedFrame}
      enablePan={false}
      makeDefault
      maxDistance={11}
      maxPolarAngle={Math.PI / 2.08}
      minDistance={3.8}
      minPolarAngle={Math.PI / 3.4}
      target={[0, 0.7, 0]}
    />
  );
}

function getResponsiveFocusDistance(camera: THREE.Camera, aspect: number) {
  if (!(camera instanceof THREE.PerspectiveCamera)) return DESKTOP_FRAME_FOCUS_DISTANCE;
  const verticalFov = THREE.MathUtils.degToRad(camera.getEffectiveFOV());
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const distanceToFitWidth =
    (FRAME_WIDTH * SELECTED_FRAME_SCALE) /
    (2 * Math.tan(horizontalFov / 2) * FOCUSED_FRAME_SCREEN_WIDTH);
  return Math.max(DESKTOP_FRAME_FOCUS_DISTANCE, distanceToFitWidth);
}

function getFocusedCameraPose(frame: SelectedFrame, focusDistance: number): CameraPose {
  const lookAt = new THREE.Vector3(...frame.position);
  const frameRotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0, frame.angle - Math.PI / 2, 0),
  );
  const position = new THREE.Vector3(0, 0, focusDistance)
    .applyQuaternion(frameRotation)
    .add(lookAt);
  return { lookAt, position };
}

function GalleryFrame({
  angle,
  index,
  isDark,
  project,
  radius,
  reducedMotion,
  selected,
  onSelect,
}: {
  angle: number;
  index: number;
  isDark: boolean;
  project: Project;
  radius: number;
  reducedMotion: boolean;
  selected: boolean;
  onSelect: (slug: string | null) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered, selected && project.link ? "grab" : "pointer");
  const position = useMemo(() => getFramePosition(angle, index, radius), [angle, index, radius]);

  useFrame((_, delta) => {
    if (!group.current || reducedMotion) return;
    const targetScale =
      selected ? SELECTED_FRAME_SCALE
      : hovered ? 1.04
      : 1;
    const nextScale = THREE.MathUtils.damp(group.current.scale.x, targetScale, 8, delta);
    group.current.scale.setScalar(nextScale);
  });

  return (
    <group
      ref={group}
      position={position}
      rotation={[0, angle - Math.PI / 2, 0]}
      scale={reducedMotion && selected ? SELECTED_FRAME_SCALE : 1}
    >
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          // if (selected) {
          //   if (project.link) openProject(project.link);
          //   else onSelect(null);
          //   return;
          // }
          onSelect(project.slug);
        }}
        onPointerEnter={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
      >
        <planeGeometry args={[FRAME_WIDTH, 1.2]} />
        <meshStandardMaterial
          color={
            selected ? "#e85d39"
            : isDark ?
              "#252a30"
            : "#c8d0d8"
          }
          metalness={0.2}
          roughness={0.68}
        />
        <DreiImage
          position={[0, 0, 0.012]}
          scale={[1.64, 1.08]}
          url={project.cover}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function openProject(href: string) {
  if (/^https?:\/\//.test(href)) window.open(href, "_blank", "noopener,noreferrer");
  else window.location.assign(href);
}
