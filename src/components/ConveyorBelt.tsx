export default function ConveyorBelt() {
  return (
    <group position={[0, -3.35, 0]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[15.5, 0.22, 1.8]} />
        <meshStandardMaterial
          color="#7f8796"
          transparent
          opacity={0.28}
          metalness={0.2}
          roughness={0.55}
        />
      </mesh>

      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[15.1, 0.04, 1.3]} />
        <meshStandardMaterial
          color="#c8d0de"
          transparent
          opacity={0.16}
          metalness={0.1}
          roughness={0.75}
        />
      </mesh>

      <mesh position={[-7.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.42, 1.35, 24]} />
        <meshStandardMaterial
          color="#98a2b5"
          transparent
          opacity={0.22}
          metalness={0.35}
          roughness={0.35}
        />
      </mesh>

      <mesh position={[7.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.42, 1.35, 24]} />
        <meshStandardMaterial
          color="#98a2b5"
          transparent
          opacity={0.22}
          metalness={0.35}
          roughness={0.35}
        />
      </mesh>

      <group position={[8.74, -0.62, 0]}>
        <mesh position={[0, -0.58, 0]}>
          <boxGeometry args={[2.3, 0.18, 1.9]} />
          <meshStandardMaterial
            color="#a7b0bf"
            transparent
            opacity={0.32}
            metalness={0.2}
            roughness={0.55}
          />
        </mesh>

        <mesh position={[0, 0.15, -0.86]}>
          <boxGeometry args={[2.3, 1.3, 0.16]} />
          <meshStandardMaterial
            color="#c4ccd8"
            transparent
            opacity={0.26}
            metalness={0.15}
            roughness={0.62}
          />
        </mesh>
        <mesh position={[0, 0.15, 0.86]}>
          <boxGeometry args={[2.3, 1.3, 0.16]} />
          <meshStandardMaterial
            color="#c4ccd8"
            transparent
            opacity={0.26}
            metalness={0.15}
            roughness={0.62}
          />
        </mesh>
        <mesh position={[-1.07, 0.15, 0]}>
          <boxGeometry args={[0.16, 1.3, 1.9]} />
          <meshStandardMaterial
            color="#c4ccd8"
            transparent
            opacity={0.26}
            metalness={0.15}
            roughness={0.62}
          />
        </mesh>
        <mesh position={[1.07, 0.15, 0]}>
          <boxGeometry args={[0.16, 1.3, 1.9]} />
          <meshStandardMaterial
            color="#c4ccd8"
            transparent
            opacity={0.26}
            metalness={0.15}
            roughness={0.62}
          />
        </mesh>
      </group>
    </group>
  );
}
