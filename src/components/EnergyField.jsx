import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

const ParticleSwarm = () => {
  const pointsRef = useRef(null);
  const { viewport, mouse } = useThree();

  const particleCount = 2000;
  
  const [positions, scales, colors, speeds] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const sca = new Float32Array(particleCount);
    const col = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount);
    
    const colorChoices = [
      new THREE.Color('#ff0000'), // Pure red
      new THREE.Color('#ff3333'), // Light red
      new THREE.Color('#8b0000'), // Dark red
      new THREE.Color('#ffffff'), // White core
      new THREE.Color('#050505'), // Obsidian
    ];

    for (let i = 0; i < particleCount; i++) {
      // Cylindrical distribution around a core
      const radius = 5 + Math.random() * 15;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 50;
      
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
      
      sca[i] = Math.random() * 2.0;
      
      const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;

      spd[i] = 0.02 + Math.random() * 0.05;
    }
    
    return [pos, sca, col, spd];
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
  }), []);

  const vertexShader = `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uPixelRatio;
    
    attribute float scale;
    attribute vec3 color;
    attribute float speed;
    
    varying vec3 vColor;
    
    void main() {
      vColor = color;
      
      vec3 pos = position;
      
      // Floating upwards
      pos.y += uTime * speed * 20.0;
      // Loop vertically
      pos.y = mod(pos.y + 25.0, 50.0) - 25.0;
      
      // Swirl around Y axis
      float angle = uTime * speed * 2.0;
      float s = sin(angle);
      float c = cos(angle);
      mat2 rot = mat2(c, -s, s, c);
      pos.xz = rot * pos.xz;
      
      // Mouse repulsion
      vec2 mouseDist = pos.xy - (uMouse * 15.0);
      float distSq = dot(mouseDist, mouseDist);
      if(distSq < 25.0) {
        pos.xy += normalize(mouseDist) * (25.0 - distSq) * 0.1;
      }
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      gl_PointSize = scale * uPixelRatio * (200.0 / -mvPosition.z);
    }
  `;

  const fragmentShader = `
    varying vec3 vColor;
    
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      
      // Soft glow edge
      float alpha = (0.5 - dist) * 2.0;
      alpha = pow(alpha, 1.5);
      
      gl_FragColor = vec4(vColor, alpha);
    }
  `;

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    uniforms.uTime.value = state.clock.elapsedTime;
    
    // Smooth mouse interpolation
    const targetX = (state.mouse.x * viewport.width) / 2;
    const targetY = (state.mouse.y * viewport.height) / 2;
    
    uniforms.uMouse.value.x += (targetX - uniforms.uMouse.value.x) * 0.05;
    uniforms.uMouse.value.y += (targetY - uniforms.uMouse.value.y) * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-scale" count={particleCount} array={scales} itemSize={1} />
        <bufferAttribute attach="attributes-color" count={particleCount} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-speed" count={particleCount} array={speeds} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const EnergyField = () => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 20], fov: 45 }} dpr={[1, 2]}>
        <ParticleSwarm />
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={2.5} radius={0.8} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default EnergyField;
