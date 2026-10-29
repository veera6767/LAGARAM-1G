import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generateProceduralEnvironmentMap } from '../three/proceduralMaterials';
import { buildRocketModel, BuiltRocketModel } from '../three/rocketGeometry';
import { CameraPreset } from '../types';
import { GestureCameraInput } from '../types/gesture';

interface RocketCanvasProps {
  selectedPartId: string | null;
  onSelectPart: (partId: string | null) => void;
  isExploded: boolean;
  explodeProgress: number; // 0.0 to 1.0 target
  onExplodeProgressChange?: (progress: number) => void;
  autoRotate: boolean;
  wireframe: boolean;
  showStabilityMarkers: boolean;
  finDetailScale?: boolean;
  cameraPresetTrigger?: { preset: CameraPreset; id: number } | null;
  resetCameraTrigger?: number;
  gestureInputRef?: React.MutableRefObject<GestureCameraInput | null>;
  partVisibility?: Record<string, boolean>;
  zoomTrigger?: { type: 'in' | 'out'; id: number } | null;
  autoFitOnExplodeTrigger?: number;
  collapseRestoreTrigger?: number;
}

export const RocketCanvas: React.FC<RocketCanvasProps> = ({
  selectedPartId,
  onSelectPart,
  isExploded,
  explodeProgress,
  autoRotate,
  wireframe,
  showStabilityMarkers,
  finDetailScale = false,
  cameraPresetTrigger,
  resetCameraTrigger,
  gestureInputRef,
  partVisibility,
  zoomTrigger,
  autoFitOnExplodeTrigger,
  collapseRestoreTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<BuiltRocketModel | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Animation state references
  const currentProgressRef = useRef(explodeProgress);
  const targetProgressRef = useRef(explodeProgress);
  const autoRotateRef = useRef(autoRotate);
  const onSelectPartRef = useRef(onSelectPart);

  // Camera animation target
  const cameraTargetPos = useRef<THREE.Vector3 | null>(null);
  const cameraTargetLookAt = useRef<THREE.Vector3 | null>(null);

  // Pre-explosion camera position cache for restoring framing upon collapse
  const preExplodeCamPos = useRef<THREE.Vector3 | null>(null);
  const preExplodeCamLookAt = useRef<THREE.Vector3 | null>(null);

  // Stability markers group ref
  const stabilityGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    targetProgressRef.current = explodeProgress;
  }, [explodeProgress]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  useEffect(() => {
    onSelectPartRef.current = onSelectPart;
  }, [onSelectPart]);

  // Handle part highlighting in 3D scene
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.highlightPart(selectedPartId);
    }
  }, [selectedPartId]);

  // Handle wireframe mode
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.setWireframe(wireframe);
    }
  }, [wireframe]);

  // Handle visual fin scale toggle (1.5x semi-span magnification for inspection)
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.setFinVisualScale(finDetailScale ? 1.5 : 1.0);
    }
  }, [finDetailScale]);

  // Handle stability markers visibility
  useEffect(() => {
    if (stabilityGroupRef.current) {
      stabilityGroupRef.current.visible = showStabilityMarkers;
    }
  }, [showStabilityMarkers]);

  // Handle individual part visibility toggles
  useEffect(() => {
    if (modelRef.current && partVisibility) {
      Object.entries(partVisibility).forEach(([partId, visible]) => {
        modelRef.current?.setPartVisibility?.(partId, visible);
      });
    }
  }, [partVisibility]);

  // Helper: Calculate framing transform to fit live bounding box into view
  const calculateFitTransform = useCallback((mode: 'full' | 'fit') => {
    if (!modelRef.current || !cameraRef.current || !controlsRef.current) return null;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const root = modelRef.current.rootGroup;

    // Compute bounding box of visible rocket meshes
    const bbox = new THREE.Box3().setFromObject(root);
    if (bbox.isEmpty()) return null;

    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    const fovRad = (camera.fov * Math.PI) / 180;
    const aspect = camera.aspect || 1;
    // 1.35 margin accounts for viewport HUD headers and bottom controls
    const margin = 1.35;
    const distV = (size.y * margin) / (2 * Math.tan(fovRad / 2));
    const maxHoriz = Math.max(size.x, size.z) * margin;
    const distH = maxHoriz / (2 * Math.tan(fovRad / 2) * aspect);
    const requiredDist = Math.max(distV, distH, 5.5);

    const lookAt = center.clone();
    let pos = new THREE.Vector3();

    if (mode === 'full') {
      // Direct front-facing full stack profile
      pos.set(0, center.y, center.z + requiredDist);
    } else {
      // 'fit' preserves current camera azimuth and elevation
      const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
      if (dir.lengthSq() < 0.0001) {
        dir.set(2.6, 0.4, 3.6).normalize();
      } else {
        dir.normalize();
      }
      pos.copy(center).addScaledVector(dir, requiredDist);
    }

    return { pos, lookAt, requiredDist };
  }, []);

  // Handle Camera Presets
  useEffect(() => {
    if (!cameraPresetTrigger || !controlsRef.current || !cameraRef.current) return;
    const { preset } = cameraPresetTrigger;

    const lookAt = new THREE.Vector3(0, 0.0, 0);
    const pos = new THREE.Vector3(2.6, 0.4, 3.6);

    switch (preset) {
      case 'hero':
        pos.set(2.6, 0.4, 3.6);
        lookAt.set(0, 0.0, 0);
        break;
      case 'fins':
        // Tail section (booster aft section & stabilizing fins)
        pos.set(1.15, -2.55, 0.70);
        lookAt.set(0, -2.20, 0);
        break;
      case 'engine':
        pos.set(1.2, -1.8, 1.6);
        lookAt.set(0, -1.8, 0);
        break;
      case 'recovery':
        pos.set(1.3, 0.0, 1.6);
        lookAt.set(0, 0.0, 0);
        break;
      case 'payload':
        pos.set(1.2, 0.8, 1.5);
        lookAt.set(0, 0.8, 0);
        break;
      case 'pcb': {
        const isExp = currentProgressRef.current > 0.05 || targetProgressRef.current > 0.05;
        if (isExp && modelRef.current?.getPcbPosition) {
          const pcbPos = modelRef.current.getPcbPosition();
          pos.set(pcbPos.x + 0.55, pcbPos.y + 0.15, pcbPos.z + 0.65);
          lookAt.copy(pcbPos);
        } else {
          pos.set(0.85, 0.85, 1.05);
          lookAt.set(0, 0.8125, 0);
        }
        break;
      }
      case 'phone': {
        const isExp = currentProgressRef.current > 0.05 || targetProgressRef.current > 0.05;
        if (isExp && modelRef.current?.getPhonePosition) {
          const phonePos = modelRef.current.getPhonePosition();
          pos.set(phonePos.x - 0.45, phonePos.y + 0.15, phonePos.z + 0.65);
          lookAt.copy(phonePos);
        } else {
          pos.set(-0.85, 0.85, 1.05);
          lookAt.set(0, 0.8125, 0);
        }
        break;
      }
      case 'nose':
        pos.set(1.2, 1.8, 1.5);
        lookAt.set(0, 1.8, 0);
        break;
      case 'full': {
        const fit = calculateFitTransform('full');
        if (fit) {
          pos.copy(fit.pos);
          lookAt.copy(fit.lookAt);
        } else {
          pos.set(0.0, 0.0, 6.2);
          lookAt.set(0, 0.0, 0);
        }
        break;
      }
      case 'fit': {
        const fit = calculateFitTransform('fit');
        if (fit) {
          pos.copy(fit.pos);
          lookAt.copy(fit.lookAt);
        }
        break;
      }
    }

    cameraTargetPos.current = pos;
    cameraTargetLookAt.current = lookAt;
  }, [cameraPresetTrigger, calculateFitTransform]);

  // Handle Reset Camera
  useEffect(() => {
    if (resetCameraTrigger && resetCameraTrigger > 0 && cameraRef.current && controlsRef.current) {
      cameraTargetPos.current = new THREE.Vector3(2.6, 0.4, 3.6);
      cameraTargetLookAt.current = new THREE.Vector3(0, 0.0, 0);
    }
  }, [resetCameraTrigger]);

  // Handle Zoom In / Zoom Out trigger (+ and - buttons or hotkeys)
  useEffect(() => {
    if (!zoomTrigger || !cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const factor = zoomTrigger.type === 'in' ? 0.8 : 1.25;

    cameraTargetPos.current = null;
    cameraTargetLookAt.current = null;

    const currentDist = camera.position.distanceTo(controls.target);
    const newDist = Math.max(
      controls.minDistance,
      Math.min(controls.maxDistance, currentDist * factor)
    );
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    const targetPos = new THREE.Vector3().copy(controls.target).addScaledVector(dir, newDist);

    cameraTargetPos.current = targetPos;
    cameraTargetLookAt.current = controls.target.clone();
  }, [zoomTrigger]);

  // Handle Auto-Fit on Explode
  useEffect(() => {
    if (!autoFitOnExplodeTrigger || !cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    // Cache pre-explosion framing to restore on collapse
    preExplodeCamPos.current = camera.position.clone();
    preExplodeCamLookAt.current = controls.target.clone();

    // Required distance for exploded stack (total height ~9.8, center Y ~0.8-1.0)
    const currentDist = camera.position.distanceTo(controls.target);
    const fovRad = (camera.fov * Math.PI) / 180;
    const aspect = camera.aspect || 1;
    const margin = 1.35;
    const explodedHeight = 9.8;
    const distV = (explodedHeight * margin) / (2 * Math.tan(fovRad / 2));
    const distH = (1.6 * margin) / (2 * Math.tan(fovRad / 2) * aspect);
    const targetDist = Math.max(distV, distH, 17.5);

    // Only smoothly dolly back if current camera distance is closer than targetDist
    if (currentDist < targetDist) {
      const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
      if (dir.lengthSq() < 0.0001) dir.set(2.6, 0.4, 3.6);
      dir.normalize();

      const targetLookAt = new THREE.Vector3(0, 0.8, 0);
      const newPos = new THREE.Vector3().copy(targetLookAt).addScaledVector(dir, targetDist);

      cameraTargetPos.current = newPos;
      cameraTargetLookAt.current = targetLookAt;
    }
  }, [autoFitOnExplodeTrigger]);

  // Handle Restore Framing on Collapse
  useEffect(() => {
    if (!collapseRestoreTrigger || !cameraRef.current || !controlsRef.current) return;
    if (preExplodeCamPos.current && preExplodeCamLookAt.current) {
      cameraTargetPos.current = preExplodeCamPos.current.clone();
      cameraTargetLookAt.current = preExplodeCamLookAt.current.clone();
    }
  }, [collapseRestoreTrigger]);

  // Three.js Mount & Animation Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Deep space gradient background
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 512;
    bgCanvas.height = 512;
    const bgCtx = bgCanvas.getContext('2d')!;
    const grad = bgCtx.createRadialGradient(256, 256, 40, 256, 256, 360);
    grad.addColorStop(0, '#040508');
    grad.addColorStop(0.65, '#05070f');
    grad.addColorStop(1, '#090b1c');
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, 512, 512);

    const bgTexture = new THREE.CanvasTexture(bgCanvas);
    bgTexture.colorSpace = THREE.SRGBColorSpace;
    scene.background = bgTexture;
    // FogExp2 with low density 0.005 so at max zoom distance (50-60) scene elements remain clearly visible
    scene.fog = new THREE.FogExp2(0x040508, 0.005);

    // 2. Camera setup - far plane increased to 350 for extended zoom-out range
    const initialWidth = container.clientWidth || window.innerWidth || 800;
    const initialHeight = container.clientHeight || window.innerHeight || 600;
    const camera = new THREE.PerspectiveCamera(
      42,
      initialWidth / initialHeight,
      0.1,
      350
    );
    camera.position.set(2.6, 0.4, 3.6);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Procedural Environment Map for photorealistic stainless steel reflections
    const envRenderTarget = generateProceduralEnvironmentMap(renderer);
    scene.environment = envRenderTarget.texture;

    // 5. Star-field / Cosmic Particle Dust Layer behind rocket
    const particleCount = 750;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color(0x00e5ff), // Electric Cyan
      new THREE.Color(0x2fd8ff), // Neon Blue
      new THREE.Color(0x818cf8), // Cosmic Violet
      new THREE.Color(0xffffff), // Stellar White
    ];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 6.0 + Math.random() * 28.0;
      const y = -8.0 + Math.random() * 26.0;

      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;

      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const starDust = new THREE.Points(particleGeo, particleMat);
    scene.add(starDust);

    // 6. Dramatic Futuristic Lighting (Cyan Rim + Crisp Neutral Key + Dedicated Nose Rim)
    // 6a. Key Light (Crisp Neutral Softbox)
    const keyLight = new THREE.DirectionalLight(0xf0f6ff, 2.3);
    keyLight.position.set(5.5, 7.5, 6.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0002;
    scene.add(keyLight);

    // 6b. Primary Rim Light (Electric Cyan Dramatic Rim)
    const rimLight = new THREE.DirectionalLight(0x00e5ff, 3.8);
    rimLight.position.set(-6.5, 4.5, -6.5);
    scene.add(rimLight);

    // 6c. Dedicated Nose Cone Rim Light
    const noseRimLight = new THREE.DirectionalLight(0xe8f4ff, 2.5);
    noseRimLight.position.set(-2.5, 4.5, -3.0);
    scene.add(noseRimLight);

    // 6c-2. Dedicated Rear-Left Fin Rim Light
    const finRimLight = new THREE.DirectionalLight(0xd4f0e6, 2.2);
    finRimLight.position.set(-4.5, -1.8, -3.5);
    scene.add(finRimLight);

    // 6d. Secondary Rim Light (Cool Blue Edge Glint)
    const rimLight2 = new THREE.DirectionalLight(0x2fd8ff, 2.0);
    rimLight2.position.set(6.0, -1.2, -5.0);
    scene.add(rimLight2);

    // 6e. Fill Light (Deep Cyan-Indigo Fill)
    const fillLight = new THREE.DirectionalLight(0x10283d, 1.2);
    fillLight.position.set(-5.0, 1.5, 4.5);
    scene.add(fillLight);

    // 6f. Upward Holographic Bounce Light
    const groundBounceLight = new THREE.DirectionalLight(0x002c42, 0.8);
    groundBounceLight.position.set(0, -5, 0);
    scene.add(groundBounceLight);

    // Ambient space light
    const ambientLight = new THREE.AmbientLight(0x050912, 1.2);
    scene.add(ambientLight);

    // 7. Glowing Holographic Grid Floor (situated just below rocket tail at -2.5)
    const gridY = -2.75;
    const holographicGrid = new THREE.GridHelper(26, 52, 0x00e5ff, 0x00334d);
    holographicGrid.position.y = gridY;
    if (holographicGrid.material instanceof THREE.Material) {
      holographicGrid.material.transparent = true;
      holographicGrid.material.opacity = 0.45;
    }
    scene.add(holographicGrid);

    // Concentric glowing holographic launch rings
    const ringsGroup = new THREE.Group();
    const ringRadii = [1.2, 2.5, 4.2, 6.5, 9.0, 12.0];
    const ringMaterials: THREE.MeshBasicMaterial[] = [];
    const ringGeometries: THREE.BufferGeometry[] = [];

    ringRadii.forEach((r, idx) => {
      const ringGeom = new THREE.RingGeometry(r - 0.018, r + 0.018, 80);
      ringGeom.rotateX(-Math.PI / 2);
      ringGeometries.push(ringGeom);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? 0x00e5ff : 0x0099cc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: idx === 0 ? 0.7 : 0.4,
        blending: THREE.AdditiveBlending,
      });
      ringMaterials.push(ringMat);
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.y = gridY + 0.002;
      ringsGroup.add(ringMesh);
    });
    scene.add(ringsGroup);

    // Rotating holographic scanner beam on floor
    const scannerGeo = new THREE.PlaneGeometry(12.0, 0.04);
    scannerGeo.rotateX(-Math.PI / 2);
    const scannerMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const scannerBeam = new THREE.Mesh(scannerGeo, scannerMat);
    scannerBeam.position.y = gridY + 0.003;
    scene.add(scannerBeam);

    // Ground shadow receiver
    const shadowPlaneGeo = new THREE.PlaneGeometry(24, 24);
    shadowPlaneGeo.rotateX(-Math.PI / 2);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.55 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.position.y = gridY + 0.001;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 8. Rocket Model
    const rocket = buildRocketModel();
    rocket.setFinVisualScale(finDetailScale ? 1.5 : 1.0);
    scene.add(rocket.rootGroup);
    modelRef.current = rocket;

    // 9. Stability Markers (Center of Gravity & Center of Pressure)
    const stabilityGroup = new THREE.Group();
    stabilityGroup.name = 'StabilityMarkers';
    stabilityGroup.visible = showStabilityMarkers;
    const stabilityDisposables: (() => void)[] = [];

    const cgY = -0.725;
    const cpY = -1.325;
    const markerX = 0.38;

    // Center of Gravity (CG) marker (amber glow)
    const cgGlyph = createCheckeredGlyph('#FFB300', 'CG: 1290 mm');
    cgGlyph.group.position.set(markerX, cgY, 0);
    stabilityGroup.add(cgGlyph.group);
    stabilityDisposables.push(cgGlyph.dispose);

    // Center of Pressure (CP) marker (electric cyan glow)
    const cpGlyph = createCheckeredGlyph('#00E5FF', 'CP: 1530 mm');
    cpGlyph.group.position.set(markerX, cpY, 0);
    stabilityGroup.add(cpGlyph.group);
    stabilityDisposables.push(cpGlyph.dispose);

    // Line connecting CG and CP
    const marginLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(markerX, cgY, 0),
      new THREE.Vector3(markerX, cpY, 0),
    ]);
    const marginLineMat = new THREE.LineDashedMaterial({
      color: 0x00e5ff,
      dashSize: 0.04,
      gapSize: 0.02,
      scale: 1,
    });
    const marginLine = new THREE.Line(marginLineGeo, marginLineMat);
    marginLine.computeLineDistances();
    stabilityGroup.add(marginLine);
    stabilityDisposables.push(() => {
      marginLineGeo.dispose();
      marginLineMat.dispose();
    });

    // Static margin callout label sprite between CG and CP
    const marginBadge = createMarginBadge('MARGIN: +2.38 CAL (TARGET: 2.0-2.5)');
    marginBadge.group.position.set(markerX + 0.04, (cgY + cpY) / 2, 0);
    stabilityGroup.add(marginBadge.group);
    stabilityDisposables.push(marginBadge.dispose);

    scene.add(stabilityGroup);
    stabilityGroupRef.current = stabilityGroup;

    // 10. OrbitControls with extended zoom distance
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.2;
    controls.maxDistance = 55; // Extended zoom-out range
    controls.zoomSpeed = 1.0;
    controls.target.set(0, 0.0, 0);
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;
    // Disallow underground view
    controls.maxPolarAngle = Math.PI / 2 + 0.12;
    controlsRef.current = controls;

    // 11. Raycasting for click interaction & hover cursor feedback
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let mouseDownPos = { x: 0, y: 0 };

    const onPointerDown = (event: MouseEvent) => {
      isDragging = false;
      mouseDownPos = { x: event.clientX, y: event.clientY };
      // Cancel preset lerping when user manually drags to orbit
      cameraTargetPos.current = null;
      cameraTargetLookAt.current = null;
    };

    const onPointerMove = (event: MouseEvent) => {
      const dist = Math.hypot(event.clientX - mouseDownPos.x, event.clientY - mouseDownPos.y);
      if (dist > 5) {
        isDragging = true;
      }

      if (isDragging) {
        container.style.cursor = 'grabbing';
        return;
      }

      const isVisibleHit = (hit: THREE.Intersection) => {
        if (!hit.object.userData?.partId) return false;
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr !== rocket.rootGroup) {
          if (!curr.visible) return false;
          curr = curr.parent;
        }
        return true;
      };

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(rocket.rootGroup.children, true);
      const hitPart = intersects.find(isVisibleHit);

      if (hitPart) {
        container.style.cursor = 'pointer';
      } else {
        container.style.cursor = 'grab';
      }
    };

    const onPointerUp = (event: MouseEvent) => {
      if (isDragging) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const isVisibleHit = (hit: THREE.Intersection) => {
        if (!hit.object.userData?.partId) return false;
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr !== rocket.rootGroup) {
          if (!curr.visible) return false;
          curr = curr.parent;
        }
        return true;
      };

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(rocket.rootGroup.children, true);
      const hitPart = intersects.find(isVisibleHit);

      if (hitPart && hitPart.object.userData.partId) {
        onSelectPartRef.current(hitPart.object.userData.partId);
      } else {
        // Clicking empty space deselects current section
        onSelectPartRef.current(null);
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('pointermove', onPointerMove);
    domElement.addEventListener('pointerup', onPointerUp);

    // 12. Responsive resize with ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
      }
    });
    resizeObserver.observe(container);

    // 13. Main 60fps render loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedSec = Date.now() * 0.001;

      // Smooth lerp for explosion progress with exact convergence snap
      const target = targetProgressRef.current;
      const current = currentProgressRef.current;
      if (Math.abs(target - current) > 0.0005) {
        currentProgressRef.current += (target - current) * 0.12;
        rocket.updateExplosion(currentProgressRef.current);
      } else if (current !== target) {
        currentProgressRef.current = target;
        rocket.updateExplosion(target);
      }

      // Dynamic max zoom distance scaling with separation progress (30 to 60)
      controls.maxDistance = THREE.MathUtils.lerp(30, 60, currentProgressRef.current);

      // Smooth camera transition if preset or fit triggered
      if (cameraTargetPos.current && cameraTargetLookAt.current) {
        camera.position.lerp(cameraTargetPos.current, 0.08);
        controls.target.lerp(cameraTargetLookAt.current, 0.08);

        if (
          camera.position.distanceTo(cameraTargetPos.current) < 0.03 &&
          controls.target.distanceTo(cameraTargetLookAt.current) < 0.03
        ) {
          camera.position.copy(cameraTargetPos.current);
          controls.target.copy(cameraTargetLookAt.current);
          cameraTargetPos.current = null;
          cameraTargetLookAt.current = null;
        }
      }

      // Continuous Gesture Navigation (Azimuth Rotation & Depth Zoom)
      if (gestureInputRef?.current && gestureInputRef.current.active) {
        const { rotateDeltaX, zoomDelta } = gestureInputRef.current;

        // Azimuth Rotation
        if (Math.abs(rotateDeltaX) > 0.0001) {
          cameraTargetPos.current = null;
          cameraTargetLookAt.current = null;
          controls.rotateLeft(rotateDeltaX);
        }

        // Depth Dolly / Zoom
        if (Math.abs(zoomDelta) > 0.0001) {
          cameraTargetPos.current = null;
          cameraTargetLookAt.current = null;
          const currentDist = camera.position.distanceTo(controls.target);
          const newDist = Math.max(
            controls.minDistance,
            Math.min(controls.maxDistance, currentDist + zoomDelta)
          );
          camera.position
            .sub(controls.target)
            .normalize()
            .multiplyScalar(newDist)
            .add(controls.target);
        }
      }

      // Update glowing rim-light outline pulse on selected part
      rocket.updateHighlightAnimation(elapsedSec);

      // Subtle cosmic star-field drift
      starDust.rotation.y += 0.00025;
      starDust.rotation.x += 0.0001;

      // Holographic floor radar scanline & ring pulse
      scannerBeam.rotation.z += 0.018;
      ringMaterials.forEach((mat, idx) => {
        mat.opacity = (idx === 0 ? 0.7 : 0.35) * (0.8 + 0.25 * Math.sin(elapsedSec * 2.5 + idx * 0.8));
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('pointermove', onPointerMove);
      domElement.removeEventListener('pointerup', onPointerUp);

      if (controlsRef.current) {
        controlsRef.current.dispose();
      }

      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }

      bgTexture.dispose();
      starDust.geometry.dispose();
      (starDust.material as THREE.Material).dispose();
      ringGeometries.forEach((g) => g.dispose());
      ringMaterials.forEach((m) => m.dispose());
      scannerGeo.dispose();
      scannerMat.dispose();
      shadowPlaneGeo.dispose();
      shadowPlaneMat.dispose();
      holographicGrid.geometry.dispose();
      if (holographicGrid.material instanceof THREE.Material) {
        holographicGrid.material.dispose();
      }
      stabilityDisposables.forEach((fn) => fn());
      envRenderTarget.dispose();
      rocket.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden" />;
};

/**
 * Creates an aerospace CG / CP visual marker glyph with futuristic HUD text callout and soft outer glow
 */
function createCheckeredGlyph(color: string, label: string): { group: THREE.Group; dispose: () => void } {
  const group = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 420;
  canvas.height = 130;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 420, 130);

  ctx.shadowColor = color;
  ctx.shadowBlur = 18;

  ctx.fillStyle = 'rgba(5, 8, 14, 0.92)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(100, 24, 305, 80, 8);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 6;

  const cx = 64;
  const cy = 64;
  const radius = 46;

  ctx.fillStyle = 'rgba(5, 8, 14, 0.98)';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, radius - 2, 0, Math.PI / 2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, radius - 2, Math.PI, (3 * Math.PI) / 2);
  ctx.closePath();
  ctx.fill();

  ctx.font = 'bold 32px "Orbitron", "SF Pro Display", -apple-system, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 122, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.68, 0.21, 1);
  group.add(sprite);

  return {
    group,
    dispose: () => {
      texture.dispose();
      spriteMat.dispose();
    },
  };
}

/**
 * Creates an aerospace HUD static badge between CG and CP showing positive caliber margin (+2.38 calibers)
 */
function createMarginBadge(text: string): { group: THREE.Group; dispose: () => void } {
  const group = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 460;
  canvas.height = 70;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 460, 70);
  ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
  ctx.strokeStyle = '#00E5FF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(6, 6, 448, 58, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#00E5FF';
  ctx.beginPath();
  ctx.arc(28, 35, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 48, 36);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.65, 0.10, 1);
  group.add(sprite);

  return {
    group,
    dispose: () => {
      texture.dispose();
      spriteMat.dispose();
    },
  };
}
