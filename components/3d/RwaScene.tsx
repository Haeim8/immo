"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Float,
  ContactShadows,
  Text,
  Lightformer
} from "@react-three/drei";
import * as THREE from "three";

// Configuration des étapes
const STAGES = [
  { id: "house", label: "REAL ESTATE", sub: "Immeuble Paris 16e", type: "asset" },
  { id: "coin_house", label: "LIQUIDITY", sub: "12.5 ETH Supplied", type: "coin" },
  { id: "boat", label: "MARITIME", sub: "Yacht 45m", type: "asset" },
  { id: "coin_boat", label: "LIQUIDITY", sub: "85.2 ETH Supplied", type: "coin" },
];

function MorphingAsset({ stageIndex }: { stageIndex: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const isCoin = STAGES[stageIndex].type === "coin";
  const assetType = STAGES[stageIndex].id;

  // Couleurs : Cyan vif pour coin, Gris métallique pour asset
  const color = isCoin ? "#06b6d4" : "#cbd5e1"; 

  return (
    <group>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          {/* GÉOMÉTRIE */}
          {isCoin ? (
             <cylinderGeometry args={[1.6, 1.6, 0.25, 64]} />
          ) : assetType === "house" ? (
             <boxGeometry args={[2, 2, 2]} />
          ) : (
             <capsuleGeometry args={[0.8, 3, 4, 16]} />
          )}

          {/* MATÉRIAU STABLE (Native Three.js Physical Material) 
              Ceci remplace le MeshTransmissionMaterial qui faisait planter */}
          <meshPhysicalMaterial 
            color={color}
            roughness={0.1}
            metalness={0.1}
            transmission={0.9} // Effet verre
            thickness={1}
            transparent={true}
            opacity={1}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Float>

      {/* TEXTE SIMPLE (Sans police custom) */}
      <Text 
        position={[0, -2.8, 0]} 
        fontSize={0.3} 
        color="#1e293b" // Gris très foncé
        anchorX="center" 
        anchorY="middle"
      >
        {STAGES[stageIndex].label}
      </Text>
      
      <Text 
        position={[0, -3.2, 0]} 
        fontSize={0.15} 
        color="#64748b" 
        anchorX="center" 
        anchorY="middle"
      >
        {STAGES[stageIndex].sub}
      </Text>
    </group>
  );
}

export default function RwaScene() {
  const [stageIndex, setStageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full h-full absolute inset-0 z-0 pointer-events-none">
      {/* Configuration Canvas simplifiée pour éviter le crash 'alpha' */}
      <Canvas 
        camera={{ position: [0, 0, 7], fov: 40 }} 
        dpr={[1, 2]} 
        // On retire la prop 'gl' personnalisée qui causait le crash
      >
        
        {/* Lumières Studio */}
        <Environment resolution={256}>
          <group rotation={[-Math.PI / 3, 0, 1]}>
            <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
            <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
            <Lightformer form="rect" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[10, 1, 1]} />
          </group>
        </Environment>
        
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#06b6d4" />
        <pointLight position={[-10, -10, -10]} intensity={2} color="#a855f7" />

        <MorphingAsset stageIndex={stageIndex} />

        {/* J'AI SUPPRIMÉ EFFECT COMPOSER / BLOOM QUI CAUSAIT LE SHADER ERROR */}
        
        <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={20} blur={2} far={4.5} color="#000000" />
      </Canvas>
    </div>
  );
}