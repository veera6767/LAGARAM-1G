import * as THREE from 'three';
import { createRocketMaterials } from './proceduralMaterials';
import { ROCKET_SPEC } from '../data/rocketParts';
import pcbTextureUrl from '../assets/flight_computer_pcb.jpg';

export interface RocketPartGroup {
  id: string;
  name: string;
  assembly: string;
  order: number;
  group: THREE.Group;
  initialY: number;
  explodedDeltaY: number;
  initialRadial?: number;
  explodedRadialDelta?: number;
  meshes: THREE.Mesh[];
  originalMaterials: (THREE.Material | THREE.Material[])[];
}

export interface BuiltRocketModel {
  rootGroup: THREE.Group;
  parts: Map<string, RocketPartGroup>;
  materials: ReturnType<typeof createRocketMaterials>;
  updateExplosion: (progress: number) => void;
  highlightPart: (partId: string | null) => void;
  updateHighlightAnimation: (time: number) => void;
  setWireframe: (enabled: boolean) => void;
  setFinVisualScale: (scale: number) => void;
  setPartVisibility: (partId: string, visible: boolean) => void;
  getPcbPosition: () => THREE.Vector3;
  getPhonePosition: () => THREE.Vector3;
  dispose: () => void;
}

function smoothstep(min: number, max: number, val: number): number {
  const x = Math.max(0, Math.min(1, (val - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

/**
 * Scale factor: 1 mm = 0.0025 Three.js units.
 * Total length 2000 mm = 5.00 units in 3D.
 * Outer diameter 102 mm = 0.255 units (radius 0.1275 units).
 * Wall thickness 3 mm = 0.0075 units (inner radius 0.1200 units, ID 96 mm).
 * The 3D model matches the exact real-world 19.61:1 aspect ratio and 5.39:1 nose fineness ratio.
 */
export const SCALE = 0.0025;
export const mmToUnits = (mm: number) => mm * SCALE;

/**
 * Creates a watertight hollow cylindrical tube with true wall thickness.
 * Both outer and inner walls and top/bottom annular rims are visible in solid and wireframe mode.
 */
function createHollowTubeGeometry(
  outerRadius: number,
  innerRadius: number,
  length: number,
  radialSegments = 64
): THREE.BufferGeometry {
  const points: THREE.Vector2[] = [
    new THREE.Vector2(outerRadius, -length / 2),
    new THREE.Vector2(outerRadius, length / 2),
    new THREE.Vector2(innerRadius, length / 2),
    new THREE.Vector2(innerRadius, -length / 2),
    new THREE.Vector2(outerRadius, -length / 2),
  ];
  const geo = new THREE.LatheGeometry(points, radialSegments);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates smooth 3 mm concave aerospace fillets along the fin root chord
 * where the fin meets the booster tube on both lateral sides (+Z and -Z).
 */
function createFinRootFilletGeometry(
  chordLength: number,
  filletR: number,
  halfThickness: number
): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const segmentsY = 24;
  const segmentsArc = 8;
  const sides = [1, -1];

  sides.forEach((side) => {
    const baseVertexIndex = vertices.length / 3;

    for (let iy = 0; iy <= segmentsY; iy++) {
      const y = (iy / segmentsY) * chordLength;

      for (let ia = 0; ia <= segmentsArc; ia++) {
        const u = ia / segmentsArc;
        const angle = (u * Math.PI) / 2;

        // Fin face: Z = side * halfThickness, X = filletR * (1 - sin(angle))
        // Tube face: X = 0, Z = side * (halfThickness + filletR * (1 - cos(angle)))
        const x = filletR * (1 - Math.sin(angle));
        const z = side * (halfThickness + filletR * (1 - Math.cos(angle)));

        vertices.push(x, y, z);

        const nx = -Math.cos(angle);
        const nz = -side * Math.sin(angle);
        const len = Math.hypot(nx, nz) || 1;
        normals.push(nx / len, 0, nz / len);
      }
    }

    const stride = segmentsArc + 1;
    for (let iy = 0; iy < segmentsY; iy++) {
      for (let ia = 0; ia < segmentsArc; ia++) {
        const p1 = baseVertexIndex + iy * stride + ia;
        const p2 = baseVertexIndex + (iy + 1) * stride + ia;
        const p3 = baseVertexIndex + (iy + 1) * stride + ia + 1;
        const p4 = baseVertexIndex + iy * stride + ia + 1;

        if (side === 1) {
          indices.push(p1, p3, p2);
          indices.push(p1, p4, p3);
        } else {
          indices.push(p1, p2, p3);
          indices.push(p1, p3, p4);
        }
      }
    }
  });

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates high-resolution canvas texture for the smartphone telemetry display.
 * Displays "PHONE TELEMETRY", pulsing cyan dot, and multi-axis sensor waveform traces.
 */
function createPhoneScreenTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Deep space black / dark navy background
  ctx.fillStyle = '#02050a';
  ctx.fillRect(0, 0, width, height);

  // Subtle border / bezel line
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // Corner HUD accents
  const accentLen = 28;
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#22d3ee';
  // Top-left
  ctx.beginPath();
  ctx.moveTo(14, 14 + accentLen); ctx.lineTo(14, 14); ctx.lineTo(14 + accentLen, 14);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(width - 14 - accentLen, 14); ctx.lineTo(width - 14, 14); ctx.lineTo(width - 14, 14 + accentLen);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(14, height - 14 - accentLen); ctx.lineTo(14, height - 14); ctx.lineTo(14 + accentLen, height - 14);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(width - 14 - accentLen, height - 14); ctx.lineTo(width - 14, height - 14); ctx.lineTo(width - 14, height - 14 - accentLen);
  ctx.stroke();

  // Top header status bar
  ctx.fillStyle = 'rgba(0, 229, 255, 0.14)';
  ctx.fillRect(20, 20, width - 40, 52);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px "Share Tech Mono", "Orbitron", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('REC: ACTIVE [100 Hz]', 35, 53);
  ctx.textAlign = 'right';
  ctx.fillText('LINK: ONLINE', width - 35, 53);

  // Center Header: "PHONE TELEMETRY"
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 36px "Orbitron", "Share Tech Mono", monospace';
  ctx.fillText('PHONE TELEMETRY', width / 2 - 18, 140);

  // Pulsing cyan dot beside "PHONE TELEMETRY"
  ctx.beginPath();
  ctx.arc(width / 2 + 185, 128, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#00e5ff';
  ctx.fill();
  ctx.shadowBlur = 24;
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(width / 2 + 185, 128, 17, 0, Math.PI * 2);
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Thin separator line
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(35, 175);
  ctx.lineTo(width - 35, 175);
  ctx.stroke();

  // Decorative sensor trace lines (IMU / Gyro / Magnetometer / GNSS waveforms)
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let y = 205; y <= 940; y += 40) {
    ctx.beginPath();
    ctx.moveTo(35, y);
    ctx.lineTo(width - 35, y);
    ctx.stroke();
  }
  for (let x = 35; x <= width - 35; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, 205);
    ctx.lineTo(x, 940);
    ctx.stroke();
  }

  // Section 1: Accelerometer waveform traces
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px "Share Tech Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('IMU: 3-AXIS ACCELEROMETER [AX, AY, AZ]', 45, 235);

  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let x = 45; x <= width - 45; x += 4) {
    const t = (x - 45) / (width - 90);
    const y = 300 + Math.sin(t * 18) * 35 + Math.cos(t * 37) * 14;
    if (x === 45) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let x = 45; x <= width - 45; x += 4) {
    const t = (x - 45) / (width - 90);
    const y = 300 + Math.cos(t * 14) * 26 + Math.sin(t * 29) * 10;
    if (x === 45) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = '#0891b2';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 45; x <= width - 45; x += 4) {
    const t = (x - 45) / (width - 90);
    const y = 300 + Math.sin(t * 8) * 18 + Math.cos(t * 45) * 8;
    if (x === 45) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Section 2: Gyroscope rates
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('IMU: 3-AXIS GYROSCOPE [PITCH, YAW, ROLL]', 45, 420);

  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let x = 45; x <= width - 45; x += 4) {
    const t = (x - 45) / (width - 90);
    const y = 490 + Math.sin(t * 22) * 32 + Math.sin(t * 51) * 12;
    if (x === 45) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let x = 45; x <= width - 45; x += 4) {
    const t = (x - 45) / (width - 90);
    const y = 490 + Math.cos(t * 26) * 24 + Math.cos(t * 13) * 14;
    if (x === 45) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Section 3: Magnetometer & GNSS Vector
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('MAG / GNSS POSITION VECTOR [MAG_B, GNSS_FIX]', 45, 610);

  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  for (let x = 45; x <= width - 45; x += 4) {
    const t = (x - 45) / (width - 90);
    const y = 680 + Math.sin(t * 12) * 28 + Math.cos(t * 25) * 16;
    if (x === 45) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let x = 45; x <= width - 45; x += 4) {
    const t = (x - 45) / (width - 90);
    const y = 680 + Math.cos(t * 16) * 22 + Math.sin(t * 33) * 10;
    if (x === 45) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Section 4: Live Telemetry Buffer Card (No numeric values)
  ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
  ctx.fillRect(45, 780, width - 90, 140);
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
  ctx.strokeRect(45, 780, width - 90, 140);

  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 18px "Share Tech Mono", monospace';
  ctx.fillText('SYSTEM: SMARTPHONE TELEMETRY', 60, 815);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '15px "Share Tech Mono", monospace';
  ctx.fillText('LOGGING: ONBOARD 100 Hz BACKUP FILE', 60, 845);
  ctx.fillText('DOWNLINK: THINNED REALTIME COPY (INTERNET)', 60, 875);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('STATE: ALL SUBSYSTEM SENSORS SYNCHRONIZED', 60, 905);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Creates floating HUD label sprite for the exploded smartphone telemetry assembly
 */
function createPhoneFloatingLabel(text: string): { group: THREE.Group; dispose: () => void } {
  const group = new THREE.Group();
  const canvas = document.createElement('canvas');
  canvas.width = 460;
  canvas.height = 84;
  const ctx = canvas.getContext('2d')!;

  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 14;

  ctx.fillStyle = 'rgba(5, 9, 16, 0.92)';
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(8, 8, 444, 68, 8);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 4;
  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 24px "Orbitron", "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, 230, 48);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const spriteMat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.60, 0.11, 1);
  group.add(sprite);

  const dispose = () => {
    tex.dispose();
    spriteMat.dispose();
  };

  return { group, dispose };
}

/**
 * Builds the complete 3D LAGARAM-1 rocket model with exact engineering dimensions and hollow tubes.
 */
export function buildRocketModel(): BuiltRocketModel {
  const materials = createRocketMaterials();
  const rootGroup = new THREE.Group();
  rootGroup.name = 'LAGARAM-1 Root';

  const parts = new Map<string, RocketPartGroup>();

  // Airframe dimensions from ROCKET_SPEC
  const outerRadius = mmToUnits(ROCKET_SPEC.airframe.outerRadiusMm); // 0.1275 units (51 mm)
  const innerRadius = mmToUnits(ROCKET_SPEC.airframe.innerRadiusMm); // 0.1200 units (48 mm)
  const totalLength = mmToUnits(ROCKET_SPEC.airframe.totalLengthMm); // 5.00 units (2000 mm)

  // Rocket axial limits along Y: tail at -2.5, nose tip at +2.5
  const tailY = -totalLength / 2; // -2.50
  const noseTipY = totalLength / 2; // +2.50

  // ----------------------------------------------------
  // 1. BOOSTER SECTION (1200 mm to 2000 mm, length 800 mm)
  // Hollow tube (OD 102, ID 96, 3 mm wall) housing inner motor
  // ----------------------------------------------------
  const boosterGroup = new THREE.Group();
  boosterGroup.name = 'booster-section';

  const boosterLength = mmToUnits(ROCKET_SPEC.axialLayout.boosterSection.lengthMm); // 800 mm -> 2.00
  const boosterCenterY = tailY + boosterLength / 2; // -2.5 + 1.0 = -1.50

  const boosterGeo = createHollowTubeGeometry(outerRadius, innerRadius, boosterLength, 64);
  const boosterMesh = new THREE.Mesh(boosterGeo, materials.recoveryMaterial);
  boosterMesh.castShadow = true;
  boosterMesh.receiveShadow = true;
  boosterMesh.position.y = boosterCenterY;
  boosterMesh.userData = { partId: 'booster-section' };

  // Structural joint rings at section junctions
  const jointRingGeo = new THREE.TorusGeometry(outerRadius + 0.002, 0.003, 10, 64);
  jointRingGeo.rotateX(Math.PI / 2);
  const boosterRingTop = new THREE.Mesh(jointRingGeo, materials.bulkheadMaterial);
  boosterRingTop.position.y = boosterCenterY + boosterLength / 2 - 0.005;
  boosterRingTop.userData = { partId: 'booster-section' };

  const boosterRingBottom = new THREE.Mesh(jointRingGeo, materials.bulkheadMaterial);
  boosterRingBottom.position.y = boosterCenterY - boosterLength / 2 + 0.005;
  boosterRingBottom.userData = { partId: 'booster-section' };

  boosterGroup.add(boosterMesh, boosterRingTop, boosterRingBottom);
  rootGroup.add(boosterGroup);

  // ----------------------------------------------------
  // 2. INNER MOTOR (M1928, 1300 mm to 2000 mm, length 700 mm)
  // Separate internal component: 6061-T6 casing (98 mm OD, 4 mm wall),
  // 4-segment BATES grain, top flange, igniter/valve fittings, exhaust nozzle
  // ----------------------------------------------------
  const motorGroup = new THREE.Group();
  motorGroup.name = 'inner-motor';

  const motorLength = mmToUnits(ROCKET_SPEC.motor.casingLengthMm); // 700 mm -> 1.75
  const motorOuterRadius = mmToUnits(ROCKET_SPEC.motor.casingOuterDiameterMm / 2); // 49 mm -> 0.1225
  const motorInnerRadius = mmToUnits(ROCKET_SPEC.motor.casingInnerDiameterMm / 2); // 45 mm -> 0.1125
  const motorCenterY = tailY + motorLength / 2; // -2.5 + 0.875 = -1.625

  // Motor cylindrical pressure vessel body
  const motorCasingLength = motorLength * 0.80; // ~1.40 units
  const motorCasingCenterY = motorCenterY + motorLength * 0.08;
  const motorCasingGeo = createHollowTubeGeometry(motorOuterRadius, motorInnerRadius, motorCasingLength, 64);
  const motorCasingMesh = new THREE.Mesh(motorCasingGeo, materials.motorCasingMaterial);
  motorCasingMesh.castShadow = true;
  motorCasingMesh.receiveShadow = true;
  motorCasingMesh.position.y = motorCasingCenterY;
  motorCasingMesh.userData = { partId: 'inner-motor' };

  // Top stepped circular flange cap (8-bolt circular pattern)
  const flangeRadius = motorOuterRadius * 1.04;
  const flangeTopY = motorCasingCenterY + motorCasingLength / 2;
  const flangeGeo = new THREE.CylinderGeometry(flangeRadius, flangeRadius, 0.024, 64);
  const flangeMesh = new THREE.Mesh(flangeGeo, materials.motorCasingMaterial);
  flangeMesh.position.y = flangeTopY + 0.012;
  flangeMesh.userData = { partId: 'inner-motor' };

  // 8 bolt heads on top flange
  const boltHeadGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.008, 6);
  const flangeBolts: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const bx = Math.cos(angle) * (flangeRadius - 0.008);
    const bz = Math.sin(angle) * (flangeRadius - 0.008);
    const bMesh = new THREE.Mesh(boltHeadGeo, materials.boltSteelMaterial);
    bMesh.position.set(bx, flangeTopY + 0.028, bz);
    bMesh.userData = { partId: 'inner-motor' };
    flangeBolts.push(bMesh);
  }

  // Top protruding fittings: spark-plug igniter & 90° pneumatic elbow
  const igniterStemGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.035, 12);
  const igniterStem = new THREE.Mesh(igniterStemGeo, materials.sparkPlugCeramicMaterial);
  igniterStem.position.set(0.035, flangeTopY + 0.036, 0.035);
  igniterStem.userData = { partId: 'inner-motor' };

  const valveElbowGeo = new THREE.BoxGeometry(0.012, 0.012, 0.012);
  const valveElbow = new THREE.Mesh(valveElbowGeo, materials.fittingGunmetalMaterial);
  valveElbow.position.set(-0.04, flangeTopY + 0.026, -0.01);
  valveElbow.userData = { partId: 'inner-motor' };

  // Internal 4-segment BATES solid propellant grain inside motor casing (visible in wireframe/exploded)
  const grainSegmentHeight = (motorCasingLength * 0.88) / 4;
  const grainOuterRadius = motorInnerRadius * 0.94;
  const grainCoreRadius = motorInnerRadius * 0.32; // hollow central burn port
  const grainSegments: THREE.Mesh[] = [];

  for (let s = 0; s < 4; s++) {
    const sGeo = createHollowTubeGeometry(grainOuterRadius, grainCoreRadius, grainSegmentHeight * 0.92, 32);
    const sMesh = new THREE.Mesh(sGeo, materials.propellantGrainMaterial);
    const sy = motorCasingCenterY - (motorCasingLength * 0.40) + s * grainSegmentHeight + grainSegmentHeight * 0.5;
    sMesh.position.y = sy;
    sMesh.userData = { partId: 'inner-motor' };
    grainSegments.push(sMesh);
  }

  // Conical converging aft section & supersonic exhaust nozzle bell
  const throatRadius = motorOuterRadius * 0.38;
  const exitRadius = motorOuterRadius * 0.65;
  const nozzleTopY = motorCasingCenterY - motorCasingLength / 2;
  const nozzleBottomY = tailY - 0.04;

  const nozzlePoints: THREE.Vector2[] = [
    new THREE.Vector2(motorOuterRadius, nozzleTopY),
    new THREE.Vector2(throatRadius + 0.006, nozzleTopY - 0.08), // Converging
    new THREE.Vector2(throatRadius, nozzleTopY - 0.10), // Throat
    new THREE.Vector2(exitRadius, nozzleBottomY), // Conical expansion bell
    new THREE.Vector2(exitRadius - 0.008, nozzleBottomY), // Lip bottom
    new THREE.Vector2(throatRadius - 0.008, nozzleTopY - 0.10), // Inner throat
    new THREE.Vector2(motorInnerRadius, nozzleTopY), // Inner converge
    new THREE.Vector2(motorOuterRadius, nozzleTopY), // Close loop
  ];
  const nozzleGeo = new THREE.LatheGeometry(nozzlePoints, 64);
  nozzleGeo.computeVertexNormals();
  const nozzleMesh = new THREE.Mesh(nozzleGeo, materials.nozzleMaterial);
  nozzleMesh.castShadow = true;
  nozzleMesh.receiveShadow = true;
  nozzleMesh.userData = { partId: 'inner-motor' };

  // Graphite throat insert sleeve
  const throatInsertGeo = new THREE.CylinderGeometry(throatRadius - 0.007, throatRadius - 0.007, 0.03, 32, 1, true);
  const throatInsertMesh = new THREE.Mesh(throatInsertGeo, materials.graphiteThroatMaterial);
  throatInsertMesh.position.y = nozzleTopY - 0.10;
  throatInsertMesh.userData = { partId: 'inner-motor' };

  motorGroup.add(
    motorCasingMesh,
    flangeMesh,
    ...flangeBolts,
    igniterStem,
    valveElbow,
    ...grainSegments,
    nozzleMesh,
    throatInsertMesh
  );
  rootGroup.add(motorGroup);

  // ----------------------------------------------------
  // 3. STABILIZING FINS (x4 cruciform, G10 fibreglass)
  // Single source of truth: ROCKET_SPEC.fins
  // Root chord cr = 170 mm, tip chord ct = 62 mm, semi-span b = 85 mm, thickness t = 6 mm
  // Sweep offset = 108 mm (derived straight trailing edge), sweep angle = 51.8°
  // 2D outline: (0,0) root LE -> (170,0) root TE -> (170,85) tip TE -> (108,85) tip LE -> back to (0,0)
  // Flush with booster aft end (tailY = -2.50), embedded 0.5 mm into tube wall
  // ----------------------------------------------------
  const finsGroup = new THREE.Group();
  finsGroup.name = 'fins';

  const finRootChord = mmToUnits(ROCKET_SPEC.fins.rootChordMm); // 170 mm -> 0.425
  const finTipChord = mmToUnits(ROCKET_SPEC.fins.tipChordMm); // 62 mm -> 0.155
  const finSemiSpan = mmToUnits(ROCKET_SPEC.fins.semiSpanMm); // 85 mm -> 0.2125
  const finThickness = mmToUnits(ROCKET_SPEC.fins.thicknessMm); // 6 mm -> 0.015
  const finEmbedDepth = mmToUnits(0.5); // 0.5 mm into tube wall to eliminate any visual gap
  const bevelUnits = mmToUnits(1.5); // 1.5 mm bevel on leading, tip and trailing edges
  const filletRadius = mmToUnits(3.0); // 3 mm structural aerospace root fillet

  // 2D Shape in local (X: outward from body, Y: forward from root trailing edge)
  // Root trailing edge is at Y = 0 (flush with aft booster tube)
  // Tip trailing edge is at Y = 0 (straight trailing edge perpendicular to body)
  // Tip leading edge is at Y = finTipChord = 0.155 (62 mm chord)
  // Root leading edge is at Y = finRootChord = 0.425 (170 mm chord)
  // X = -finEmbedDepth goes 0.5 mm into tube wall
  // X = finSemiSpan is the semi-span (85 mm)
  const finShape = new THREE.Shape();
  finShape.moveTo(-finEmbedDepth, 0); // Root trailing edge
  finShape.lineTo(finSemiSpan, 0); // Tip trailing edge (flush straight trailing edge)
  finShape.lineTo(finSemiSpan, finTipChord); // Tip leading edge
  finShape.lineTo(-finEmbedDepth, finRootChord); // Root leading edge
  finShape.closePath();

  // Core thickness: 6 mm total thickness with 1.5 mm bevel on both faces
  const coreThickness = Math.max(0.001, finThickness - 2 * bevelUnits); // 3 mm core (0.0075)
  const finExtrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: coreThickness,
    bevelEnabled: true,
    bevelThickness: bevelUnits,
    bevelSize: bevelUnits,
    bevelOffset: -bevelUnits,
    bevelSegments: 3,
  };

  const finGeo = new THREE.ExtrudeGeometry(finShape, finExtrudeSettings);
  // Center along Z on its mid-plane
  finGeo.translate(0, 0, -(coreThickness / 2 + bevelUnits));
  finGeo.computeVertexNormals();

  // 3 mm Root Fillet geometry
  const finFilletGeo = createFinRootFilletGeometry(finRootChord, filletRadius, finThickness / 2);

  // Thin cyan HUD edge highlight outline (#22D3EE)
  const finEdgeMat = new THREE.LineBasicMaterial({
    color: 0x22D3EE,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const finEdgesGeo = new THREE.EdgesGeometry(finGeo, 24);

  // Root trailing edge flush with aft end of booster tube (tailY = -2.50)
  const finBaseY = tailY;
  const finMeshes: THREE.Mesh[] = [];

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const finMesh = new THREE.Mesh(finGeo, materials.finMaterial);
    finMesh.castShadow = true;
    finMesh.receiveShadow = true;
    finMesh.userData = { partId: 'fins' };

    // Add root fillet mesh
    const filletMesh = new THREE.Mesh(finFilletGeo, materials.finMaterial);
    filletMesh.castShadow = true;
    filletMesh.receiveShadow = true;
    filletMesh.userData = { partId: 'fins' };
    finMesh.add(filletMesh);

    // Add thin cyan HUD edge outline
    const finEdgeLines = new THREE.LineSegments(finEdgesGeo, finEdgeMat);
    finEdgeLines.raycast = () => {};
    finEdgeLines.renderOrder = 3;
    finMesh.add(finEdgeLines);

    // Position at booster tube perimeter
    const posX = Math.cos(angle) * outerRadius;
    const posZ = Math.sin(angle) * outerRadius;

    finMesh.position.set(posX, finBaseY, posZ);
    finMesh.rotation.set(0, -angle, 0);

    finMeshes.push(finMesh);
    finsGroup.add(finMesh);
  }

  rootGroup.add(finsGroup);

  // ----------------------------------------------------
  // 4. DROGUE BAY (800 mm to 1200 mm, length 400 mm)
  // Hollow composite cylinder + visual interstage bulkhead + drogue chute pack
  // ----------------------------------------------------
  const drogueGroup = new THREE.Group();
  drogueGroup.name = 'drogue-bay';

  const drogueLength = mmToUnits(ROCKET_SPEC.axialLayout.drogueBay.lengthMm); // 400 mm -> 1.00
  const drogueCenterY = tailY + boosterLength + drogueLength / 2; // -2.5 + 2.0 + 0.5 = 0.00

  const drogueGeo = createHollowTubeGeometry(outerRadius, innerRadius, drogueLength, 64);
  const drogueMesh = new THREE.Mesh(drogueGeo, materials.recoveryMaterial);
  drogueMesh.castShadow = true;
  drogueMesh.receiveShadow = true;
  drogueMesh.position.y = drogueCenterY;
  drogueMesh.userData = { partId: 'drogue-bay' };

  // Visual internal: 6061-T6 Interstage Bulkhead at lower boundary with eyebolt
  const bulkheadThickness = 0.015;
  const interstageBulkheadGeo = new THREE.CylinderGeometry(innerRadius - 0.001, innerRadius - 0.001, bulkheadThickness, 48);
  const interstageBulkheadMesh = new THREE.Mesh(interstageBulkheadGeo, materials.bulkheadMaterial);
  interstageBulkheadMesh.position.y = drogueCenterY - drogueLength / 2 + bulkheadThickness / 2;
  interstageBulkheadMesh.userData = { partId: 'drogue-bay' };

  // Forged eyebolt on bulkhead
  const eyeboltGeo = new THREE.TorusGeometry(0.008, 0.0025, 8, 24);
  const eyeboltMesh = new THREE.Mesh(eyeboltGeo, materials.boltSteelMaterial);
  eyeboltMesh.position.y = interstageBulkheadMesh.position.y + 0.014;
  eyeboltMesh.userData = { partId: 'drogue-bay' };

  // Internal drogue parachute pack model (visible when separated in exploded view)
  const drogueChutePackGeo = new THREE.CylinderGeometry(innerRadius * 0.75, innerRadius * 0.75, 0.16, 24);
  const drogueChutePack = new THREE.Mesh(drogueChutePackGeo, materials.drogueParachuteMaterial);
  drogueChutePack.position.y = drogueCenterY - 0.08;
  drogueChutePack.userData = { partId: 'drogue-bay' };

  // Static pressure ports (3 holes around perimeter)
  const staticPorts: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const pAng = (i * Math.PI * 2) / 3;
    const pGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.008, 12);
    pGeo.rotateZ(Math.PI / 2);
    const pMesh = new THREE.Mesh(pGeo, materials.bulkheadMaterial);
    pMesh.position.set(Math.cos(pAng) * outerRadius, drogueCenterY + 0.12, Math.sin(pAng) * outerRadius);
    pMesh.rotation.y = -pAng;
    pMesh.userData = { partId: 'drogue-bay' };
    staticPorts.push(pMesh);
  }

  drogueGroup.add(
    drogueMesh,
    interstageBulkheadMesh,
    eyeboltMesh,
    drogueChutePack,
    ...staticPorts
  );
  rootGroup.add(drogueGroup);

  // ----------------------------------------------------
  // 5. AVIONICS BAY (550 mm to 800 mm, length 250 mm)
  // Hollow RF-transparent composite tube + visual avionics bulkhead + flight computer sled
  // ----------------------------------------------------
  const avionicsGroup = new THREE.Group();
  avionicsGroup.name = 'avionics-bay';

  const avionicsLength = mmToUnits(ROCKET_SPEC.axialLayout.avionicsBay.lengthMm); // 250 mm -> 0.625
  const avionicsCenterY = tailY + boosterLength + drogueLength + avionicsLength / 2; // -2.5 + 2.0 + 1.0 + 0.3125 = +0.8125

  const avionicsGeo = createHollowTubeGeometry(outerRadius, innerRadius, avionicsLength, 64);
  const avionicsMesh = new THREE.Mesh(avionicsGeo, materials.payloadMaterial);
  avionicsMesh.castShadow = true;
  avionicsMesh.receiveShadow = true;
  avionicsMesh.position.y = avionicsCenterY;
  avionicsMesh.userData = { partId: 'avionics-bay' };

  // Visual internal: Avionics Bulkhead disc at base of avionics bay
  const avionicsBulkheadGeo = new THREE.CylinderGeometry(innerRadius - 0.001, innerRadius - 0.001, bulkheadThickness, 48);
  const avionicsBulkheadMesh = new THREE.Mesh(avionicsBulkheadGeo, materials.bulkheadMaterial);
  avionicsBulkheadMesh.position.y = avionicsCenterY - avionicsLength / 2 + bulkheadThickness / 2;
  avionicsBulkheadMesh.userData = { partId: 'avionics-bay' };

  // Internal mounting sled / standoff plate inside avionics bay
  // Sled widened and extended along length so both the Flight Computer PCB and Phone mounting tray fit flat without overlap
  const sledWidth = mmToUnits(80); // 80 mm wide (fits comfortably within 96 mm ID airframe)
  const sledLength = avionicsLength * 0.92; // 230 mm length (fits cleanly between bulkheads)
  const sledPlateGeo = new THREE.BoxGeometry(sledWidth, sledLength, 0.006);
  const sledMesh = new THREE.Mesh(sledPlateGeo, materials.avionicsCircuitMaterial);
  sledMesh.position.set(0, avionicsCenterY, -0.014);
  sledMesh.userData = { partId: 'avionics-bay' };

  // ----------------------------------------------------
  // Flight Computer PCB Board & Mounting Standoffs
  // PCB Dimensions: 65 mm width x 97.5 mm length x 1.6 mm thickness
  // Positioned on the forward section of the sled plate
  // ----------------------------------------------------
  const pcbWidth = mmToUnits(65);      // 0.1625 units
  const pcbLength = mmToUnits(97.5);   // 0.24375 units
  const pcbThickness = mmToUnits(1.6); // 0.0040 units
  const pcbCenterY = avionicsCenterY + mmToUnits(62);
  const pcbCenterX = 0;

  const standoffGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.008, 12);
  standoffGeo.rotateX(Math.PI / 2);
  const standoffs: THREE.Mesh[] = [];
  const standoffOffsetsX = [pcbWidth * 0.42, -pcbWidth * 0.42];
  const standoffOffsetsY = [pcbLength * 0.42, -pcbLength * 0.42];
  standoffOffsetsX.forEach((sx) => {
    standoffOffsetsY.forEach((sy) => {
      const so = new THREE.Mesh(standoffGeo, materials.boltSteelMaterial);
      so.position.set(pcbCenterX + sx, pcbCenterY + sy, -0.010);
      so.userData = { partId: 'avionics-bay' };
      standoffs.push(so);
    });
  });

  // Standoffs on sled under Phone mounting tray 4 corner screws
  // Phone dimensions: about 150 mm x 70 mm x 8 mm (placeholder, confirm with the real phone)
  // Attachment hardware: design-intent representation, update to match the real build
  const phoneWidth = mmToUnits(68);      // 0.170 units (~68 mm)
  const phoneLength = mmToUnits(134);    // 0.335 units (~134 mm)
  const phoneThickness = mmToUnits(8);   // 0.020 units (8 mm)
  const phoneCenterY = avionicsCenterY - mmToUnits(52);
  const phoneCenterX = 0;

  const trayWidth = phoneWidth + mmToUnits(4);   // 72 mm wide
  const trayLength = phoneLength + mmToUnits(4); // 138 mm long
  const trayThickness = mmToUnits(1.5);
  const phoneStandoffOffsetsX = [trayWidth * 0.44, -trayWidth * 0.44];
  const phoneStandoffOffsetsY = [trayLength * 0.44, -trayLength * 0.44];
  phoneStandoffOffsetsX.forEach((sx) => {
    phoneStandoffOffsetsY.forEach((sy) => {
      const so = new THREE.Mesh(standoffGeo, materials.boltSteelMaterial);
      so.position.set(phoneCenterX + sx, phoneCenterY + sy, -0.010);
      so.userData = { partId: 'avionics-bay' };
      standoffs.push(so);
    });
  });

  // Flush access hatch outline on bay surface
  const hatchOutlineGeo = new THREE.BoxGeometry(0.004, 0.12, 0.07);
  const hatchOutline = new THREE.Mesh(hatchOutlineGeo, materials.bulkheadMaterial);
  hatchOutline.position.set(outerRadius + 0.001, avionicsCenterY, 0);
  hatchOutline.userData = { partId: 'avionics-bay' };

  avionicsGroup.add(
    avionicsMesh,
    avionicsBulkheadMesh,
    sledMesh,
    ...standoffs,
    hatchOutline
  );
  rootGroup.add(avionicsGroup);

  // ----------------------------------------------------
  // 5b. FLIGHT COMPUTER PCB (Flight Computer 3.1)
  // Separate 3D part: 1.6 mm thick board (3:2 aspect ratio)
  // Top face textured with high-res hardware PCB image; plain PCB green for edges & back.
  // In assembled state, sits flat along rocket axis on avionics sled standoffs.
  // In exploded state, slides axially out of tube, translates radially, and tilts toward camera.
  // ----------------------------------------------------
  const textureLoader = new THREE.TextureLoader();
  const pcbTexture = textureLoader.load(pcbTextureUrl);
  pcbTexture.colorSpace = THREE.SRGBColorSpace;
  pcbTexture.generateMipmaps = true;
  pcbTexture.minFilter = THREE.LinearMipmapLinearFilter;
  pcbTexture.magFilter = THREE.LinearFilter;

  const plainPcbGreenMaterial = new THREE.MeshStandardMaterial({
    color: 0x0e4a28, // plain FR-4 PCB green for underside and edges
    roughness: 0.38,
    metalness: 0.12,
    envMapIntensity: 1.0,
  });

  const pcbTopMaterial = new THREE.MeshStandardMaterial({
    map: pcbTexture,
    roughness: 0.32,
    metalness: 0.15,
    envMapIntensity: 1.2,
  });

  // BoxGeometry faces: [+X, -X, +Y, -Y, +Z, -Z]
  // Face +Z is face 4 (top component side with texture)
  const pcbMaterials = [
    plainPcbGreenMaterial, // +X right edge
    plainPcbGreenMaterial, // -X left edge
    plainPcbGreenMaterial, // +Y top edge
    plainPcbGreenMaterial, // -Y bottom edge
    pcbTopMaterial,        // +Z top face (texture with STM32 and labels)
    plainPcbGreenMaterial, // -Z bottom face (underside)
  ];

  const pcbGeo = new THREE.BoxGeometry(pcbWidth, pcbLength, pcbThickness);
  const pcbMesh = new THREE.Mesh(pcbGeo, pcbMaterials);
  pcbMesh.castShadow = true;
  pcbMesh.receiveShadow = true;
  pcbMesh.userData = { partId: 'flight-computer-pcb' };

  const pcbGroup = new THREE.Group();
  pcbGroup.name = 'flight-computer-pcb';
  pcbGroup.position.set(pcbCenterX, pcbCenterY, -0.004);
  pcbGroup.add(pcbMesh);
  rootGroup.add(pcbGroup);

  // Dashed cyan leader line connecting PCB to its original mounting position inside the bay
  const leaderLinePoints = [
    new THREE.Vector3(pcbCenterX, pcbCenterY, -0.010),
    new THREE.Vector3(pcbCenterX, pcbCenterY, -0.004),
  ];
  const leaderLineGeo = new THREE.BufferGeometry().setFromPoints(leaderLinePoints);
  const leaderLineMat = new THREE.LineDashedMaterial({
    color: 0x00e5ff,
    dashSize: 0.035,
    gapSize: 0.02,
    transparent: true,
    opacity: 0.85,
  });
  const leaderLine = new THREE.Line(leaderLineGeo, leaderLineMat);
  leaderLine.computeLineDistances();
  leaderLine.visible = false;
  rootGroup.add(leaderLine);

  // ----------------------------------------------------
  // 5c. SMARTPHONE TELEMETRY PAYLOAD & SECURE MOUNTING HARDWARE
  // Independent 3D part inside the Avionics Bay beside Flight Computer PCB.
  // Dimensions: about 150 mm x 70 mm x 8 mm (placeholder, confirm with the real phone)
  // Attachment hardware: design-intent representation, update to match the real build
  // ----------------------------------------------------
  const phoneGroup = new THREE.Group();
  phoneGroup.name = 'smartphone-telemetry';
  phoneGroup.position.set(phoneCenterX, phoneCenterY, -0.004);

  // Materials for phone assembly
  const phoneScreenTexture = createPhoneScreenTexture();
  const phoneScreenMat = new THREE.MeshStandardMaterial({
    map: phoneScreenTexture,
    emissive: 0x00e5ff,
    emissiveMap: phoneScreenTexture,
    emissiveIntensity: 0.55,
    roughness: 0.16,
    metalness: 0.10,
    envMapIntensity: 1.2,
  });

  const phoneFrameMat = new THREE.MeshStandardMaterial({
    color: 0x24272e, // dark-gray metal frame
    roughness: 0.35,
    metalness: 0.85,
    envMapIntensity: 1.5,
  });

  const phoneGlassBackMat = new THREE.MeshStandardMaterial({
    color: 0x0c0e12, // dark glass rear face
    roughness: 0.18,
    metalness: 0.25,
    envMapIntensity: 1.4,
  });

  const trayMat = new THREE.MeshStandardMaterial({
    color: 0x1f232b, // dark anodized mounting tray
    roughness: 0.40,
    metalness: 0.75,
    envMapIntensity: 1.1,
  });

  const foamMat = new THREE.MeshStandardMaterial({
    color: 0x121417, // dark vibration damping foam pad
    roughness: 0.95,
    metalness: 0.0,
  });

  const strapMat = new THREE.MeshStandardMaterial({
    color: 0x2e3540, // hold-down clamp straps
    roughness: 0.38,
    metalness: 0.80,
    envMapIntensity: 1.3,
  });

  // Layer 1: Mounting Tray (Flat base + shallow pocket with raised edges)
  const trayGroup = new THREE.Group();
  trayGroup.name = 'phone-mounting-tray';

  const trayBaseGeo = new THREE.BoxGeometry(trayWidth, trayLength, trayThickness);
  const trayBaseMesh = new THREE.Mesh(trayBaseGeo, trayMat);
  trayBaseMesh.castShadow = true;
  trayBaseMesh.receiveShadow = true;
  trayBaseMesh.userData = { partId: 'smartphone-telemetry' };
  trayGroup.add(trayBaseMesh);

  // 4 Raised pocket lips (prevent lateral sliding)
  const lipHeight = mmToUnits(3.5);
  const lipThick = mmToUnits(1.5);
  const lipZ = trayThickness / 2 + lipHeight / 2;

  // Left & Right lips
  const sideLipGeo = new THREE.BoxGeometry(lipThick, trayLength, lipHeight);
  const leftLip = new THREE.Mesh(sideLipGeo, trayMat);
  leftLip.position.set(-trayWidth / 2 + lipThick / 2, 0, lipZ);
  leftLip.userData = { partId: 'smartphone-telemetry' };
  const rightLip = new THREE.Mesh(sideLipGeo, trayMat);
  rightLip.position.set(trayWidth / 2 - lipThick / 2, 0, lipZ);
  rightLip.userData = { partId: 'smartphone-telemetry' };

  // Top & Bottom lips
  const endLipGeo = new THREE.BoxGeometry(trayWidth, lipThick, lipHeight);
  const topLip = new THREE.Mesh(endLipGeo, trayMat);
  topLip.position.set(0, trayLength / 2 - lipThick / 2, lipZ);
  topLip.userData = { partId: 'smartphone-telemetry' };
  const bottomLip = new THREE.Mesh(endLipGeo, trayMat);
  bottomLip.position.set(0, -trayLength / 2 + lipThick / 2, lipZ);
  bottomLip.userData = { partId: 'smartphone-telemetry' };

  trayGroup.add(leftLip, rightLip, topLip, bottomLip);

  // Layer 2: Foam Pad (thin dark pad inside pocket for vibration damping)
  const foamGeo = new THREE.BoxGeometry(phoneWidth - mmToUnits(0.5), phoneLength - mmToUnits(0.5), mmToUnits(1.2));
  const foamMesh = new THREE.Mesh(foamGeo, foamMat);
  foamMesh.position.set(0, 0, trayThickness / 2 + mmToUnits(0.6));
  foamMesh.userData = { partId: 'smartphone-telemetry' };

  // Layer 3: Smartphone Body
  const phoneMeshGroup = new THREE.Group();
  phoneMeshGroup.name = 'phone-body';

  // Face 0: +X, 1: -X, 2: +Y, 3: -Y (metal frame)
  // Face 4: +Z (screen with canvas texture)
  // Face 5: -Z (dark glass back)
  const phoneMaterials = [
    phoneFrameMat,     // +X
    phoneFrameMat,     // -X
    phoneFrameMat,     // +Y
    phoneFrameMat,     // -Y
    phoneScreenMat,    // +Z (Display face)
    phoneGlassBackMat, // -Z (Back face)
  ];
  const phoneBodyGeo = new THREE.BoxGeometry(phoneWidth, phoneLength, phoneThickness);
  const phoneBodyMesh = new THREE.Mesh(phoneBodyGeo, phoneMaterials);
  phoneBodyMesh.castShadow = true;
  phoneBodyMesh.receiveShadow = true;
  phoneBodyMesh.userData = { partId: 'smartphone-telemetry' };
  phoneMeshGroup.add(phoneBodyMesh);

  // Rear camera bump on back face (-Z)
  const cameraBumpGeo = new THREE.BoxGeometry(phoneWidth * 0.32, phoneLength * 0.16, mmToUnits(1.8));
  const cameraBumpMesh = new THREE.Mesh(cameraBumpGeo, phoneFrameMat);
  cameraBumpMesh.position.set(phoneWidth * 0.22, phoneLength * 0.34, -phoneThickness / 2 - mmToUnits(0.9));
  cameraBumpMesh.userData = { partId: 'smartphone-telemetry' };

  // Dual camera lens circles on camera bump
  const lensGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.001, 16);
  lensGeo.rotateX(Math.PI / 2);
  const lens1 = new THREE.Mesh(lensGeo, phoneGlassBackMat);
  lens1.position.set(phoneWidth * 0.22, phoneLength * 0.34 + 0.010, -phoneThickness / 2 - mmToUnits(1.85));
  lens1.userData = { partId: 'smartphone-telemetry' };
  const lens2 = new THREE.Mesh(lensGeo, phoneGlassBackMat);
  lens2.position.set(phoneWidth * 0.22, phoneLength * 0.34 - 0.010, -phoneThickness / 2 - mmToUnits(1.85));
  lens2.userData = { partId: 'smartphone-telemetry' };
  phoneMeshGroup.add(cameraBumpMesh, lens1, lens2);

  phoneMeshGroup.position.set(0, 0, trayThickness / 2 + mmToUnits(1.2) + phoneThickness / 2);

  // Layer 4: Hold-down straps (two transverse clamp brackets across top & bottom)
  // Leaves the "PHONE TELEMETRY" display and traces completely open
  const strapsGroup = new THREE.Group();
  strapsGroup.name = 'phone-hold-down-straps';

  const strapSpan = trayWidth + mmToUnits(2);
  const strapHeight = mmToUnits(14);
  const strapDepth = mmToUnits(2.2);
  const strapGeo = new THREE.BoxGeometry(strapSpan, strapHeight, strapDepth);

  const topStrap = new THREE.Mesh(strapGeo, strapMat);
  topStrap.position.set(0, phoneLength * 0.38, 0);
  topStrap.userData = { partId: 'smartphone-telemetry' };

  const bottomStrap = new THREE.Mesh(strapGeo, strapMat);
  bottomStrap.position.set(0, -phoneLength * 0.38, 0);
  bottomStrap.userData = { partId: 'smartphone-telemetry' };
  strapsGroup.add(topStrap, bottomStrap);

  strapsGroup.position.set(0, 0, trayThickness / 2 + mmToUnits(1.2) + phoneThickness + strapDepth / 2);

  // Layer 5: Fasteners (4 screws holding tray to sled standoffs, and 4 clamp screws holding straps)
  const screwsGroup = new THREE.Group();
  screwsGroup.name = 'phone-fasteners';

  const screwShankGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.006, 12);
  screwShankGeo.rotateX(Math.PI / 2);
  const screwHeadGeo = new THREE.CylinderGeometry(0.0032, 0.0032, 0.002, 12);
  screwHeadGeo.rotateX(Math.PI / 2);

  const createScrewMesh = () => {
    const sGroup = new THREE.Group();
    const shank = new THREE.Mesh(screwShankGeo, materials.boltSteelMaterial);
    const head = new THREE.Mesh(screwHeadGeo, materials.boltSteelMaterial);
    head.position.z = 0.003;
    shank.userData = { partId: 'smartphone-telemetry' };
    head.userData = { partId: 'smartphone-telemetry' };
    sGroup.add(shank, head);
    return sGroup;
  };

  // 4 clamp screws (2 on top strap, 2 on bottom strap)
  const clampScrewPositions = [
    { x: -strapSpan * 0.42, y: phoneLength * 0.38 },
    { x: strapSpan * 0.42, y: phoneLength * 0.38 },
    { x: -strapSpan * 0.42, y: -phoneLength * 0.38 },
    { x: strapSpan * 0.42, y: -phoneLength * 0.38 },
  ];
  const clampScrews: THREE.Group[] = [];
  clampScrewPositions.forEach((pos) => {
    const sc = createScrewMesh();
    sc.position.set(pos.x, pos.y, 0);
    clampScrews.push(sc);
    screwsGroup.add(sc);
  });

  // 4 tray standoff screws (at tray corners)
  const trayScrewsGroup = new THREE.Group();
  trayScrewsGroup.name = 'tray-fasteners';
  phoneStandoffOffsetsX.forEach((sx) => {
    phoneStandoffOffsetsY.forEach((sy) => {
      const sc = createScrewMesh();
      sc.position.set(sx, sy, -0.003);
      trayScrewsGroup.add(sc);
    });
  });

  screwsGroup.position.set(0, 0, trayThickness / 2 + mmToUnits(1.2) + phoneThickness + strapDepth + 0.002);

  // Short dashed cyan leader lines from screws to their holes (visible when exploded)
  const screwLines: THREE.Line[] = [];
  const screwLineMat = new THREE.LineDashedMaterial({
    color: 0x00e5ff,
    dashSize: 0.008,
    gapSize: 0.006,
    transparent: true,
    opacity: 0.75,
  });

  clampScrewPositions.forEach((pos) => {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(pos.x, pos.y, 0),
      new THREE.Vector3(pos.x, pos.y, 0.03),
    ]);
    const line = new THREE.Line(lineGeo, screwLineMat);
    line.computeLineDistances();
    line.visible = false;
    phoneGroup.add(line);
    screwLines.push(line);
  });

  // Assemble all layers into phoneGroup
  phoneGroup.add(
    trayGroup,
    trayScrewsGroup,
    foamMesh,
    phoneMeshGroup,
    strapsGroup,
    screwsGroup
  );
  rootGroup.add(phoneGroup);

  // Dashed cyan leader line connecting Phone Assembly back to mounting sled in bay
  const phoneLeaderLinePoints = [
    new THREE.Vector3(phoneCenterX, phoneCenterY, -0.010),
    new THREE.Vector3(phoneCenterX, phoneCenterY, -0.004),
  ];
  const phoneLeaderLineGeo = new THREE.BufferGeometry().setFromPoints(phoneLeaderLinePoints);
  const phoneLeaderLineMat = new THREE.LineDashedMaterial({
    color: 0x00e5ff,
    dashSize: 0.035,
    gapSize: 0.02,
    transparent: true,
    opacity: 0.85,
  });
  const phoneLeaderLine = new THREE.Line(phoneLeaderLineGeo, phoneLeaderLineMat);
  phoneLeaderLine.computeLineDistances();
  phoneLeaderLine.visible = false;
  rootGroup.add(phoneLeaderLine);

  // Floating label sprite "Smartphone Telemetry" beside the phone when exploded
  const phoneFloatingLabel = createPhoneFloatingLabel('Smartphone Telemetry');
  phoneFloatingLabel.group.visible = false;
  rootGroup.add(phoneFloatingLabel.group);

  // ----------------------------------------------------
  // 6. NOSE CONE (0 mm to 550 mm, length 550 mm)
  // Von Kármán aerodynamic profile, fineness ratio 5.39:1 (550 / 102)
  // Carbon Fibre Grey (#8B939B) with glossy clear-coat & aluminium pitot probe
  // Houses main parachute pack inside hollow cavity
  // ----------------------------------------------------
  const noseGroup = new THREE.Group();
  noseGroup.name = 'nose-cone';

  const noseLength = mmToUnits(ROCKET_SPEC.axialLayout.noseCone.lengthMm); // 550 mm -> 1.375
  const noseBaseY = avionicsCenterY + avionicsLength / 2; // +1.125
  const wallUnits = mmToUnits(ROCKET_SPEC.airframe.wallThicknessMm); // 3 mm -> 0.0075

  // Generate Von Kármán / LD-Haack supersonic series profile (outer and inner hollow shell)
  const noseSteps = 56;
  const noseOuterProfile: THREE.Vector2[] = [];
  const noseInnerProfile: THREE.Vector2[] = [];

  for (let i = 0; i <= noseSteps; i++) {
    const t = i / noseSteps; // 0 (tip) to 1 (base)
    const yRel = (1.0 - t) * noseLength; // Tip at noseLength, base at 0

    // Haack series / Von Kármán radius formula:
    // theta = acos(1 - 2*t)
    // r = (R / sqrt(pi)) * sqrt(theta - sin(2*theta)/2)
    const theta = Math.acos(Math.max(-1, Math.min(1, 1 - 2 * t)));
    const rNorm = Math.sqrt(Math.max(0, theta - Math.sin(2 * theta) / 2)) / Math.sqrt(Math.PI);
    const rOuter = Math.max(0.003, rNorm * outerRadius);
    const rInner = Math.max(0.001, rOuter - wallUnits);

    noseOuterProfile.push(new THREE.Vector2(rOuter, yRel));
    noseInnerProfile.push(new THREE.Vector2(rInner, yRel));
  }

  // Combine into a closed hollow shell curve:
  // outer tip -> outer base -> inner base -> inner tip
  const nosePoints: THREE.Vector2[] = [];
  // Outer profile from tip to base
  for (let i = 0; i <= noseSteps; i++) {
    nosePoints.push(noseOuterProfile[i]);
  }
  // Base annular wall rim
  nosePoints.push(new THREE.Vector2(innerRadius, 0));
  // Inner hollow cavity from base back up to tip
  for (let i = noseSteps; i >= 0; i--) {
    nosePoints.push(noseInnerProfile[i]);
  }
  // Close apex
  nosePoints.push(new THREE.Vector2(0.002, noseLength));

  const noseGeo = new THREE.LatheGeometry(nosePoints, 64);
  noseGeo.computeVertexNormals();
  const noseMesh = new THREE.Mesh(noseGeo, materials.noseConeMaterial);
  noseMesh.castShadow = true;
  noseMesh.receiveShadow = true;
  noseMesh.position.y = noseBaseY;
  noseMesh.userData = { partId: 'nose-cone' };

  // Light silver aluminium pitot air-data stagnation probe at nose apex
  const pitotLength = 0.14;
  const pitotBaseGeo = new THREE.CylinderGeometry(0.0035, 0.007, pitotLength * 0.6, 24);
  const pitotBase = new THREE.Mesh(pitotBaseGeo, materials.pitotTipMaterial);
  pitotBase.position.y = noseBaseY + noseLength + pitotLength * 0.3;
  pitotBase.userData = { partId: 'nose-cone' };

  const pitotNeedleGeo = new THREE.CylinderGeometry(0.0015, 0.0015, pitotLength * 0.4, 16);
  const pitotNeedle = new THREE.Mesh(pitotNeedleGeo, materials.pitotTipMaterial);
  pitotNeedle.position.y = noseBaseY + noseLength + pitotLength * 0.8;
  pitotNeedle.userData = { partId: 'nose-cone' };

  // Internal Main Parachute Pack (0.45 kg toroidal parachute + Kevlar shock bridle)
  // Visible inside hollow nose cone cavity, separating cleanly during exploded view
  const mainChutePackGeo = new THREE.TorusGeometry(innerRadius * 0.50, 0.024, 16, 32);
  mainChutePackGeo.rotateX(Math.PI / 2);
  const mainChutePack = new THREE.Mesh(mainChutePackGeo, materials.parachuteMaterial);
  mainChutePack.position.y = noseBaseY + noseLength * 0.28;
  mainChutePack.userData = { partId: 'nose-cone' };

  noseGroup.add(noseMesh, pitotBase, pitotNeedle, mainChutePack);
  rootGroup.add(noseGroup);

  // ----------------------------------------------------
  // REGISTER PART GROUPS & EXPLOSION KINEMATICS
  // ----------------------------------------------------
  const registerPart = (
    id: string,
    name: string,
    assembly: string,
    order: number,
    group: THREE.Group,
    explodedDeltaY: number,
    explodedRadialDelta = 0
  ) => {
    const meshes: THREE.Mesh[] = [];
    const originalMaterials: (THREE.Material | THREE.Material[])[] = [];

    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        meshes.push(obj);
        originalMaterials.push(obj.material);
      }
    });

    parts.set(id, {
      id,
      name,
      assembly,
      order,
      group,
      initialY: group.position.y,
      explodedDeltaY,
      explodedRadialDelta,
      meshes,
      originalMaterials,
    });
  };

  // Register all 6 major assemblies nose-to-tail + separate Flight Computer PCB + Smartphone Telemetry
  registerPart('nose-cone', 'Nose Cone', 'Forward Aerodynamic Fairing', 1, noseGroup, 3.2, 0);
  registerPart('flight-computer-pcb', 'Flight Computer 3.1', 'Avionics & Payload Bay', 2.1, pcbGroup, 2.45, 0.80);
  registerPart('smartphone-telemetry', 'Smartphone Telemetry', 'Avionics & Payload Bay', 2.2, phoneGroup, 2.2, 0.85);
  registerPart('avionics-bay', 'Avionics Bay', 'Avionics & Payload Bay', 2, avionicsGroup, 1.8, 0);
  registerPart('drogue-bay', 'Drogue Bay', 'Recovery Subsystem', 3, drogueGroup, 0.8, 0);
  registerPart('booster-section', 'Booster Section', 'Airframe / Propulsion Bay', 4, boosterGroup, -0.2, 0);
  registerPart('inner-motor', 'Inner Motor (M1928)', 'Solid Rocket Motor', 5, motorGroup, -1.3, 0);
  registerPart('fins', 'Stabilizing Fins (x4)', 'Aerodynamic Empennage', 6, finsGroup, -0.6, 0.45);

  // Smooth explosion kinematics updater
  const updateExplosion = (progress: number) => {
    const ease = 1 - Math.pow(1 - progress, 3);

    parts.forEach((part) => {
      if (part.id === 'flight-computer-pcb') {
        // PCB Kinematics:
        // 1. Axial exit leads so the PCB exits through the open top rim of the tube before radial separation kicks in
        const axialLead = 0.70 * smoothstep(0.0, 0.5, progress);
        const pcbY = pcbCenterY + (1.8 + axialLead) * ease;

        // 2. Radial displacement starts smoothly once board clears tube top (progress >= 0.35)
        const radialFactor = smoothstep(0.35, 1.0, progress);
        const currentRadial = 0.80 * radialFactor;
        // Direction toward camera in Iso 45° (+X, +Z quadrant, angle ~50°)
        const radAngle = (50 * Math.PI) / 180;
        part.group.position.x = Math.cos(radAngle) * currentRadial;
        part.group.position.y = pcbY;
        part.group.position.z = Math.sin(radAngle) * currentRadial;

        // 3. Tilt/rotation toward camera at full explosion:
        // Rotates ~18-20° toward camera so component side is easily readable from default Iso 45° view
        part.group.rotation.x = THREE.MathUtils.degToRad(-18) * ease;
        part.group.rotation.y = THREE.MathUtils.degToRad(20) * ease;
      } else if (part.id === 'smartphone-telemetry') {
        // Smartphone Kinematics:
        // 1. Axial exit leads so the phone assembly exits past the tube rim
        const axialLead = 0.70 * smoothstep(0.0, 0.5, progress);
        const phoneY = phoneCenterY + (1.8 + axialLead) * ease;

        // 2. Radial displacement on opposite side from PCB (angle 125°, -X, +Z quadrant)
        const radialFactor = smoothstep(0.35, 1.0, progress);
        const currentRadial = 0.85 * radialFactor;
        const radAngle = (125 * Math.PI) / 180;
        part.group.position.x = Math.cos(radAngle) * currentRadial;
        part.group.position.y = phoneY;
        part.group.position.z = Math.sin(radAngle) * currentRadial;

        // 3. Tilt toward camera 15-25° so PHONE TELEMETRY screen is easily readable
        part.group.rotation.x = THREE.MathUtils.degToRad(-16) * ease;
        part.group.rotation.y = THREE.MathUtils.degToRad(-22) * ease;

        // 4. Staged internal exploded stack along phone's normal axis (local Z):
        trayGroup.position.z = -0.016 * ease;
        trayScrewsGroup.position.z = -0.036 * ease;
        foamMesh.position.z = (trayThickness / 2 + mmToUnits(0.6)) - 0.007 * ease;
        phoneMeshGroup.position.z = (trayThickness / 2 + mmToUnits(1.2) + phoneThickness / 2) + 0.008 * ease;
        strapsGroup.position.z = (trayThickness / 2 + mmToUnits(1.2) + phoneThickness + strapDepth / 2) + 0.030 * ease;
        screwsGroup.position.z = (trayThickness / 2 + mmToUnits(1.2) + phoneThickness + strapDepth + 0.002) + 0.055 * ease;

        // Update short dashed cyan leader lines from screws to their holes
        const isExp = progress > 0.05;
        screwLines.forEach((line, idx) => {
          line.visible = isExp;
          if (isExp) {
            const pos = clampScrewPositions[idx];
            const pAttr = line.geometry.attributes.position as THREE.BufferAttribute;
            pAttr.setXYZ(0, pos.x, pos.y, strapsGroup.position.z);
            pAttr.setXYZ(1, pos.x, pos.y, screwsGroup.position.z);
            pAttr.needsUpdate = true;
            line.computeLineDistances();
          }
        });
      } else {
        // Axial separation along Y
        part.group.position.y = part.initialY + part.explodedDeltaY * ease;

        // Radial displacement for stabilizing fins
        if (part.id === 'fins' && part.explodedRadialDelta) {
          const radDist = part.explodedRadialDelta * ease;
          for (let i = 0; i < finMeshes.length; i++) {
            const angle = (i * Math.PI) / 2;
            const baseFinX = Math.cos(angle) * outerRadius;
            const baseFinZ = Math.sin(angle) * outerRadius;

            finMeshes[i].position.x = baseFinX + Math.cos(angle) * radDist;
            finMeshes[i].position.z = baseFinZ + Math.sin(angle) * radDist;
          }
        }
      }
    });

    // Update thin dashed cyan leader line connecting PCB back to mounting sled in bay
    if (progress > 0.02 && pcbGroup.visible && avionicsGroup.visible) {
      leaderLine.visible = true;
      const mountY = pcbCenterY + 1.8 * ease;
      const posAttr = leaderLineGeo.attributes.position as THREE.BufferAttribute;
      posAttr.setXYZ(0, pcbCenterX, mountY, -0.010);
      posAttr.setXYZ(1, pcbGroup.position.x, pcbGroup.position.y, pcbGroup.position.z);
      posAttr.needsUpdate = true;
      leaderLine.computeLineDistances();
    } else {
      leaderLine.visible = false;
    }

    // Update thin dashed cyan leader line connecting Phone Assembly back to mounting sled in bay
    if (progress > 0.02 && phoneGroup.visible && avionicsGroup.visible) {
      phoneLeaderLine.visible = true;
      const mountY = phoneCenterY + 1.8 * ease;
      const posAttr = phoneLeaderLineGeo.attributes.position as THREE.BufferAttribute;
      posAttr.setXYZ(0, phoneCenterX, mountY, -0.010);
      posAttr.setXYZ(1, phoneGroup.position.x, phoneGroup.position.y, phoneGroup.position.z);
      posAttr.needsUpdate = true;
      phoneLeaderLine.computeLineDistances();
    } else {
      phoneLeaderLine.visible = false;
    }

    // Update floating label beside phone
    if (progress > 0.15 && phoneGroup.visible) {
      phoneFloatingLabel.group.visible = true;
      phoneFloatingLabel.group.position.set(
        phoneGroup.position.x - 0.22,
        phoneGroup.position.y + 0.14,
        phoneGroup.position.z + 0.05
      );
    } else {
      phoneFloatingLabel.group.visible = false;
    }
  };

  // Glowing neon cyan edge contour material for selected part
  const edgeGlowMat = new THREE.LineBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const activeHighlightLines: { line: THREE.LineSegments; parent: THREE.Mesh }[] = [];
  let currentHighlightedId: string | null = null;
  const originalEmissiveMap = new Map<THREE.MeshStandardMaterial, { color: number; intensity: number }>();

  const highlightPart = (partId: string | null) => {
    // 1. Remove previous edge lines
    activeHighlightLines.forEach(({ line, parent }) => {
      parent.remove(line);
      line.geometry.dispose();
    });
    activeHighlightLines.length = 0;

    // 2. Restore previous materials
    originalEmissiveMap.forEach((orig, mat) => {
      mat.emissive.setHex(orig.color);
      mat.emissiveIntensity = orig.intensity;
    });
    originalEmissiveMap.clear();

    currentHighlightedId = partId;
    if (!partId) return;

    const selectedPart = parts.get(partId);
    if (!selectedPart) return;

    // 3. Attach precision edge contours directly as children of each mesh
    selectedPart.meshes.forEach((mesh) => {
      const applyEmissive = (mat: THREE.Material) => {
        if (mat instanceof THREE.MeshStandardMaterial) {
          if (!originalEmissiveMap.has(mat)) {
            originalEmissiveMap.set(mat, {
              color: mat.emissive.getHex(),
              intensity: mat.emissiveIntensity,
            });
          }
          mat.emissive.setHex(0x00384d);
          mat.emissiveIntensity = 0.95;
        }
      };

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(applyEmissive);
      } else {
        applyEmissive(mesh.material);
      }

      try {
        const edgesGeo = new THREE.EdgesGeometry(mesh.geometry, 28);
        const edgeLines = new THREE.LineSegments(edgesGeo, edgeGlowMat);
        edgeLines.raycast = () => {};
        edgeLines.renderOrder = 10;
        mesh.add(edgeLines);
        activeHighlightLines.push({ line: edgeLines, parent: mesh });
      } catch (e) {
        // Fallback for non-manifold meshes
      }
    });
  };

  const updateHighlightAnimation = (time: number) => {
    const pulse = 0.75 + Math.sin(time * 3.5) * 0.22;
    edgeGlowMat.opacity = pulse;

    if (currentHighlightedId) {
      originalEmissiveMap.forEach((_, mat) => {
        mat.emissiveIntensity = 0.70 + Math.sin(time * 3.5) * 0.30;
      });
    }
  };

  const setWireframe = (enabled: boolean) => {
    rootGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => {
            if (m && 'wireframe' in m) {
              (m as THREE.MeshStandardMaterial).wireframe = enabled;
            }
          });
        } else if (obj.material && 'wireframe' in obj.material) {
          (obj.material as THREE.MeshStandardMaterial).wireframe = enabled;
        }
      }
    });
  };

  const setFinVisualScale = (scale: number) => {
    finMeshes.forEach((mesh) => {
      // Scales visual semi-span (radial X) only without altering chord or thickness
      mesh.scale.set(scale, 1.0, 1.0);
    });
  };

  const setPartVisibility = (partId: string, visible: boolean) => {
    const part = parts.get(partId);
    if (part) {
      part.group.visible = visible;
    }
    if (!pcbGroup.visible || !avionicsGroup.visible) {
      leaderLine.visible = false;
    }
    if (!phoneGroup.visible || !avionicsGroup.visible) {
      phoneLeaderLine.visible = false;
      phoneFloatingLabel.group.visible = false;
    }
  };

  const getPcbPosition = () => {
    return pcbGroup.position.clone();
  };

  const getPhonePosition = () => {
    return phoneGroup.position.clone();
  };

  const dispose = () => {
    highlightPart(null);
    edgeGlowMat.dispose();
    finEdgeMat.dispose();
    finEdgesGeo.dispose();
    finFilletGeo.dispose();
    leaderLineGeo.dispose();
    leaderLineMat.dispose();
    phoneLeaderLineGeo.dispose();
    phoneLeaderLineMat.dispose();
    phoneFloatingLabel.dispose();
    pcbGeo.dispose();
    pcbTexture.dispose();
    pcbTopMaterial.dispose();
    plainPcbGreenMaterial.dispose();
    phoneScreenTexture.dispose();
    phoneScreenMat.dispose();
    phoneFrameMat.dispose();
    phoneGlassBackMat.dispose();
    trayMat.dispose();
    foamMat.dispose();
    strapMat.dispose();
    screwLineMat.dispose();
    screwLines.forEach((l) => l.geometry.dispose());
    trayBaseGeo.dispose();
    sideLipGeo.dispose();
    endLipGeo.dispose();
    foamGeo.dispose();
    phoneBodyGeo.dispose();
    cameraBumpGeo.dispose();
    lensGeo.dispose();
    strapGeo.dispose();
    screwShankGeo.dispose();
    screwHeadGeo.dispose();
    sledPlateGeo.dispose();
    standoffGeo.dispose();
    rootGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });
  };

  return {
    rootGroup,
    parts,
    materials,
    updateExplosion,
    highlightPart,
    updateHighlightAnimation,
    setWireframe,
    setFinVisualScale,
    setPartVisibility,
    getPcbPosition,
    getPhonePosition,
    dispose,
  };
}
