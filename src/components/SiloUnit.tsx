import { useState, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type SimulationMode = "idle" | "discharging";

interface Particle {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  layer: number;
  initialPosition: THREE.Vector3;
}

interface ParticlesProps {
  mode: SimulationMode;
  resetTrigger: number;
  flowSpeed: number;
  layers: number;
  layerColors: string[];
  worldX: number;
  dischargeRunId: number;
  startDelaySeconds: number;
  onDischargeComplete?: () => void;
}

function Particles({
  mode,
  resetTrigger,
  flowSpeed,
  layers,
  layerColors,
  worldX,
  dischargeRunId,
  startDelaySeconds,
  onDischargeComplete,
}: ParticlesProps) {
  const PARTICLES_PER_LAYER = 6000;
  const LAYERS = layers;

  const SILO_RADIUS = 1.5;
  const CYLINDER_HEIGHT = 3.0;
  const CONE_HEIGHT = 1.5;
  const OUTLET_RADIUS = 0.12;

  const coneBottom = -CONE_HEIGHT;
  const OUTLET_EXIT_Y = coneBottom - 0.05;
  const CONVEYOR_SURFACE_Y = -3.22;
  const BELT_TRAVEL_SPEED = 0.9;
  const WORLD_BELT_DROP_START_X = 7.9;
  const WORLD_BELT_EXIT_X = 10.4;
  const CONTAINER_FLOOR_Y = -3.95;
  const BELT_DROP_START_X = WORLD_BELT_DROP_START_X - worldX;
  const BELT_EXIT_X = WORLD_BELT_EXIT_X - worldX;

  // 🔧 Layer realism tuning
  // Calculate total silo height and make layers take up 75% of it
  const TOTAL_SILO_HEIGHT = CYLINDER_HEIGHT + CONE_HEIGHT; // 4.5 units
  const LAYER_HEIGHT = (TOTAL_SILO_HEIGHT * 0.75) / LAYERS; // Dynamic height per layer
  const LAYER_MIX_RATIO = 0.4; //vertical mixing ratio
  const MIX_OFFSET = LAYER_HEIGHT * LAYER_MIX_RATIO;

  const [particles] = useState<Particle[]>(() => {
    const arr: Particle[] = [];

    const MIN_Y = coneBottom;
    const MAX_Y = coneBottom + LAYERS * LAYER_HEIGHT;

    for (let layer = 0; layer < LAYERS; layer++) {
      const layerBottomY = coneBottom + layer * LAYER_HEIGHT;

      for (let i = 0; i < PARTICLES_PER_LAYER; i++) {
        let y =
          layerBottomY +
          Math.random() * LAYER_HEIGHT +
          (Math.random() * 2 - 1) * MIX_OFFSET;

        // clamp vertical spill
        y = Math.max(MIN_Y, Math.min(MAX_Y, y));

        let maxRadius;
        if (y < 0) {
          const h = y - coneBottom;
          maxRadius =
            OUTLET_RADIUS + (h / CONE_HEIGHT) * (SILO_RADIUS - OUTLET_RADIUS);
        } else {
          maxRadius = SILO_RADIUS;
        }

        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * (maxRadius - 0.03);
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;

        const pos = new THREE.Vector3(x, y, z);

        arr.push({
          id: layer * PARTICLES_PER_LAYER + i,
          position: pos.clone(),
          velocity: new THREE.Vector3(),
          layer,
          initialPosition: pos.clone(),
        });
      }
    }

    return arr;
  });

  const instancedMeshRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const temp = useMemo(() => new THREE.Object3D(), []);
  const prevReset = useRef(resetTrigger);
  const prevDischargeRunId = useRef(dischargeRunId);
  const dischargeStartTime = useRef(0);
  const nextStopPercentage = useRef(33.3); // Track the next percentage to stop at

  useFrame((state, delta) => {
    const GRAVITY = -3.4 * flowSpeed;

    if (prevDischargeRunId.current !== dischargeRunId) {
      prevDischargeRunId.current = dischargeRunId;
      dischargeStartTime.current = state.clock.elapsedTime;
    }

    if (prevReset.current !== resetTrigger) {
      particles.forEach((p) => {
        p.position.copy(p.initialPosition);
        p.velocity.set(0, 0, 0);
      });
      prevReset.current = resetTrigger;
      nextStopPercentage.current = 33.3; // Reset target to first 33% mark
    }

    const elapsedSinceRunStart = state.clock.elapsedTime - dischargeStartTime.current;
    const isSiloEnabled =
      mode === "discharging" && elapsedSinceRunStart >= startDelaySeconds;

    // Count discharged particles (those that have been "killed")
    let dischargedCount = 0;
    const totalParticles = particles.length;

    particles.forEach((p) => {
      // Count particles that have been discharged (set to y=-1000)
      if (p.position.y <= -999) {
        dischargedCount++;
      }

      const isOutsideSilo = p.position.y < OUTLET_EXIT_Y;

      if (!isSiloEnabled && !isOutsideSilo) {
        p.velocity.set(0, 0, 0);
        return;
      }

      p.velocity.y += GRAVITY * delta;

      if (p.position.y < OUTLET_EXIT_Y) {
        p.position.addScaledVector(p.velocity, delta * flowSpeed);

        // Ride on conveyor before outlet.
        if (p.position.y <= CONVEYOR_SURFACE_Y && p.position.x < BELT_DROP_START_X) {
          const jitter = ((p.id * 9301 + 49297) % 233280) / 233280;
          const speedFactor = 0.65 + jitter * 0.7;
          p.position.y = CONVEYOR_SURFACE_Y;
          p.velocity.y = 0;
          p.velocity.x = BELT_TRAVEL_SPEED * flowSpeed * speedFactor;
          p.velocity.z = (jitter - 0.5) * 0.22;
        }

        // At conveyor end, let particles fall into the receiving container.
        if (p.position.x >= BELT_DROP_START_X) {
          if (p.position.y > CONVEYOR_SURFACE_Y - 0.02) {
            p.position.y = CONVEYOR_SURFACE_Y - 0.02;
          }
          p.velocity.y += GRAVITY * delta * 1.2;
          p.velocity.x = Math.max(p.velocity.x, 0.45 * flowSpeed);
          p.velocity.z *= 0.95;
        }

        if (p.position.y <= CONTAINER_FLOOR_Y || p.position.x > BELT_EXIT_X) {
          p.position.set(0, -1000, 0);
          p.velocity.set(0, 0, 0);
        }
        return;
      }

      const r = Math.hypot(p.position.x, p.position.z);

      let activeRadius;
      if (p.position.y < 0) {
        const h = p.position.y - coneBottom;
        activeRadius = OUTLET_RADIUS + (h / CONE_HEIGHT) * 0.18;
      } else {
        activeRadius = 0.35;
      }

      const heightBias = Math.max(
        0.45,
        1.25 - (p.position.y - coneBottom) / 3.0,
      );

      const zoneFactor = r < activeRadius ? 1.0 : r < 0.9 ? 0.45 : 0.25;

      p.velocity.multiplyScalar(0.9 + zoneFactor * 0.08);

      if (p.position.y < 0) {
        const pull = 0.6 * heightBias * flowSpeed;
        p.velocity.x -= p.position.x * pull * delta;
        p.velocity.z -= p.position.z * pull * delta;
      }

      p.position.addScaledVector(p.velocity, delta * flowSpeed);

      const dist = Math.hypot(p.position.x, p.position.z);
      let maxR;
      if (p.position.y < 0) {
        const h = p.position.y - coneBottom;
        maxR =
          OUTLET_RADIUS + (h / CONE_HEIGHT) * (SILO_RADIUS - OUTLET_RADIUS);
      } else {
        maxR = SILO_RADIUS;
      }

      if (dist > maxR - 0.02) {
        const s = (maxR - 0.02) / dist;
        p.position.x *= s;
        p.position.z *= s;
        p.velocity.x *= 0.5;
        p.velocity.z *= 0.5;
      }
    });

    // Check if current target percentage has been discharged
    const dischargePercentage = (dischargedCount / totalParticles) * 100;

    // Stop at 33.3%, 66.6%, and 99.9% marks
    if (
      dischargePercentage >= nextStopPercentage.current &&
      onDischargeComplete
    ) {
      // Increment target for next run (e.g. 33.3 -> 66.6 -> 99.9)
      nextStopPercentage.current += 33.3;
      onDischargeComplete();
    }

    for (let layer = 0; layer < LAYERS; layer++) {
      const mesh = instancedMeshRefs.current[layer];
      if (!mesh) continue;

      let idx = 0;
      particles.forEach((p) => {
        if (p.layer === layer) {
          temp.position.copy(p.position);
          temp.updateMatrix();
          mesh.setMatrixAt(idx++, temp.matrix);
        }
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {Array.from({ length: LAYERS }).map((_, layer) => (
        <instancedMesh
          key={layer}
          ref={(r) => (instancedMeshRefs.current[layer] = r)}
          args={[undefined, undefined, PARTICLES_PER_LAYER]}
        >
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color={layerColors[layer]} />
        </instancedMesh>
      ))}
    </group>
  );
}

function Silo() {
  const SILO_RADIUS = 1.5;
  const CYLINDER_HEIGHT = 3.0;
  const CONE_HEIGHT = 1.5;
  const OUTLET_RADIUS = 0.2;

  return (
    <group>
      <mesh position={[0, CYLINDER_HEIGHT / 2, 0]}>
        <cylinderGeometry
          args={[SILO_RADIUS, SILO_RADIUS, CYLINDER_HEIGHT, 32]}
        />
        <meshStandardMaterial
          color="#dddddd"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, -CONE_HEIGHT / 2 + 0.05, 0]}>
        <cylinderGeometry
          args={[SILO_RADIUS, OUTLET_RADIUS, CONE_HEIGHT, 32]}
        />
        <meshStandardMaterial
          color="#cccccc"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

interface SiloUnitProps {
  position: [number, number, number];
  mode: SimulationMode;
  resetTrigger: number;
  flowSpeed: number;
  layers: number;
  layerColors: string[];
  worldX: number;
  dischargeRunId: number;
  startDelaySeconds: number;
  onDischargeComplete?: () => void;
}

export default function SiloUnit({
  position,
  mode,
  resetTrigger,
  flowSpeed,
  layers,
  layerColors,
  worldX,
  dischargeRunId,
  startDelaySeconds,
  onDischargeComplete,
}: SiloUnitProps) {
  return (
    <group position={position}>
      <Silo />
      <Particles
        mode={mode}
        resetTrigger={resetTrigger}
        flowSpeed={flowSpeed}
        layers={layers}
        layerColors={layerColors}
        worldX={worldX}
        dischargeRunId={dischargeRunId}
        startDelaySeconds={startDelaySeconds}
        onDischargeComplete={onDischargeComplete}
      />
    </group>
  );
}
