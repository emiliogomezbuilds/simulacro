"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import type { BlockedSide, ChosenExit, Intensity } from "@/lib/types";

// Business Bending slice: this is the real, working "simulation / 3D" part of
// the dragon stack. It is a genuine, interactive Three.js scene, built to run
// in a normal browser tab, WebXR-compatible in principle, but honestly not
// tested on real VR headset hardware this week (packet Scope Cut). The alarm
// fires at an unpredictable moment, not on a fixed countdown, matching the
// Blueprint's own resolution that a simulated or VR-triggered alarm moment is
// what makes the measurement mean something, not the headset itself.
export function ScenarioCanvas({
  intensity,
  blockedSide,
  onDecision,
}: {
  intensity: Intensity;
  blockedSide: BlockedSide;
  onDecision: (exit: ChosenExit, reactionTimeMs: number) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const alarmRef = useRef(false);
  const alarmFiredAtRef = useRef<number | null>(null);
  const decidedRef = useRef(false);
  const [alarm, setAlarm] = useState(false);
  const [elapsedLabel, setElapsedLabel] = useState("00:00.0");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 6);
    camera.lookAt(0, 1.2, -9);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Brighter ambient than before, the corridor needs to be legible on its
    // own so a person can actually read the scene, not just spot the one lit
    // shape (packet fix: layout review found the blocked side was nearly
    // invisible against the black background, turning the exercise into
    // "find the green thing" instead of "read the scene").
    const ambient = new THREE.AmbientLight(0x404040, 1.6);
    scene.add(ambient);

    const alarmLight = new THREE.PointLight(0x991b1b, 0, 20);
    alarmLight.position.set(0, 3, -2);
    scene.add(alarmLight);

    // Shorter corridor than before so both exits sit closer to the camera
    // and read as clearly separated, rather than shrinking toward a distant
    // vanishing point.
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 14), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -4);
    scene.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a1a10 });
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 14), wallMat);
    wallLeft.position.set(-3, 1.5, -4);
    scene.add(wallLeft);
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 14), wallMat);
    wallRight.position.set(3, 1.5, -4);
    scene.add(wallRight);

    // Which physical side is blocked changes every run (packet fix: it used
    // to be hardcoded to the left, so the correct button position could be
    // memorized after a couple of runs instead of actually being noticed).
    const debrisX = blockedSide === "left" ? -1.9 : 2.0;
    const clearX = blockedSide === "left" ? 2.0 : -1.9;

    // Debris now glows a visible hazard orange instead of a near-black
    // brown, so it reads as "something is wrong here" on its own, the same
    // way the clear exit reads as "safe" on its own.
    const debrisMat = new THREE.MeshStandardMaterial({
      color: 0x7c2d12,
      emissive: 0xea580c,
      emissiveIntensity: 0.35,
    });
    const debris = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 1.3), debrisMat);
    debris.position.set(debrisX, 1.2, -9);
    scene.add(debris);

    const clearMat = new THREE.MeshStandardMaterial({
      color: 0x14532d,
      emissive: 0x16a34a,
      emissiveIntensity: 0.4,
    });
    const clearDoor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.6, 0.25), clearMat);
    clearDoor.position.set(clearX, 1.2, -9.4);
    scene.add(clearDoor);

    let frameId = 0;
    const clock = new THREE.Clock();

    function animate() {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (alarmRef.current) {
        const pulse = (Math.sin(t * 8) + 1) / 2;
        alarmLight.intensity = intensity === "low" ? 1 + pulse * 1.5 : 2 + pulse * 4;
        alarmLight.color.set(intensity === "low" ? 0xb45309 : 0xdc2626);

        if (intensity === "standard") {
          camera.position.x = Math.sin(t * 30) * 0.04;
          camera.position.y = 1.5 + Math.cos(t * 26) * 0.03;
        }
      }

      renderer.render(scene, camera);
    }
    animate();

    // Unannounced trigger: fires at an unpredictable moment, not a fixed
    // countdown the person could anticipate.
    const delayMs = 2500 + Math.random() * 3500;
    const alarmTimeout = setTimeout(() => {
      alarmRef.current = true;
      alarmFiredAtRef.current = performance.now();
      setAlarm(true);
    }, delayMs);

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(alarmTimeout);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [intensity, blockedSide]);

  useEffect(() => {
    if (!alarm) return;
    const id = setInterval(() => {
      if (alarmFiredAtRef.current === null) return;
      const ms = performance.now() - alarmFiredAtRef.current;
      const s = (ms / 1000).toFixed(1);
      setElapsedLabel(`00:${s.padStart(4, "0")}`);
    }, 100);
    return () => clearInterval(id);
  }, [alarm]);

  function choose(exit: ChosenExit) {
    if (decidedRef.current || alarmFiredAtRef.current === null) return;
    decidedRef.current = true;
    const reactionTimeMs = performance.now() - alarmFiredAtRef.current;
    onDecision(exit, reactionTimeMs);
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg border" style={{ aspectRatio: "4 / 3" }}>
      <div ref={mountRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 top-0 p-3 text-center">
        {alarm ? (
          <p className="text-sm font-bold text-amber-400">
            ALARMA. Elige una salida. {elapsedLabel}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Simulacion en curso, espera...</p>
        )}
      </div>
      {alarm && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-3 px-3">
          <Button
            variant={blockedSide === "left" ? "destructive" : "default"}
            className={blockedSide === "left" ? undefined : "bg-green-700 hover:bg-green-800"}
            onClick={() => choose(blockedSide === "left" ? "blocked" : "clear")}
          >
            {blockedSide === "left" ? "Salida izquierda (bloqueada)" : "Salida izquierda (clara)"}
          </Button>
          <Button
            variant={blockedSide === "right" ? "destructive" : "default"}
            className={blockedSide === "right" ? undefined : "bg-green-700 hover:bg-green-800"}
            onClick={() => choose(blockedSide === "right" ? "blocked" : "clear")}
          >
            {blockedSide === "right" ? "Salida derecha (bloqueada)" : "Salida derecha (clara)"}
          </Button>
        </div>
      )}
    </div>
  );
}
