import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import SiloUnit from "./components/SiloUnit";
import ColorLegend from "./components/ColorLegend";

type SimulationMode = "idle" | "discharging";
type ExperienceMode = "normal" | "optimisation";

export default function App() {
  const [mode, setMode] = useState<SimulationMode>("idle");
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>("optimisation");
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
          onClick={() =>
            setMode(mode === "discharging" ? "idle" : "discharging")
          }
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
          onDischargeComplete={() => setMode("idle")}
        />
        <SiloUnit
          position={[0, 0, 0]}
          mode={mode}
          resetTrigger={resetTrigger}
          flowSpeed={flowSpeed}
          layers={silo2Layers}
          layerColors={activeSilo2Colors}
        />
        <SiloUnit
          position={[5, 0, 0]}
          mode={mode}
          resetTrigger={resetTrigger}
          flowSpeed={flowSpeed}
          layers={silo3Layers}
          layerColors={activeSilo3Colors}
        />

        <OrbitControls />
      </Canvas>
    </div>
  );
}
