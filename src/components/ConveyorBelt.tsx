export default function ConveyorBelt() {
  return (
    <group position={[0, -3.35, 0]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[15.5, 0.22, 1.8]} />
        <meshStandardMaterial
          color="#566178"
          transparent
          opacity={0.5}
          metalness={0.28}
          roughness={0.45}
        />
      </mesh>

      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[15.1, 0.04, 1.3]} />
        <meshStandardMaterial
          color="#9eaed0"
          transparent
          opacity={0.42}
          metalness={0.12}
          roughness={0.65}
          emissive="#233047"
          emissiveIntensity={0.35}
        />
      </mesh>

      <mesh position={[0, 0.2, -0.72]}>
        <boxGeometry args={[15.15, 0.14, 0.08]} />
        <meshStandardMaterial
          color="#b8c4dc"
          transparent
          opacity={0.58}
          metalness={0.18}
          roughness={0.48}
        />
      </mesh>

      <mesh position={[0, 0.2, 0.72]}>
        <boxGeometry args={[15.15, 0.14, 0.08]} />
        <meshStandardMaterial
          color="#b8c4dc"
          transparent
          opacity={0.58}
          metalness={0.18}
          roughness={0.48}
        />
      </mesh>

      <mesh position={[-7.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.42, 1.35, 24]} />
        <meshStandardMaterial
          color="#c4d0e8"
          transparent
          opacity={0.52}
          metalness={0.42}
          roughness={0.28}
        />
      </mesh>

      <mesh position={[7.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.42, 1.35, 24]} />
        <meshStandardMaterial
          color="#c4d0e8"
          transparent
          opacity={0.52}
          metalness={0.42}
          roughness={0.28}
        />
      </mesh>

      <group position={[8.74, -0.62, 0]}>
        <mesh position={[0, -0.58, 0]}>
          <boxGeometry args={[2.3, 0.18, 1.9]} />
          <meshStandardMaterial
            color="#a7b0bf"
            transparent
            opacity={0.42}
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>

        <mesh position={[0, 0.15, -0.86]}>
          <boxGeometry args={[2.3, 1.3, 0.16]} />
          <meshStandardMaterial
            color="#c4ccd8"
            transparent
            opacity={0.34}
            metalness={0.15}
            roughness={0.58}
          />
        </mesh>
        <mesh position={[0, 0.15, 0.86]}>
          <boxGeometry args={[2.3, 1.3, 0.16]} />
          <meshStandardMaterial
            color="#c4ccd8"
            transparent
            opacity={0.34}
            metalness={0.15}
            roughness={0.58}
          />
        </mesh>
        <mesh position={[-1.07, 0.15, 0]}>
          <boxGeometry args={[0.16, 1.3, 1.9]} />
          <meshStandardMaterial
            color="#c4ccd8"
            transparent
            opacity={0.34}
            metalness={0.15}
            roughness={0.58}
          />
        </mesh>
        <mesh position={[1.07, 0.15, 0]}>
          <boxGeometry args={[0.16, 1.3, 1.9]} />
          <meshStandardMaterial
            color="#c4ccd8"
            transparent
            opacity={0.34}
            metalness={0.15}
            roughness={0.58}
          />
        </mesh>
      </group>
    </group>
  );
}
