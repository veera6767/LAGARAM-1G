export interface RocketSubPart {
  name: string;
  massKg?: number;
  note?: string;
}

export interface RocketPartInfo {
  id: string;
  name: string;
  assembly: string;
  order: number; // 1 (nose) to 6 (fins)
  material: string;
  finish: string;
  massKg: number; // Subtotal or component mass in kg
  lengthMm: number;
  startMm: number;
  endMm: number;
  outerDiameterMm: number;
  innerDiameterMm: number;
  wallThicknessMm: number;
  description: string;
  technicalDetails: string[];
  specs: {
    label: string;
    value: string;
  }[];
  explodedYOffset: number; // Vertical separation offset
  explodedRadialOffset?: number; // Radial separation for fins
  colorSwatch?: string;
  colorName?: string;
  finenessRatio?: string;
  subParts?: RocketSubPart[];
  parentId?: string;
  massNote?: string;
  widthMm?: number;
  thicknessMm?: number;
}

export type CameraPreset = 'hero' | 'engine' | 'recovery' | 'payload' | 'nose' | 'full' | 'fins' | 'pcb';

export interface ViewerSettings {
  isExploded: boolean;
  explodeProgress: number; // 0.0 to 1.0
  autoRotate: boolean;
  wireframe: boolean;
  showStabilityMarkers: boolean; // Center of Gravity & Center of Pressure
  finDetailScale?: boolean; // 1.5x visual scaling for inspection
}

