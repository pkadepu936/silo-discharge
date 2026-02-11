import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import SiloUnit from "./components/SiloUnit";
import ColorLegend from "./components/ColorLegend";
import ConveyorBelt from "./components/ConveyorBelt";

type SimulationMode = "idle" | "discharging";
type ExperienceMode = "normal" | "optimisation";

export default function App() {
  const [mode, setMode] = useState<SimulationMode>("idle");
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>("optimisation");
  const [dischargeRunId, setDischargeRunId] = useState(0);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [flowSpeed, setFlowSpeed] = useState(0.45);

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
            SILO DISCHARGE
          </div>
          <div
            style={{
              fontSize: 56,
              lineHeight: 1,
              color: "#ffd666",
              textShadow: "0 0 18px rgba(255,214,102,0.55)",
            }}
          >
            ↓
          </div>
        </div>
      )}
      {experienceMode === "optimisation" && (
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            color: "white",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 48,
              lineHeight: 1,
              color: "#ffd666",
              textShadow: "0 0 18px rgba(255,214,102,0.55)",
            }}
          >
            ↑
          </div>
          <div
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(21, 27, 42, 0.88)",
              border: "1px solid rgba(255,255,255,0.26)",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 0.4,
            }}
          >
            MALT BLEND OPTIMISATION
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
            onClick={() => setExperienceMode("normal")}
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
            onClick={() => setExperienceMode("optimisation")}
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
          position={[-5, 0, 0]}
          mode={mode}
          resetTrigger={resetTrigger}
          flowSpeed={flowSpeed}
          layers={silo1Layers}
          layerColors={activeSilo1Colors}
          dischargeRunId={dischargeRunId}
          startDelaySeconds={0}
          onDischargeComplete={() => setMode("idle")}
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
        />
        <SiloUnit
          position={[5, 0, 0]}
          mode={mode}
          resetTrigger={resetTrigger}
          flowSpeed={flowSpeed}
          layers={silo3Layers}
          layerColors={activeSilo3Colors}
          dischargeRunId={dischargeRunId}
          startDelaySeconds={6}
        />
        <ConveyorBelt />

        <OrbitControls />
      </Canvas>
    </div>
  );
}
