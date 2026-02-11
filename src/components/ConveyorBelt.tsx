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
    </group>
  );
}
