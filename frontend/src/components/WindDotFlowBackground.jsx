import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Creates a soft-blurred square pixel texture for Three.js points
 * Matches the user request: "make the dot animation in bg as pixels not dots but maintaining the blur"
 */
function createBlurredPixelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Outer soft pixel blur glow
  ctx.shadowColor = 'rgba(215, 235, 250, 0.85)';
  ctx.shadowBlur = 10;

  // Luminous core square pixel
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(16, 16, 32, 32);

  // Soft atmospheric outer border
  ctx.strokeStyle = 'rgba(175, 215, 240, 0.35)';
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, 36, 36);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const WindDotFlowBackground = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      1,
      2000
    );
    camera.position.set(0, 140, 240);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Wind Flow Pixel Grid
    const ROWS = 65;
    const COLS = 65;
    const TOTAL_POINTS = ROWS * COLS;
    const SPACING = 7.5;

    const positions = new Float32Array(TOTAL_POINTS * 3);
    const initialPositions = new Float32Array(TOTAL_POINTS * 3);
    const scales = new Float32Array(TOTAL_POINTS);

    let idx = 0;
    const halfWidth = (COLS * SPACING) / 2;
    const halfDepth = (ROWS * SPACING) / 2;

    for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        const x = j * SPACING - halfWidth;
        const y = 0;
        const z = i * SPACING - halfDepth;

        positions[idx * 3] = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = z;

        initialPositions[idx * 3] = x;
        initialPositions[idx * 3 + 1] = y;
        initialPositions[idx * 3 + 2] = z;

        scales[idx] = 1.0;
        idx++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // 3. Low-Opacity Blurred Pixel Material
    const pixelTexture = createBlurredPixelTexture();
    const material = new THREE.PointsMaterial({
      size: 5.2,
      map: pixelTexture,
      transparent: true,
      opacity: 0.22, // Low opacity maintaining blur
      color: 0xd6e8f5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    particles.rotation.x = -Math.PI * 0.12; // tilted perspective
    scene.add(particles);

    // 4. Cursor Interaction Tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const mouseIntersection = new THREE.Vector3();

    const handleMouseMove = (event) => {
      mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 5. Continuous Wind Wave & Interaction Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const posAttr = geometry.attributes.position;
      const posArray = posAttr.array;

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Find cursor ground hit
      raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), camera);
      raycaster.ray.intersectPlane(plane, mouseIntersection);

      // Continuous Slow Wind Flow
      const windSpeed = elapsedTime * 0.65;

      for (let i = 0; i < TOTAL_POINTS; i++) {
        const i3 = i * 3;
        const origX = initialPositions[i3];
        const origZ = initialPositions[i3 + 2];

        // Harmonic multi-frequency wind ripples
        const wave1 = Math.sin(origX * 0.02 + origZ * 0.025 + windSpeed) * 11;
        const wave2 = Math.cos(origX * 0.035 - origZ * 0.018 + windSpeed * 1.3) * 6;
        const windGust = Math.sin((origX + origZ) * 0.015 + windSpeed * 0.8) * 4;

        let targetY = wave1 + wave2 + windGust;

        // Athletic velocity drift: subtle lateral shear proportional to wind wave velocity
        const lateralShear = Math.cos(origZ * 0.02 + windSpeed * 1.4) * 4.2;
        posArray[i3] = origX + lateralShear;

        // Interactive cursor wind gust deflection & kinetic speed impulse
        if (mouseIntersection) {
          const dx = origX - mouseIntersection.x;
          const dz = origZ - mouseIntersection.z;
          const distSq = dx * dx + dz * dz;
          const interactionRadiusSq = 95 * 95;

          if (distSq < interactionRadiusSq) {
            const factor = 1 - Math.sqrt(distSq) / 95;
            targetY += factor * 30;
            posArray[i3] += factor * 16; // directional kinetic speed impulse
          }
        }

        posArray[i3 + 1] = targetY;
      }

      posAttr.needsUpdate = true;

      // Gentle camera sway
      camera.position.x = mouse.x * 20;
      camera.position.y = 140 + mouse.y * 12;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 6. Responsive Window Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // 7. Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      pixelTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    />
  );
};

export default WindDotFlowBackground;
