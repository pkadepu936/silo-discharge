import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import SiloUnit from "./components/SiloUnit";
import ColorLegend from "./components/ColorLegend";
import ConveyorBelt from "./components/ConveyorBelt";

type SimulationMode = "idle" | "discharging";
type ExperienceMode = "normal" | "optimisation";
type SiloProfile = {
  fillRatio: number;
  lotWeights: [number, number, number];
};
const DEFAULT_HEEL_RATIO = 0.2;
const DEFAULT_TARGETS: [number, number, number] = [
  1 - DEFAULT_HEEL_RATIO,
  1 - DEFAULT_HEEL_RATIO,
  1 - DEFAULT_HEEL_RATIO,
];
const BREWQUANTA_TARGETS: [number, number, number] = [2 / 3, 1 / 6, 1 / 3];

function randomLotWeights(): [number, number, number] {
  const raw = [
    0.35 + Math.random() * 1.2,
    0.35 + Math.random() * 1.2,
    0.35 + Math.random() * 1.2,
  ];
  const total = raw[0] + raw[1] + raw[2];
  return [raw[0] / total, raw[1] / total, raw[2] / total];
}

function createRandomProfiles(): [SiloProfile, SiloProfile, SiloProfile] {
  return [
    { fillRatio: 0.6 + Math.random() * 0.28, lotWeights: randomLotWeights() },
    { fillRatio: 0.6 + Math.random() * 0.28, lotWeights: randomLotWeights() },
    { fillRatio: 0.6 + Math.random() * 0.28, lotWeights: randomLotWeights() },
  ];
}

function createBrewQuantaProfiles(): [SiloProfile, SiloProfile, SiloProfile] {
  return [
    { fillRatio: 0.88, lotWeights: [0.5, 0.35, 0.15] },
    { fillRatio: 0.85, lotWeights: [0.2, 0.45, 0.35] },
    { fillRatio: 0.86, lotWeights: [0.3, 0.25, 0.45] },
  ];
}

function profilesForMode(mode: ExperienceMode) {
  return mode === "optimisation" ? createBrewQuantaProfiles() : createRandomProfiles();
}

export default function App() {
  const [mode, setMode] = useState<SimulationMode>("idle");
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>("optimisation");
  const [dischargeRunId, setDischargeRunId] = useState(0);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [flowSpeed, setFlowSpeed] = useState(0.45);
  const [siloProfiles, setSiloProfiles] = useState<[SiloProfile, SiloProfile, SiloProfile]>(
    () => profilesForMode("optimisation"),
  );
  const [siloFillRatios, setSiloFillRatios] = useState<[number, number, number]>([
    0, 0, 0,
  ]);
  const [showBlendReady, setShowBlendReady] = useState(false);

  // Define layer configurations for each silo
  // Each silo has completely unique colors with no overlap
  const silo1Layers = 3;
  const [silo1Colors, setSilo1Colors] = useState([
    "#FFD700",
    "#FF6B35",
    "#4ECDC4",
  ]); // Gold, Orange, Teal

  const silo2Layers = 3;
  const [silo2Colors, setSilo2Colors] = useState([
    "#F38181",
    "#9B59B6",
    "#3498DB",
  ]); // Pink, Purple, Blue

  const silo3Layers = 3;
  const [silo3Colors, setSilo3Colors] = useState([
    "#2ECC71",
    "#E74C3C",
    "#F39C12",
  ]); // Green, Coral, Amber

  // Merge all colors for the legend
  const allColors = [...silo1Colors, ...silo2Colors, ...silo3Colors];
  const normalGray = "#9EA3A8";

  // Handle color change from the color picker
  const handleColorChange = (index: number, newColor: string) => {
    if (index < 3) {
      // Silo 1 colors (lots 0-2)
      const newColors = [...silo1Colors];
      newColors[index] = newColor;
      setSilo1Colors(newColors);
    } else if (index < 6) {
      // Silo 2 colors (lots 3-5)
      const newColors = [...silo2Colors];
      newColors[index - 3] = newColor;
      setSilo2Colors(newColors);
    } else {
      // Silo 3 colors (lots 6-8)
      const newColors = [...silo3Colors];
      newColors[index - 6] = newColor;
      setSilo3Colors(newColors);
    }
  };

  const activeSilo1Colors =
    experienceMode === "normal"
      ? Array.from({ length: silo1Layers }, () => normalGray)
      : silo1Colors;
  const activeSilo2Colors =
    experienceMode === "normal"
      ? Array.from({ length: silo2Layers }, () => normalGray)
      : silo2Colors;
  const activeSilo3Colors =
    experienceMode === "normal"
      ? Array.from({ length: silo3Layers }, () => normalGray)
      : silo3Colors;

  const activeTargets =
    experienceMode === "optimisation" ? BREWQUANTA_TARGETS : DEFAULT_TARGETS;
  const isTargetReached = siloFillRatios.every(
    (ratio, idx) => ratio >= Math.max(0, activeTargets[idx] - 0.01),
  );

  useEffect(() => {
    if (experienceMode !== "optimisation" || mode === "discharging" || !isTargetReached) {
      setShowBlendReady(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowBlendReady(true);
    }, 650);
    return () => clearTimeout(timer);
  }, [experienceMode, mode, isTargetReached]);

  useEffect(() => {
    if (mode === "discharging" && isTargetReached) {
      setMode("idle");
    }
  }, [mode, isTargetReached]);

  const updateSiloFill = (index: number, ratio: number) => {
    setSiloFillRatios((prev) => {
      if (Math.abs(prev[index] - ratio) < 0.002) return prev;
      const next: [number, number, number] = [...prev] as [number, number, number];
      next[index] = ratio;
      return next;
    });
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1a2e" }}>
      {experienceMode === "optimisation" && (
        <div
          style={{
            position: "absolute",
            top: 18,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            color: "white",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: 0.8,
              textShadow: "0 2px 16px rgba(0,0,0,0.45)",
            }}
          >
            BrewQuanta®
          </div>
          <div
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              background:
                "linear-gradient(90deg, rgba(255,158,66,0.95), rgba(255,214,102,0.95))",
              color: "#1f1f1f",
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: 0.4,
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            }}
          >
            Silo Discharge Simulation (SDS)
          </div>
        </div>
      )}
      {experienceMode === "optimisation" && mode === "discharging" && (
        <div
          style={{
            position: "absolute",
            top: 104,
            right: 26,
            zIndex: 3,
            pointerEvents: "none",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(12, 18, 36, 0.82)",
            color: "white",
            boxShadow: "0 8px 22px rgba(0,0,0,0.3)",
            textAlign: "left",
            minWidth: 240,
          }}
        >
          <div style={{ fontSize: 12, letterSpacing: 0.6, opacity: 0.75 }}>
            STRATEGY ACTIVE
          </div>
          <div style={{ marginTop: 3, fontSize: 14, fontWeight: 700 }}>
            S1: 2.0 lots | S2: 0.5 lot | S3: 1.0 lot
          </div>
        </div>
      )}
      {experienceMode === "optimisation" && showBlendReady && (
        <div
          style={{
            position: "absolute",
            left: "80%",
            top: "66%",
            transform: "translate(-50%, -100%)",
            zIndex: 3,
            pointerEvents: "none",
            padding: "14px 18px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.24)",
            background: "rgba(12, 18, 36, 0.86)",
            color: "white",
            boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
            textAlign: "left",
            minWidth: 280,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.4 }}>
            BrewQuanta® Blend Ready
          </div>
          <div style={{ marginTop: 4, fontSize: 14, opacity: 0.9 }}>
            Repeatable flavor. Predictable output.
          </div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          zIndex: 1,
          top: 20,
          left: 20,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          color: "white",
          width: 300,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              setExperienceMode("normal");
              setShowBlendReady(false);
              setSiloProfiles(profilesForMode("normal"));
              setSiloFillRatios([0, 0, 0]);
              setResetTrigger((v) => v + 1);
            }}
            style={{
              border:
                experienceMode === "normal"
                  ? "2px solid #ffffff"
                  : "1px solid transparent",
            }}
          >
            Default Mode
          </button>
          <button
            onClick={() => {
              setExperienceMode("optimisation");
              setShowBlendReady(false);
              setSiloProfiles(profilesForMode("optimisation"));
              setSiloFillRatios([0, 0, 0]);
              setResetTrigger((v) => v + 1);
            }}
            style={{
              border:
                experienceMode === "optimisation"
                  ? "2px solid #ffffff"
                  : "1px solid transparent",
            }}
          >
            BrewQuanta®
          </button>
        </div>
        <button
          onClick={() => {
            if (mode === "discharging") {
              setMode("idle");
              return;
            }
            setShowBlendReady(false);
            setSiloProfiles(profilesForMode(experienceMode));
            setSiloFillRatios([0, 0, 0]);
            setResetTrigger((v) => v + 1);
            setDischargeRunId((v) => v + 1);
            setMode("discharging");
          }}
        >
          {mode === "discharging" ? "Stop" : "Start"} Discharge
        </button>

        <button
          onClick={() => {
            setMode("idle");
            setFlowSpeed(0.45);
            setShowBlendReady(false);
            setSiloProfiles(profilesForMode(experienceMode));
            setSiloFillRatios([0, 0, 0]);
            setResetTrigger((v) => v + 1);
          }}
        >
          Reset
        </button>

        <label>
          Flow speed: {flowSpeed.toFixed(2)}
          <input
            type="range"
            min={0.3}
            max={1.5}
            step={0.05}
            value={flowSpeed}
            onChange={(e) => setFlowSpeed(Number(e.target.value))}
          />
        </label>

        {experienceMode === "optimisation" && (
          <ColorLegend allColors={allColors} onColorChange={handleColorChange} />
        )}
      </div>

      <Canvas camera={{ position: [8, 3, 10], fov: 60 }}>
        <color attach="background" args={["#0f0f1e"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} />

        {/* Three silos positioned side by side */}
        <SiloUnit
          position={[-3, 0, 0]}
          mode={mode}
          resetTrigger={resetTrigger}
          flowSpeed={flowSpeed}
          layers={silo1Layers}
          layerColors={activeSilo1Colors}
          dischargeRunId={dischargeRunId}
          startDelaySeconds={0}
          worldX={-3}
          targetDischargeRatio={activeTargets[0]}
          fillRatio={siloProfiles[0].fillRatio}
          layerVolumeWeights={siloProfiles[0].lotWeights}
          onContainerFillProgress={(ratio) => updateSiloFill(0, ratio)}
        />
        <SiloUnit
          position={[0, 0, 0]}
          mode={mode}
          resetTrigger={resetTrigger}
          flowSpeed={flowSpeed}
          layers={silo2Layers}
          layerColors={activeSilo2Colors}
          dischargeRunId={dischargeRunId}
          startDelaySeconds={3}
          worldX={0}
          targetDischargeRatio={activeTargets[1]}
          fillRatio={siloProfiles[1].fillRatio}
          layerVolumeWeights={siloProfiles[1].lotWeights}
          onContainerFillProgress={(ratio) => updateSiloFill(1, ratio)}
        />
        <SiloUnit
          position={[3, 0, 0]}
          mode={mode}
          resetTrigger={resetTrigger}
          flowSpeed={flowSpeed}
          layers={silo3Layers}
          layerColors={activeSilo3Colors}
          dischargeRunId={dischargeRunId}
          startDelaySeconds={6}
          worldX={3}
          targetDischargeRatio={activeTargets[2]}
          fillRatio={siloProfiles[2].fillRatio}
          layerVolumeWeights={siloProfiles[2].lotWeights}
          onContainerFillProgress={(ratio) => updateSiloFill(2, ratio)}
        />
        <ConveyorBelt />

        <OrbitControls />
      </Canvas>
    </div>
  );
}
