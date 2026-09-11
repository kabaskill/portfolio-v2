import { Image, Html, OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";
import type { Arrangement, Project, ScenePalette } from "./types";

const WIDTH = 2.45;
const HEIGHT = 1.62;
const UP = new THREE.Vector3(0, 1, 0);

export function exhibitPosition(index: number, count: number, arrangement: Arrangement) {
  const angle = (index / Math.max(count, 1)) * Math.PI * 2;
  const radius = Math.max(6.4, count * 0.44);
  if (arrangement === "constellation") {
    const r = radius * (index % 2 ? 1.16 : 0.78);
    return new THREE.Vector3(Math.sin(angle) * r, 1.5 + Math.sin(angle * 3) * 2.4, Math.cos(angle) * r);
  }
  return new THREE.Vector3(Math.sin(angle) * radius, 1.3 + Math.sin(angle * 2) * 0.6, Math.cos(angle) * radius);
}

type Props = {
  projects: Project[];
  selectedSlug: string | null;
  arrangement: Arrangement;
  dark: boolean;
  palette: ScenePalette;
  moving: boolean;
  reducedMotion: boolean;
  pulse: number;
  reset: number;
  onSelect: (slug: string | null) => void;
  onHover: (slug: string | null) => void;
  onPulse: () => void;
  onReady: () => void;
  onInteract: () => void;
  onError: () => void;
};

export default function GalleryWorld(props: Props) {
  const { dark, palette, projects, arrangement, selectedSlug, onReady } = props;
  const radius = Math.max(6.4, projects.length * 0.44);
  useEffect(onReady, [onReady]);
  return <>
    <ContextGuard onError={props.onError} />
    <color attach="background" args={[palette.background]} />
    <fog attach="fog" args={[palette.background, 28, 68]} />
    <ambientLight intensity={dark ? 1.2 : 2} />
    <directionalLight position={[5, 10, 8]} intensity={3} color={palette.foreground} />
    <directionalLight position={[-7, 3, -3]} intensity={2} color={palette.muted} />
    <pointLight position={[0, 3, 0]} color={palette.accent} intensity={12} distance={14} />
    <CameraRig {...props} />
    <Atmosphere palette={palette} dark={dark} moving={props.moving} reducedMotion={props.reducedMotion} />
    <OrbitalFloor radius={radius} palette={palette} />
    <KineticCore palette={palette} dark={dark} moving={props.moving} reducedMotion={props.reducedMotion} pulse={props.pulse} onPulse={props.onPulse} />
    {projects.map((project, index) => <Exhibit
      key={project.slug}
      project={project}
      index={index}
      position={exhibitPosition(index, projects.length, arrangement)}
      selected={selectedSlug === project.slug}
      dimmed={selectedSlug !== null && selectedSlug !== project.slug}
      {...props}
    />)}
  </>;
}

function ContextGuard({ onError }: { onError: () => void }) {
  const gl = useThree(state => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", onError);
    return () => canvas.removeEventListener("webglcontextlost", onError);
  }, [gl, onError]);
  return null;
}

function CameraRig({ projects, selectedSlug, arrangement, moving, reducedMotion, reset, onInteract }: Props) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  const flight = useRef({ active: true, time: 0, from: new THREE.Vector3(), fromTarget: new THREE.Vector3(), to: new THREE.Vector3(), toTarget: new THREE.Vector3() });
  const initialized = useRef(false);
  useEffect(() => {
    if (!controls.current) return;
    const index = projects.findIndex(project => project.slug === selectedSlug);
    const aspect = size.width / size.height;
    const radius = Math.max(6.4, projects.length * 0.44);
    const target = index >= 0 ? exhibitPosition(index, projects.length, arrangement) : new THREE.Vector3(0, 0.6, 0);
    let destination: THREE.Vector3;
    if (index >= 0) {
      // Approach from outside the orbit so neighboring exhibits cannot obscure the selection.
      const direction = target.clone().setY(0).normalize();
      if (direction.lengthSq() < 0.01) direction.set(0, 0, 1);
      const distance = Math.max(4.7, WIDTH / (2 * Math.tan(THREE.MathUtils.degToRad(44) / 2) * aspect * 0.79));
      destination = target.clone().addScaledVector(direction, distance);
      destination.y += 0.35;
      // Leave clear space below the exhibit for its description.
      target.y -= aspect < 0.8 ? 0.38 : 0.42;
    } else {
      const distance = radius * (aspect < 0.8 ? 3.8 : aspect < 1.2 ? 2.9 : 2.05);
      destination = new THREE.Vector3(distance * 0.58, distance * 0.64, distance);
    }
    const f = flight.current;
    f.from.copy(camera.position);
    f.fromTarget.copy(controls.current.target);
    f.to.copy(destination);
    f.toTarget.copy(target);
    f.time = 0;
    f.active = !reducedMotion;
    if (!initialized.current && !reducedMotion) f.from.multiplyScalar(1.18);
    initialized.current = true;
    if (reducedMotion) {
      camera.position.copy(f.to);
      controls.current.target.copy(f.toTarget);
      controls.current.update();
    }
  }, [projects, selectedSlug, arrangement, reset, reducedMotion, size.width, size.height, camera]);
  useFrame((_, delta) => {
    if (!controls.current || !flight.current.active) return;
    const f = flight.current;
    f.time = Math.min(1, f.time + Math.min(delta, 0.05) / 1.35);
    const t = f.time < 0.5 ? 4 * f.time ** 3 : 1 - (-2 * f.time + 2) ** 3 / 2;
    camera.position.lerpVectors(f.from, f.to, t);
    controls.current.target.lerpVectors(f.fromTarget, f.toTarget, t);
    controls.current.update();
    if (f.time === 1) f.active = false;
  });
  return <OrbitControls ref={controls} makeDefault enablePan={false}
    enableDamping={!reducedMotion} dampingFactor={0.065}
    autoRotate={moving && !reducedMotion && !selectedSlug} autoRotateSpeed={0.28}
    minDistance={selectedSlug ? 3 : 9} maxDistance={60}
    minPolarAngle={0.24} maxPolarAngle={Math.PI / 2.02}
    rotateSpeed={0.45} zoomSpeed={0.65}
    onStart={() => { flight.current.active = false; onInteract(); }}
  />;
}

// A failed cover must never take down the scene or hide the other exhibits.
class CoverBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

function Exhibit({ project, index, position, selected, dimmed, palette, moving, reducedMotion, onSelect, onHover }: Props & {
  project: Project; index: number; position: THREE.Vector3; selected: boolean; dimmed: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const frameMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const initialized = useRef(false);
  const clock = useRef(index * 0.7);
  const orientation = useMemo(() => new THREE.Quaternion(), []);
  const color = useMemo(() => new THREE.Color(), []);
  useEffect(() => () => { onHover(null); }, [onHover]);
  useFrame(({ camera }, delta) => {
    if (!group.current) return;
    const g = group.current;
    const dt = Math.min(delta, 0.05);
    if (moving && !reducedMotion) clock.current += dt;
    const y = position.y + (reducedMotion || selected ? 0 : Math.sin(clock.current * 0.75) * 0.13);
    const lerp = reducedMotion || !initialized.current ? 1 : 1 - Math.exp(-dt * 4);
    g.position.x = THREE.MathUtils.lerp(g.position.x, position.x, lerp);
    g.position.y = THREE.MathUtils.lerp(g.position.y, y, lerp);
    g.position.z = THREE.MathUtils.lerp(g.position.z, position.z, lerp);
    const angle = Math.atan2(camera.position.x - g.position.x, camera.position.z - g.position.z);
    orientation.setFromAxisAngle(UP, angle);
    g.quaternion.slerp(orientation, reducedMotion || !initialized.current ? 1 : 1 - Math.exp(-dt * 8));
    const scale = selected ? 1.08 : dimmed ? 0.65 : hovered ? 1.07 : 1;
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, scale, lerp));
    if (frameMaterial.current) {
      color.set(selected || hovered ? palette.accent : palette.border);
      frameMaterial.current.color.lerp(color, lerp);
      frameMaterial.current.emissiveIntensity = selected || hovered ? 0.45 : 0;
    }
    initialized.current = true;
  });
  return <group ref={group}>
    <mesh onClick={event => { if (event.delta > 5) return; event.stopPropagation(); onSelect(project.slug); }}
      onPointerOver={event => { event.stopPropagation(); setHovered(true); onHover(project.slug); }}
      onPointerOut={() => { setHovered(false); onHover(null); }}>
      <boxGeometry args={[WIDTH + 0.1, HEIGHT + 0.1, 0.09]} />
      <meshStandardMaterial ref={frameMaterial} color={palette.border} emissive={palette.accent} emissiveIntensity={0} metalness={0.65} roughness={0.3} />
      <CoverBoundary><Suspense fallback={null}>
          <Image url={project.cover} position={[0, 0, 0.051]} scale={[WIDTH, HEIGHT]} toneMapped={false} transparent opacity={dimmed ? 0.28 : 1} />
      </Suspense></CoverBoundary>
    </mesh>
    <mesh position={[0, -HEIGHT / 2 - 0.12, 0.02]}>
      <planeGeometry args={[WIDTH, 0.012]} />
      <meshBasicMaterial color={selected || hovered ? palette.accent : palette.muted} transparent opacity={0.7} />
    </mesh>
    {!selected && !dimmed && <Html center position={[0, -HEIGHT / 2 - 0.3, 0.08]} distanceFactor={12} zIndexRange={[8, 0]} style={{ pointerEvents: "none" }}>
      <div className={`sg-exhibit-label ${selected || hovered ? "is-active" : ""}`} style={{ opacity: dimmed ? 0.35 : 1 }}>
        <span>{project.title}</span>
      </div>
    </Html>}
  </group>;
}

const coreMaterialVertex = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const coreMaterialFragment = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  uniform vec3 uAccent;
  uniform float uTime;
  uniform float uDark;
  void main() {
    vec3 normal = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
    vec3 view = normalize(cameraPosition - vWorldPosition);
    vec3 reflected = reflect(-view, normal);
    float facing = clamp(dot(normal, view), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 2.4);
    // Broad reflections and a grazing-angle tint give the band a pearlescent sheen.
    float sheen = smoothstep(-0.55, 0.85, reflected.y);
    float shift = 0.5 + 0.5 * sin(reflected.x * 2.4 + reflected.z * 1.6 + uTime * 0.12);
    vec3 pearl = mix(vec3(0.67, 0.78, 0.96), vec3(1.0, 0.85, 0.66), shift);
    pearl = mix(pearl, vec3(0.74, 0.68, 0.94), fresnel * 0.25);
    vec3 copper = mix(uAccent * 0.16, uAccent * 0.85, sheen);
    vec3 color = mix(copper, pearl, sheen * 0.48 + fresnel * 0.35);
    float softbox = pow(max(dot(reflected, normalize(vec3(-0.4, 0.8, 0.5))), 0.0), 12.0);
    color += pearl * softbox * 0.38;
    color *= mix(0.78, 1.0, uDark);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function KineticCore({ dark, palette, moving, reducedMotion, pulse, onPulse }: Pick<Props, "dark" | "palette" | "moving" | "reducedMotion" | "pulse" | "onPulse">) {
  const sculpture = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const ripple = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const time = useRef(0);
  const burst = useRef(0);
  const signal = useRef(0);
  const uniforms = useMemo(() => ({
    uAccent: { value: new THREE.Color(palette.accent) },
    uTime: { value: 0 },
    uDark: { value: dark ? 1 : 0 },
  }), []);
  useEffect(() => {
    uniforms.uAccent.value.set(palette.accent);
    uniforms.uDark.value = dark ? 1 : 0;
  }, [palette.accent, dark, uniforms]);
  const geometry = useMemo(() => new ParametricGeometry((u, v, target) => {
    const angle = u * Math.PI * 2;
    const profile = v * Math.PI * 2;
    // Sweep a flattened oval through a half twist: a solid band with softly rounded edges.
    const width = 0.30 * Math.cos(profile);
    const thickness = 0.065 * Math.sin(profile);
    const twist = angle / 2;
    const radialOffset = width * Math.cos(twist) - thickness * Math.sin(twist);
    const height = width * Math.sin(twist) + thickness * Math.cos(twist);
    target.set((0.78 + radialOffset) * Math.cos(angle), height, (0.78 + radialOffset) * Math.sin(angle));
  }, 192, 32), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => { if (pulse > 0) { burst.current = 1; signal.current = 1; } }, [pulse]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (moving && !reducedMotion) time.current += dt;
    uniforms.uTime.value = time.current;
    burst.current = reducedMotion ? 0 : Math.max(0, burst.current - dt * 0.55);
    signal.current = reducedMotion ? 0 : Math.max(0, signal.current - dt / 3.2);
    if (sculpture.current) {
      sculpture.current.rotation.set(0.7 + Math.sin(time.current * 0.17) * 0.15, time.current * 0.12, 0.3);
      const scale = 1 + burst.current * 0.15 + (hovered ? 0.06 : 0);
      sculpture.current.scale.setScalar(reducedMotion ? scale : THREE.MathUtils.damp(sculpture.current.scale.x, scale, 6, dt));
    }
    if (rings.current) rings.current.rotation.y = -time.current * 0.09;
    if (ripple.current) {
      ripple.current.scale.setScalar(1 + (1 - signal.current) * 13);
      (ripple.current.material as THREE.MeshBasicMaterial).opacity = signal.current * 0.6;
    }
  });
  return <group position={[0, 1.45, 0]}>
    <group ref={sculpture}>
      <mesh onClick={e => { if (e.delta > 5) return; e.stopPropagation(); onPulse(); }} onPointerOver={e => { e.stopPropagation(); setHovered(true); }} onPointerOut={() => setHovered(false)}>
        <primitive object={geometry} attach="geometry" />
        <shaderMaterial vertexShader={coreMaterialVertex} fragmentShader={coreMaterialFragment} uniforms={uniforms} side={THREE.DoubleSide} />
      </mesh>
    </group>
    <group ref={rings}>
      {[0, 1, 2].map(i => <mesh key={i} rotation={[Math.PI / 2 + i * 0.52, i * 0.7, i * 0.4]}>
        <torusGeometry args={[2.05 + i * 0.16, 0.008, 6, 128]} />
        <meshBasicMaterial color={i === 1 ? palette.muted : palette.accent} transparent opacity={dark ? 0.45 : 0.65} />
      </mesh>)}
    </group>
    <mesh ref={ripple} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.7, 0]}>
      <ringGeometry args={[0.97, 1, 128]} />
      <meshBasicMaterial color={palette.accent} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  </group>;
}

function OrbitalFloor({ radius, palette }: { radius: number; palette: ScenePalette }) {
  const ticks = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 120; i++) {
      const a = i / 120 * Math.PI * 2;
      const r = radius + 1.8;
      const length = i % 10 === 0 ? 0.32 : 0.12;
      positions.push(Math.sin(a) * r, 0, Math.cos(a) * r, Math.sin(a) * (r + length), 0, Math.cos(a) * (r + length));
    }
    return new Float32Array(positions);
  }, [radius]);
  return <group position={[0, -1.1, 0]}>
    {[2.7, radius - 1.4, radius, radius + 1.8, radius + 3.8].map((r, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r, r + (i === 2 ? 0.018 : 0.009), 180]} />
      <meshBasicMaterial color={i === 2 ? palette.accent : palette.border} transparent opacity={i === 2 ? 0.4 : 0.22} side={THREE.DoubleSide} />
    </mesh>)}
    <lineSegments>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[ticks, 3]} /></bufferGeometry>
      <lineBasicMaterial color={palette.muted} transparent opacity={0.45} />
    </lineSegments>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
      <circleGeometry args={[radius + 4, 128]} />
      <meshStandardMaterial color={palette.surface} transparent opacity={0.28} roughness={0.4} metalness={0.6} />
    </mesh>
  </group>;
}

function Atmosphere({ dark, palette, moving, reducedMotion }: Pick<Props, "dark" | "palette" | "moving" | "reducedMotion">) {
  const dust = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const data = new Float32Array(720 * 3);
    // Deterministic positions keep the atmosphere stable across category changes.
    let seed = 2718;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < data.length; i += 3) {
      const a = random() * Math.PI * 2;
      const r = 4 + random() * 28;
      data[i] = Math.cos(a) * r;
      data[i + 1] = random() * 17 - 3;
      data[i + 2] = Math.sin(a) * r;
    }
    return data;
  }, []);
  useFrame((_, delta) => {
    if (dust.current && moving && !reducedMotion) dust.current.rotation.y += Math.min(delta, 0.05) * 0.009;
  });
  return <points ref={dust} raycast={() => null}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
    <pointsMaterial color={palette.muted} size={0.032} transparent opacity={dark ? 0.55 : 0.4} sizeAttenuation depthWrite={false} />
  </points>;
}
