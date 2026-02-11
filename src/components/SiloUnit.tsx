import { useState, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type SimulationMode = "idle" | "discharging";

const CONTAINER_FLOOR_Y = -4.45;
const CONTAINER_MIN_WORLD_X = 7.62;
const CONTAINER_MAX_WORLD_X = 9.84;
const CONTAINER_HALF_Z = 0.82;

const GRID_X = 30;
const GRID_Z = 20;
const CELL_X = (CONTAINER_MAX_WORLD_X - CONTAINER_MIN_WORLD_X) / GRID_X;
const CELL_Z = (CONTAINER_HALF_Z * 2) / GRID_Z;
const ANGLE_OF_REPOSE_RAD = (32 * Math.PI) / 180;
const MAX_SLOPE = Math.tan(ANGLE_OF_REPOSE_RAD);
const HEIGHT_PER_CAPTURE = 0.0043;
const BELT_PULSE_FREQUENCY = 3.3;

const containerBedState = {
  heights: new Float32Array(GRID_X * GRID_Z),
  resetVersion: -1,
};

function gridIndex(ix: number, iz: number) {
  return iz * GRID_X + ix;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function worldToCell(worldX: number, worldZ: number) {
  const nx = (worldX - CONTAINER_MIN_WORLD_X) / (CONTAINER_MAX_WORLD_X - CONTAINER_MIN_WORLD_X);
  const nz = (worldZ + CONTAINER_HALF_Z) / (CONTAINER_HALF_Z * 2);
  return {
    ix: clamp(Math.floor(nx * GRID_X), 0, GRID_X - 1),
    iz: clamp(Math.floor(nz * GRID_Z), 0, GRID_Z - 1),
  };
}

function cellToWorld(ix: number, iz: number) {
  const worldX = CONTAINER_MIN_WORLD_X + (ix + 0.5) * CELL_X;
  const worldZ = -CONTAINER_HALF_Z + (iz + 0.5) * CELL_Z;
  return { worldX, worldZ };
}

function relaxToStableCell(startX: number, startZ: number) {
  let ix = startX;
  let iz = startZ;

  for (let step = 0; step < 18; step++) {
    const currentH = containerBedState.heights[gridIndex(ix, iz)];
    let bestIx = ix;
    let bestIz = iz;
    let bestDrop = 0;

    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dz === 0) continue;

        const nx = clamp(ix + dx, 0, GRID_X - 1);
        const nz = clamp(iz + dz, 0, GRID_Z - 1);
        if (nx === ix && nz === iz) continue;

        const neighborH = containerBedState.heights[gridIndex(nx, nz)];
        const dist = Math.hypot(dx * CELL_X, dz * CELL_Z);
        const allowedHeightDiff = MAX_SLOPE * dist;
        const unstableDrop = currentH - (neighborH + allowedHeightDiff);

        if (unstableDrop > bestDrop) {
          bestDrop = unstableDrop;
          bestIx = nx;
          bestIz = nz;
        }
      }
    }

    if (bestDrop <= 0.0001) break;
    ix = bestIx;
    iz = bestIz;
  }

  return { ix, iz };
}

interface Particle {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  layer: number;
  initialPosition: THREE.Vector3;
  captured: boolean;
  beltSpeedFactor: number;
  lateralBias: number;
  packetPhase: number;
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
  onContainerFillProgress?: (fillRatio: number) => void;
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
  onContainerFillProgress,
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
  const BELT_TRAVEL_SPEED = 1.02;
  const WORLD_BELT_DROP_START_X = 7.55;
  const WORLD_BELT_EXIT_X = 9.95;
  const BELT_HALF_WIDTH_Z = 0.56;
  const BELT_DROP_START_X = WORLD_BELT_DROP_START_X - worldX;
  const BELT_EXIT_X = WORLD_BELT_EXIT_X - worldX;
  const CONTAINER_MIN_X = CONTAINER_MIN_WORLD_X - worldX;
  const CONTAINER_MAX_X = CONTAINER_MAX_WORLD_X - worldX;

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
          captured: false,
          beltSpeedFactor: 0.75 + Math.random() * 0.55,
          lateralBias: (Math.random() - 0.5) * 0.03,
          packetPhase: Math.random() * Math.PI * 2,
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
  const lastReportedFill = useRef(-1);
  const nextStopPercentage = useRef(33.3); // Track the next percentage to stop at

  useFrame((state, delta) => {
    const GRAVITY = -3.4 * flowSpeed;

    if (containerBedState.resetVersion !== resetTrigger) {
      containerBedState.heights.fill(0);
      containerBedState.resetVersion = resetTrigger;
    }

    if (prevDischargeRunId.current !== dischargeRunId) {
      prevDischargeRunId.current = dischargeRunId;
      dischargeStartTime.current = state.clock.elapsedTime;
    }

    if (prevReset.current !== resetTrigger) {
      particles.forEach((p) => {
        p.position.copy(p.initialPosition);
        p.velocity.set(0, 0, 0);
        p.captured = false;
      });
      prevReset.current = resetTrigger;
      lastReportedFill.current = 0;
      onContainerFillProgress?.(0);
      nextStopPercentage.current = 33.3; // Reset target to first 33% mark
    }

    const elapsedSinceRunStart = state.clock.elapsedTime - dischargeStartTime.current;
    const isSiloEnabled =
      mode === "discharging" && elapsedSinceRunStart >= startDelaySeconds;

    // Count discharged particles (those that have been "killed")
    let dischargedCount = 0;
    let capturedCount = 0;
    const totalParticles = particles.length;

    particles.forEach((p) => {
      // Count particles captured in container as discharged mass.
      if (p.captured) {
        dischargedCount++;
        capturedCount++;
        return;
      }

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
          const pulse =
            0.32 +
            0.68 *
                Math.max(
                  0,
                  Math.sin(
                  state.clock.elapsedTime * BELT_PULSE_FREQUENCY -
                    p.position.x * 1.4 +
                    p.packetPhase,
                ),
              );
          const targetBeltSpeed =
            BELT_TRAVEL_SPEED * flowSpeed * p.beltSpeedFactor * pulse;

          p.position.y = CONVEYOR_SURFACE_Y;
          p.velocity.y = 0;
          p.velocity.x = THREE.MathUtils.lerp(p.velocity.x, targetBeltSpeed, 0.28);
          p.velocity.z = p.lateralBias * (0.45 + 0.55 * pulse);
          p.position.z = THREE.MathUtils.clamp(
            p.position.z,
            -BELT_HALF_WIDTH_Z,
            BELT_HALF_WIDTH_Z,
          );
        }

        // At conveyor end, let particles fall into the receiving container.
        if (p.position.x >= BELT_DROP_START_X) {
          if (p.position.y > CONVEYOR_SURFACE_Y - 0.02) {
            p.position.y = CONVEYOR_SURFACE_Y - 0.02;
          }
          p.velocity.x = Math.max(p.velocity.x, 0.45 * flowSpeed);
          p.velocity.z += (-p.position.z * 3.1) * delta;
          p.velocity.z *= 0.965;
        }

        const insideContainerX =
          p.position.x >= CONTAINER_MIN_X && p.position.x <= CONTAINER_MAX_X;
        const insideContainerZ = Math.abs(p.position.z) <= CONTAINER_HALF_Z;

        if (p.position.x >= CONTAINER_MIN_X - 0.02) {
          const wallPad = 0.05;
          const minX = CONTAINER_MIN_X + wallPad;
          const maxX = CONTAINER_MAX_X - wallPad;
          const maxZ = CONTAINER_HALF_Z - wallPad;

          if (p.position.x < minX) {
            p.position.x = minX;
            p.velocity.x = Math.abs(p.velocity.x) * 0.22;
          } else if (p.position.x > maxX) {
            p.position.x = maxX;
            p.velocity.x *= -0.22;
          }

          if (p.position.z < -maxZ) {
            p.position.z = -maxZ;
            p.velocity.z *= -0.22;
          } else if (p.position.z > maxZ) {
            p.position.z = maxZ;
            p.velocity.z *= -0.22;
          }

          if (insideContainerX && insideContainerZ) {
            const worldParticleX = p.position.x + worldX;
            const { ix: startIx, iz: startIz } = worldToCell(
              worldParticleX,
              p.position.z,
            );
            const impactHeight = containerBedState.heights[gridIndex(startIx, startIz)];
            const impactSurfaceY = CONTAINER_FLOOR_Y + impactHeight;

            // Switch to deposition model close to the current bed surface.
            if (p.position.y <= impactSurfaceY + 0.06) {
              const { ix, iz } = relaxToStableCell(startIx, startIz);
              const targetIdx = gridIndex(ix, iz);
              const nextHeight = containerBedState.heights[targetIdx] + HEIGHT_PER_CAPTURE;
              containerBedState.heights[targetIdx] = nextHeight;

              const { worldX: settledWorldX, worldZ: settledWorldZ } = cellToWorld(
                ix,
                iz,
              );
              p.position.set(
                settledWorldX - worldX,
                CONTAINER_FLOOR_Y + nextHeight,
                settledWorldZ,
              );
              p.velocity.set(0, 0, 0);
              p.captured = true;
              return;
            }
          }
        }

        if (p.position.x > BELT_EXIT_X || p.position.y < CONTAINER_FLOOR_Y - 2.2) {
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

    const fillRatio = capturedCount / totalParticles;
    if (
      onContainerFillProgress &&
      (Math.abs(fillRatio - lastReportedFill.current) > 0.005 ||
        fillRatio === 0 ||
        fillRatio >= 0.999)
    ) {
      lastReportedFill.current = fillRatio;
      onContainerFillProgress(fillRatio);
    }

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
  onContainerFillProgress?: (fillRatio: number) => void;
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
  onContainerFillProgress,
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
        onContainerFillProgress={onContainerFillProgress}
        onDischargeComplete={onDischargeComplete}
      />
    </group>
  );
}
