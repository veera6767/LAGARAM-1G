import { RocketPartInfo } from '../types';

/**
 * =========================================================================
 * ROCKET_SPEC: Single Source of Truth for Geometry, Masses, and Specifications
 * =========================================================================
 */
export const ROCKET_SPEC = {
  project: {
    name: 'LAGARAM-1',
    fullTitle: 'Performance Characterization of a Sounding Rocket for Weather Applications',
  },

  airframe: {
    totalLengthMm: 2000,
    totalLengthM: 2.00,
    outerDiameterMm: 102,
    wallThicknessMm: 3,
    innerDiameterMm: 96, // derived: 102 - 2 * 3
    outerRadiusMm: 51,
    innerRadiusMm: 48,
    finenessRatio: 19.61, // 2000 / 102
  },

  // Axial layout from nose tip (x = 0) toward the tail (x = 2000 mm)
  // Check: 550 + 250 + 400 + 800 = 2000 mm
  axialLayout: {
    noseCone: {
      startMm: 0,
      endMm: 550,
      lengthMm: 550,
      finenessRatio: 5.39, // 550 / 102 = 5.39:1 (Von Karman profile)
    },
    avionicsBay: {
      startMm: 550,
      endMm: 800,
      lengthMm: 250,
    },
    drogueBay: {
      startMm: 800,
      endMm: 1200,
      lengthMm: 400,
    },
    boosterSection: {
      startMm: 1200,
      endMm: 2000,
      lengthMm: 800,
    },
    innerMotor: {
      startMm: 1300,
      endMm: 2000,
      lengthMm: 700, // inside booster section, aft-aligned
    },
  },

  // Stabilizing Fins (x4) - Single Source of Truth
  fins: {
    count: 4,
    material: 'G10 Fiberglass Composite',
    colorSwatch: '#8DB8A0',
    colorName: 'G10 Fibreglass Green',
    rootChordMm: 170,
    tipChordMm: 62,
    semiSpanMm: 85,
    thicknessMm: 6,
    totalMassKg: 0.44, // 0.11 kg per fin
    sweepMm: 108, // cr - ct = 170 - 62 = 108 mm
    sweepTag: 'Derived: straight trailing edge',
    sweepAngleDeg: Number(((Math.atan(108 / 85) * 180) / Math.PI).toFixed(1)), // 51.8 degrees
    finAreaMm2: Number((((170 + 62) / 2) * 85).toFixed(0)), // 9,860 mm²
    spanTipToTipMm: 102 + 2 * 85, // 272 mm
    trailingEdgeAlignment: 'Straight trailing edge, flush with aft end of booster section (x = 2000 mm)',
    rootLeadingEdgeMm: 1830, // 2000 - 170 = 1830 mm
    rootTrailingEdgeMm: 2000,
  },

  // Inner Motor: M1928
  motor: {
    designation: 'M1928',
    software: 'OpenMotor',
    totalImpulseNs: 7926,
    averageThrustN: 1943,
    burnTimeS: 4.08,
    avgChamberPressurePsi: 672,
    peakChamberPressurePsi: 1138,
    deliveredIspS: 258.4,
    grainConfig: 'Four-segment BATES grain (progressive thrust curve)',
    burnRateCoeffA: '0.025 in/s/psi^n',
    burnRateExponentN: 0.35,
    casingMaterial: '6061-T6 Aluminium',
    casingOuterDiameterMm: 98,
    casingWallThicknessMm: 4, // 4 mm wall (increased from 3 mm)
    casingInnerDiameterMm: 90, // 98 - 2 * 4
    casingLengthMm: 700,
    casingMassKg: 2.39, // Casing + hardware (including exhaust nozzle)
    propellantComposition: '70/16/14 AP/Al/HTPB',
    propellantMassKg: 3.13,
    totalMotorMassKg: 5.52, // 2.39 + 3.13
    hoopStressMpa: 92.2,
    factorOfSafety: 2.99,
    badge: 'OPENROCKET + RASAERO II',
  },

  // NASA CEA Thermochemical Data (70/16/14 AP/Al/HTPB at 600 psia)
  nasaCea: {
    propellant: '70/16/14 AP/Al/HTPB at 600 psia',
    chamberTempK: 3723.7,
    throatTempK: 3549.2,
    exitTempK: 2626.8,
    chamberPressureBar: 41.368,
    exitPressureBar: 1.086,
    exitMach: 2.817,
    thrustCoefficient: 1.5485,
    cStarMs: 1743.6,
    theoreticalIspS: 275.2,
    deliveredIspS: 236, // eta = 0.87
    deliveredEta: 0.87,
    exhaustSpecies: [
      { species: 'Al2O3(l)', percentage: '30.1%' },
      { species: 'CO', percentage: '27.6%' },
      { species: 'HCl', percentage: '20.8%' },
    ],
    thermalNote: 'The high chamber temperature (3,723.7 K) needs a graphite or graphite-phenolic throat insert.',
  },

  // Flight Simulation Comparison (OpenRocket vs RASAero II)
  flightSimulation: {
    openRocket: {
      apogeeM: 5206,
      maxVelocityMs: 531,
      maxMach: 1.58,
      timeToApogeeS: 29.8,
      maxAccelerationMs2: 232, // Labelled explicitly as OpenRocket run
      peakDragLb: 'N/A',
      peakCd: 'N/A',
    },
    rasAeroII: {
      apogeeM: 4493,
      maxVelocityMs: 528.5,
      maxMach: 1.55,
      timeToApogeeS: 27.5,
      maxAccelerationMs2: 'N/A',
      peakDragLb: '~280 lb',
      peakCd: '~1.08',
    },
    supersonicNote: 'OpenRocket is not accurate above Mach 1; RASAero II used for better drag/stability prediction.',
    targetApogeeDisplay: '5,206 m (OpenRocket) | 4,493 m (RASAero II)',
  },

  // Aerodynamic Stability & Fin Flutter
  stability: {
    cgMmFromNose: 1290,
    cpMmFromNose: 1530,
    marginDistanceMm: 240, // 1530 - 1290
    marginCalibersOpenRocket: 2.38,
    marginCalibersHandCalc: 2.2,
    targetBandCalibers: '2.0 to 2.5 cal',
    status: 'Within Optimal Range',
    isWithinRange: true,
  },

  finFlutter: {
    standard: 'NACA TN 4197',
    material: 'G10 Fiberglass',
    shearModulusGpa: 5.34,
    flutterVelocityMs: 1428,
    maxSpeedMs: 531,
    safetyMargin: '2.69x',
    rule: 'Safe if max speed << flutter velocity (531 m/s << 1,428 m/s)',
    isSafe: true,
  },

  // Rail Exit Velocity Table (Min required: 15.0 m/s)
  railExitVelocity: {
    minRequiredMs: 15.0,
    railLengths: [
      { length: '1 m Rail', velocityMs: 10.6, status: 'NOT SAFE', safe: false },
      { length: '6 m Rail', velocityMs: 27.4, status: 'Very Safe', safe: true },
      { length: '7 m Rail', velocityMs: 30.1, status: 'Excellent', safe: true },
      { length: '8 m Rail', velocityMs: 32.1, status: 'Excellent', safe: true },
    ],
  },

  // Raw Itemized Masses (kg)
  itemizedMasses: {
    noseConeShell: 0.61, // carbon fibre composite shell 550 mm
    mainParachuteHarness: 0.45, // main parachute + harness housed in nose cone
    avionicsTube: 0.43, // 250 mm tube
    avionicsPayload: 2.30, // flight computers, sensors, payload
    drogueTube: 0.69, // 400 mm tube
    drogueParachuteHardware: 0.50, // drogue parachute + deployment hardware
    boosterTube: 1.38, // 800 mm booster tube
    motorCasingHardware: 2.39, // 6061-T6 casing + hardware + nozzle
    motorPropellant: 3.13, // 70/16/14 AP/Al/HTPB solid propellant
    finsTotal: 0.44, // 4x G10 fiberglass fins
    miscHardwareEpoxyPaint: 1.00, // not drawn, counted in total only
  },
} as const;

/**
 * =========================================================================
 * COMPUTED TOTALS (Derived automatically from ROCKET_SPEC, never typed in)
 * =========================================================================
 */
const m = ROCKET_SPEC.itemizedMasses;

// Total wet mass = 0.61 + 0.45 + 0.43 + 2.30 + 0.69 + 0.50 + 1.38 + 2.39 + 3.13 + 0.44 + 1.00 = 13.32 kg
const computedWetMassKg =
  m.noseConeShell +
  m.mainParachuteHarness +
  m.avionicsTube +
  m.avionicsPayload +
  m.drogueTube +
  m.drogueParachuteHardware +
  m.boosterTube +
  m.motorCasingHardware +
  m.motorPropellant +
  m.finsTotal +
  m.miscHardwareEpoxyPaint;

// Mass without motor (minus casing and propellant) = 13.32 - (2.39 + 3.13) = 7.80 kg
const computedMassWithoutMotorKg =
  computedWetMassKg - (m.motorCasingHardware + m.motorPropellant);

// Burnout mass (minus propellant) = 13.32 - 3.13 = 10.19 kg
const computedBurnoutMassKg = computedWetMassKg - m.motorPropellant;

export const VEHICLE_TOTALS = {
  wetMassKg: Number(computedWetMassKg.toFixed(2)), // 13.32
  dryMassKg: Number(computedMassWithoutMotorKg.toFixed(2)), // 7.80
  burnoutMassKg: Number(computedBurnoutMassKg.toFixed(2)), // 10.19
};

/**
 * Complete Itemized Mass Breakdown for UI inspection
 */
export const MASS_BREAKDOWN = [
  { item: 'Nose Cone Shell', material: 'Carbon Fibre', massKg: m.noseConeShell, category: 'Fairing' },
  { item: 'Main Parachute + Harness', material: 'Ripstop / Kevlar', massKg: m.mainParachuteHarness, category: 'Recovery' },
  { item: 'Avionics Bay Tube', material: 'Fiberglass (250 mm)', massKg: m.avionicsTube, category: 'Structure' },
  { item: 'Avionics + Weather Payload', material: 'Electronics / Sled', massKg: m.avionicsPayload, category: 'Payload' },
  { item: 'Drogue Bay Tube', material: 'Fiberglass (400 mm)', massKg: m.drogueTube, category: 'Structure' },
  { item: 'Drogue Parachute + Hardware', material: 'Canopy / Harness', massKg: m.drogueParachuteHardware, category: 'Recovery' },
  { item: 'Booster Section Tube', material: 'Fiberglass (800 mm)', massKg: m.boosterTube, category: 'Structure' },
  { item: 'Inner Motor Casing + Hardware', material: '6061-T6 Aluminium', massKg: m.motorCasingHardware, category: 'Propulsion' },
  { item: 'Solid Propellant (M1928)', material: '70/16/14 AP/Al/HTPB', massKg: m.motorPropellant, category: 'Propulsion' },
  { item: 'Stabilizing Fins (x4)', material: 'G10 Fiberglass', massKg: m.finsTotal, category: 'Empennage' },
  { item: 'Misc Hardware / Epoxy / Paint', material: 'Aerospace Fasteners', massKg: m.miscHardwareEpoxyPaint, category: 'Integration' },
];

/**
 * =========================================================================
 * ROCKET_PARTS: Rebuilt nose-to-tail with exact engineering data & layout
 * =========================================================================
 */
export const ROCKET_PARTS: RocketPartInfo[] = [
  {
    id: 'nose-cone',
    name: 'Nose Cone',
    assembly: 'Forward Aerodynamic Fairing',
    order: 1, // Nose to tail
    material: 'Carbon Fibre Composite',
    finish: 'Autoclave-cured clear-coated 2x2 twill Carbon Fibre Grey (#8B939B)',
    colorSwatch: '#8B939B',
    colorName: 'Carbon Fibre Grey',
    massKg: Number((m.noseConeShell + m.mainParachuteHarness).toFixed(2)), // 1.06 kg (0.61 shell + 0.45 chute)
    lengthMm: ROCKET_SPEC.axialLayout.noseCone.lengthMm, // 550 mm
    startMm: ROCKET_SPEC.axialLayout.noseCone.startMm, // 0 mm
    endMm: ROCKET_SPEC.axialLayout.noseCone.endMm, // 550 mm
    outerDiameterMm: ROCKET_SPEC.airframe.outerDiameterMm, // 102 mm
    innerDiameterMm: ROCKET_SPEC.airframe.innerDiameterMm, // 96 mm
    wallThicknessMm: ROCKET_SPEC.airframe.wallThicknessMm, // 3 mm
    finenessRatio: '5.39 : 1',
    description: 'Von Kármán (minimum supersonic wave drag) profile aerodynamic fairing with a high fineness ratio of 5.39:1 (550 mm length / 102 mm base diameter). Fabricated from autoclave-cured 2x2 twill carbon fibre composite with a glossy clear-coated Carbon Fibre Grey (#8B939B) finish. Features a light silver aluminium pitot air-data probe at the apex and houses the main parachute + tubular Kevlar deployment harness.',
    technicalDetails: [
      'Von Kármán LD-Haack supersonic aerodynamic series (fineness ratio 5.39:1, 550 mm length)',
      'Carbon-fibre composite shell (0.61 kg) with clear-coated Carbon Fibre Grey (#8B939B) finish',
      'Machined light silver 6061-T6 aluminium pitot probe tip for air-data stagnation pressure',
      'Houses the main toroidal recovery parachute + Kevlar shock harness (0.45 kg)',
      'Smooth aerodynamic shoulder interface mating flush to forward avionics bay'
    ],
    specs: [
      { label: 'Length', value: '550 mm' },
      { label: 'Base Diameter', value: '102 mm' },
      { label: 'Fineness Ratio', value: '5.39 : 1' },
      { label: 'Wall Thickness', value: '3.0 mm' },
      { label: 'Shell Mass', value: '0.61 kg' },
      { label: 'Main Parachute', value: '0.45 kg' },
      { label: 'Finish Tone', value: 'Carbon Fibre Grey (#8B939B)' },
      { label: 'Profile Form', value: 'Von Kármán (Haack)' }
    ],
    subParts: [
      { name: 'Carbon Fibre Shell', massKg: m.noseConeShell, note: '550 mm Von Karman fairing' },
      { name: 'Main Parachute + Harness', massKg: m.mainParachuteHarness, note: 'Primary high-altitude recovery' },
      { name: 'Aluminium Pitot Tip', note: 'Machined light silver air-data probe' }
    ],
    explodedYOffset: 3.2
  },
  {
    id: 'avionics-bay',
    name: 'Avionics Bay',
    assembly: 'Avionics & Payload Bay',
    order: 2,
    material: 'Filament-Wound Fiberglass Composite',
    finish: 'Smooth protective gloss finish with RF-transparent telemetry window',
    massKg: Number((m.avionicsTube + m.avionicsPayload).toFixed(2)), // 2.73 kg (0.43 tube + 2.30 payload)
    lengthMm: ROCKET_SPEC.axialLayout.avionicsBay.lengthMm, // 250 mm
    startMm: ROCKET_SPEC.axialLayout.avionicsBay.startMm, // 550 mm
    endMm: ROCKET_SPEC.axialLayout.avionicsBay.endMm, // 800 mm
    outerDiameterMm: ROCKET_SPEC.airframe.outerDiameterMm, // 102 mm
    innerDiameterMm: ROCKET_SPEC.airframe.innerDiameterMm, // 96 mm
    wallThicknessMm: ROCKET_SPEC.airframe.wallThicknessMm, // 3 mm
    description: 'Cylindrical 250 mm RF-transparent composite section housing the flight computers, 9-DOF IMU, telemetry radios, barometric sensors, and atmospheric sounding instruments. Replaces the former payload bay. Features internal visual 6061-T6 aluminium avionics bulkheads (with no separate mass penalty, included in payload).',
    technicalDetails: [
      'Dimensions: 250 mm axial length, 102 mm OD, 96 mm ID (3 mm hollow composite wall)',
      'Hollow cylinder allows internal mounting of shock-damped carbon fiber electronics sled',
      'Structural tube mass 0.43 kg + combined avionics/sensor payload mass 2.30 kg',
      'RF-transparent fiberglass walls enable internal 915 MHz / 2.4 GHz telemetry transmission',
      'Visual CNC-machined aluminium avionics bulkheads isolate avionics from recovery gas'
    ],
    specs: [
      { label: 'Length', value: '250 mm' },
      { label: 'Start / End Pos', value: '550 → 800 mm' },
      { label: 'Outer Diameter', value: '102 mm' },
      { label: 'Inner Diameter', value: '96 mm' },
      { label: 'Wall Thickness', value: '3.0 mm' },
      { label: 'Tube Mass', value: '0.43 kg' },
      { label: 'Avionics/Payload', value: '2.30 kg' },
      { label: 'Section Mass', value: '2.73 kg' }
    ],
    subParts: [
      { name: 'Airframe Tube', massKg: m.avionicsTube, note: '250 mm length, 3 mm wall' },
      { name: 'Flight Computer 3.1', note: '2-layer PCB, STM32' },
      { name: 'Avionics & Weather Payload', massKg: m.avionicsPayload, note: 'Flight computers & sensors' },
      { name: 'Avionics Bulkheads', note: 'Visual internal, mass included in payload' }
    ],
    explodedYOffset: 1.8
  },
  {
    id: 'flight-computer-pcb',
    name: 'Flight Computer 3.1',
    assembly: 'Avionics & Payload Bay',
    order: 2.1,
    parentId: 'avionics-bay',
    material: 'FR-4 (2-Layer Printed Circuit Board)',
    finish: 'Green Solder Mask with White Component Silkscreen',
    massKg: 0,
    massNote: 'Mass included in Avionics & Weather Payload (2.30 kg)',
    // Placeholder size fitting inside 96 mm ID airframe with clearance: 65 mm W x 97.5 mm L x 1.6 mm T (3:2 aspect ratio) - value to confirm
    lengthMm: 97.5,
    widthMm: 65,
    thicknessMm: 1.6,
    startMm: 626,
    endMm: 724,
    outerDiameterMm: 0,
    innerDiameterMm: 0,
    wallThicknessMm: 1.6,
    description: 'Flight Computer 3.1 custom flight controller board. Features a 2-layer PCB and STM32 microcontroller. Mounted flat along the rocket axis inside the RF-transparent composite avionics bay.',
    technicalDetails: [
      'Microcontroller: STM32 microcontroller',
      'PCB Substrate: 2-layer printed circuit board (1.6 mm thickness)',
      'Board Dimensions: 65 × 97.5 × 1.6 mm (3:2 aspect ratio, placeholder to confirm from CAD/EDA)',
      'Mounting: Mounted flat along rocket axis inside 96 mm ID avionics bay with standoff plate clearance',
      'Mass Allocation: Mass included in existing Avionics & Weather Payload (2.30 kg)'
    ],
    specs: [
      { label: 'Board Model', value: 'Flight Computer 3.1' },
      { label: 'Layer Count', value: '2-Layer PCB' },
      { label: 'Microcontroller', value: 'STM32' },
      { label: 'Thickness', value: '1.6 mm' },
      { label: 'Dimensions', value: '65 × 97.5 mm (to confirm)' },
      { label: 'Aspect Ratio', value: '~3 : 2' },
      { label: 'Mass', value: 'Part of 2.30 kg Payload' }
    ],
    explodedYOffset: 2.45,
    explodedRadialOffset: 0.80
  },
  {
    id: 'drogue-bay',
    name: 'Drogue Bay',
    assembly: 'Recovery Subsystem',
    order: 3,
    material: 'Filament-Wound Fiberglass Composite',
    finish: 'Filament-wound aerospace fiberglass tube with radial static ports',
    massKg: Number((m.drogueTube + m.drogueParachuteHardware).toFixed(2)), // 1.19 kg (0.69 tube + 0.50 drogue)
    lengthMm: ROCKET_SPEC.axialLayout.drogueBay.lengthMm, // 400 mm
    startMm: ROCKET_SPEC.axialLayout.drogueBay.startMm, // 800 mm
    endMm: ROCKET_SPEC.axialLayout.drogueBay.endMm, // 1200 mm
    outerDiameterMm: ROCKET_SPEC.airframe.outerDiameterMm, // 102 mm
    innerDiameterMm: ROCKET_SPEC.airframe.innerDiameterMm, // 96 mm
    wallThicknessMm: ROCKET_SPEC.airframe.wallThicknessMm, // 3 mm
    description: 'Cylindrical 400 mm recovery compartment housing the high-altitude drogue parachute, ejection charge canisters, and shock harness. Replaces the former recovery section. Contains a visual interstage bulkhead at its base with no separate mass penalty, providing structural anchor points for recovery shock lines.',
    technicalDetails: [
      'Dimensions: 400 mm length, 102 mm outer diameter, 96 mm inner diameter, 3 mm wall',
      'Structural tube mass 0.69 kg + drogue parachute and deployment hardware 0.50 kg',
      'Dual ejection charge deployment initiates drogue deployment precisely at apogee',
      'Visual internal 6061-T6 interstage bulkhead with shock cord forged eyebolt',
      'Calibrated shear pin ports ensure reliable mechanical compartment separation'
    ],
    specs: [
      { label: 'Length', value: '400 mm' },
      { label: 'Start / End Pos', value: '800 → 1200 mm' },
      { label: 'Outer Diameter', value: '102 mm' },
      { label: 'Inner Diameter', value: '96 mm' },
      { label: 'Wall Thickness', value: '3.0 mm' },
      { label: 'Tube Mass', value: '0.69 kg' },
      { label: 'Drogue Hardware', value: '0.50 kg' },
      { label: 'Section Mass', value: '1.19 kg' }
    ],
    subParts: [
      { name: 'Airframe Tube', massKg: m.drogueTube, note: '400 mm length, 3 mm wall' },
      { name: 'Drogue Parachute + Hardware', massKg: m.drogueParachuteHardware, note: 'Apogee stabilization canopy' },
      { name: 'Interstage Bulkhead', note: 'Visual internal, mass included in assembly' }
    ],
    explodedYOffset: 0.8
  },
  {
    id: 'booster-section',
    name: 'Booster Section',
    assembly: 'Airframe / Propulsion Bay',
    order: 4,
    material: 'Filament-Wound Fiberglass Composite',
    finish: 'High-rigidity composite structural cylinder housing inner motor',
    massKg: m.boosterTube, // 1.38 kg
    lengthMm: ROCKET_SPEC.axialLayout.boosterSection.lengthMm, // 800 mm
    startMm: ROCKET_SPEC.axialLayout.boosterSection.startMm, // 1200 mm
    endMm: ROCKET_SPEC.axialLayout.boosterSection.endMm, // 2000 mm
    outerDiameterMm: ROCKET_SPEC.airframe.outerDiameterMm, // 102 mm
    innerDiameterMm: ROCKET_SPEC.airframe.innerDiameterMm, // 96 mm
    wallThicknessMm: ROCKET_SPEC.airframe.wallThicknessMm, // 3 mm
    description: 'Main structural propulsion airframe cylinder (800 mm length, 102 mm OD, 96 mm ID, 3 mm wall, 1.38 kg mass). Hollow composite construction rendered with realistic wall thickness. Houses the separate internal M1928 solid rocket motor in its aft 700 mm portion and provides flush external mounting saddles for the 4 cruciform stabilizing fins.',
    technicalDetails: [
      'Dimensions: 800 mm axial length, 102 mm OD, 96 mm ID, 3 mm hollow wall thickness',
      'Structural tube empty mass: 1.38 kg (excludes internal motor and external fins)',
      'Houses 700 mm internal M1928 solid rocket motor from 1300 mm to 2000 mm aft',
      'Provides high torsional and bending stiffness against maximum aerodynamic Q',
      'Clear view into internal motor casing during exploded view and wireframe mode'
    ],
    specs: [
      { label: 'Length', value: '800 mm' },
      { label: 'Start / End Pos', value: '1200 → 2000 mm' },
      { label: 'Outer Diameter', value: '102 mm' },
      { label: 'Inner Diameter', value: '96 mm' },
      { label: 'Wall Thickness', value: '3.0 mm' },
      { label: 'Section Mass', value: '1.38 kg' },
      { label: 'Internal Motor', value: 'M1928 (700 mm)' },
      { label: 'External Fins', value: '4x Cruciform' }
    ],
    explodedYOffset: -0.2
  },
  {
    id: 'inner-motor',
    name: 'Inner Motor (M1928)',
    assembly: 'Solid Rocket Motor',
    order: 5,
    material: '6061-T6 Aluminium / Isostatic Graphite',
    finish: 'CNC-machined 6061-T6 casing (98 mm OD, 4 mm wall) with aft expansion nozzle',
    massKg: Number((m.motorCasingHardware + m.motorPropellant).toFixed(2)), // 5.52 kg (2.39 casing + 3.13 prop)
    lengthMm: ROCKET_SPEC.motor.casingLengthMm, // 700 mm
    startMm: ROCKET_SPEC.axialLayout.innerMotor.startMm, // 1300 mm
    endMm: ROCKET_SPEC.axialLayout.innerMotor.endMm, // 2000 mm
    outerDiameterMm: ROCKET_SPEC.motor.casingOuterDiameterMm, // 98 mm
    innerDiameterMm: ROCKET_SPEC.motor.casingInnerDiameterMm, // 90 mm
    wallThicknessMm: ROCKET_SPEC.motor.casingWallThicknessMm, // 4 mm
    description: 'Separate internal propulsion component housed inside the booster section (aft-aligned from 1300 to 2000 mm). High-strength 6061-T6 aluminium casing (98 mm OD, 4 mm wall thickness, 2.39 kg casing + hardware). Loaded with 3.13 kg of 70/16/14 AP/Al/HTPB solid propellant arranged in a four-segment BATES grain. Features a forward 8-bolt flange, spark-plug igniter, 90° pneumatic valve elbow, and a visual supersonic exhaust nozzle bell with graphite throat insert.',
    technicalDetails: [
      'Dimensions: 700 mm length, 98 mm OD, 4 mm wall (increased from 3 mm), 90 mm ID',
      'Empty casing + hardware mass 2.39 kg (6061-T6); propellant mass 3.13 kg',
      'Total Impulse: 7,926 N·s; Average Thrust: 1,943 N; Burn Time: 4.08 s',
      'Average Chamber Pressure: 672 psi; Peak Chamber Pressure: 1,138 psi',
      'Delivered Isp: 258.4 s; Hoop Stress: 92.2 MPa; Structural Factor of Safety: 2.99',
      'Visual stainless steel expansion nozzle with high-purity isostatic graphite throat insert'
    ],
    specs: [
      { label: 'Designation', value: 'M1928' },
      { label: 'Length', value: '700 mm' },
      { label: 'Axial Pos', value: '1300 → 2000 mm' },
      { label: 'Outer Diameter', value: '98 mm' },
      { label: 'Wall Thickness', value: '4.0 mm' },
      { label: 'Casing Mass', value: '2.39 kg (6061-T6)' },
      { label: 'Propellant Mass', value: '3.13 kg' },
      { label: 'Total Impulse', value: '7,926 N·s' },
      { label: 'Average Thrust', value: '1,943 N' },
      { label: 'Burn Time', value: '4.08 s' },
      { label: 'Delivered Isp', value: '258.4 s' },
      { label: 'Safety Factor', value: '2.99 (92.2 MPa)' }
    ],
    subParts: [
      { name: '6061-T6 Motor Casing', massKg: m.motorCasingHardware, note: '98 mm OD, 4 mm wall, 700 mm' },
      { name: 'BATES Propellant Grain', massKg: m.motorPropellant, note: '3.13 kg 70/16/14 AP/Al/HTPB' },
      { name: 'Exhaust Nozzle Bell', note: 'Visual sub-part, included in casing mass' },
      { name: 'Forward Flange & Fittings', note: '8-bolt circle, igniter & pneumatic elbow' }
    ],
    explodedYOffset: -1.2
  },
  {
    id: 'fins',
    name: 'Stabilizing Fins (x4)',
    assembly: 'Aerodynamic Empennage',
    order: 6,
    material: 'G10 fibreglass',
    finish: 'Precision chamfered leading/trailing edges, matte finish',
    massKg: m.finsTotal, // 0.44 kg total
    lengthMm: ROCKET_SPEC.fins.rootChordMm, // 170 mm
    startMm: ROCKET_SPEC.fins.rootLeadingEdgeMm, // 1830 mm
    endMm: ROCKET_SPEC.fins.rootTrailingEdgeMm, // 2000 mm
    outerDiameterMm: ROCKET_SPEC.fins.spanTipToTipMm, // 272 mm
    innerDiameterMm: ROCKET_SPEC.airframe.outerDiameterMm, // 102 mm root circle
    wallThicknessMm: ROCKET_SPEC.fins.thicknessMm, // 6 mm
    description: 'Trapezoidal G10 fins, straight trailing edge, flush with the aft end of the booster section.',
    technicalDetails: [
      'Material: G10 fibreglass | Count: 4 cruciform (90°)',
      'Root chord: 170 mm | Tip chord: 62 mm | Semi-span: 85 mm | Thickness: 6 mm',
      'Fin area: 9,860 mm² each (calculated: (170 + 62) / 2 * 85)',
      'Tip-to-tip span: 272 mm (calculated: 102 mm body + 2 * 85 mm)',
      'Leading-edge sweep: 51.8° (calculated, derived: cr - ct = 108 mm, atan(108 / 85))',
      'Total mass: 0.44 kg (0.11 kg per fin)',
      'NACA TN 4197 flutter velocity: 1,428 m/s | Safety margin: 2.69x'
    ],
    specs: [
      { label: 'Material', value: 'G10 fibreglass' },
      { label: 'Fin Count', value: '4' },
      { label: 'Total Mass', value: '0.44 kg' },
      { label: 'Root Chord', value: '170 mm' },
      { label: 'Tip Chord', value: '62 mm' },
      { label: 'Semi-Span', value: '85 mm' },
      { label: 'Thickness', value: '6 mm' },
      { label: 'Fin Area (each)', value: '9,860 mm² (calc)' },
      { label: 'Tip-to-Tip Span', value: '272 mm (calc)' },
      { label: 'LE Sweep Angle', value: '51.8° (derived)' },
      { label: 'Flutter Velocity', value: '1,428 m/s' },
      { label: 'Safety Margin', value: '2.69x' }
    ],
    explodedYOffset: -0.6,
    explodedRadialOffset: 0.45
  }
];

/**
 * Convenience Vehicle Summary object for Header and Top Level Stats
 */
export const VEHICLE_SUMMARY = {
  designation: ROCKET_SPEC.project.name,
  vehicleClass: 'Suborbital Aerodynamic Vehicle • Single-Stage Solid Rocket',
  totalLengthM: ROCKET_SPEC.airframe.totalLengthM,
  totalLengthMm: ROCKET_SPEC.airframe.totalLengthMm,
  outerDiameterMm: ROCKET_SPEC.airframe.outerDiameterMm,
  innerDiameterMm: ROCKET_SPEC.airframe.innerDiameterMm,
  wallThicknessMm: ROCKET_SPEC.airframe.wallThicknessMm,
  wetMassKg: VEHICLE_TOTALS.wetMassKg, // 13.32 kg
  dryMassKg: VEHICLE_TOTALS.dryMassKg, // 7.80 kg
  burnoutMassKg: VEHICLE_TOTALS.burnoutMassKg, // 10.19 kg
  maxVelocityMs: ROCKET_SPEC.flightSimulation.openRocket.maxVelocityMs, // 531
  maxMach: 'Mach 1.58',
  targetApogeeDisplay: ROCKET_SPEC.flightSimulation.targetApogeeDisplay,
  centerOfGravityMm: ROCKET_SPEC.stability.cgMmFromNose, // 1290 mm
  centerOfPressureMm: ROCKET_SPEC.stability.cpMmFromNose, // 1530 mm
  stabilityMarginCalibers: ROCKET_SPEC.stability.marginCalibersOpenRocket, // 2.38
  stabilityMarginHandCalc: ROCKET_SPEC.stability.marginCalibersHandCalc, // 2.2
  targetBandCalibers: ROCKET_SPEC.stability.targetBandCalibers, // 2.0 to 2.5 cal
  motorDesignation: ROCKET_SPEC.motor.designation, // M1928
  totalImpulseNs: ROCKET_SPEC.motor.totalImpulseNs, // 7926
  averageThrustN: ROCKET_SPEC.motor.averageThrustN, // 1943
  burnTimeS: ROCKET_SPEC.motor.burnTimeS, // 4.08
  badge: ROCKET_SPEC.motor.badge, // OPENROCKET + RASAERO II
};

export const OPENROCKET_SIMULATION = {
  software: 'OpenRocket + RASAero II',
  status: 'Engineering Verified',
  totalLengthCm: 200,
  totalLengthM: 2.00,
  maxDiameterMm: 102,
  maxDiameterCm: 10.2,
  dryMassKg: VEHICLE_TOTALS.dryMassKg,
  wetMassKg: VEHICLE_TOTALS.wetMassKg,
  cgCmFromNose: 129,
  cpCmFromNose: 153,
  stabilityMarginCalibers: 2.38,
  stabilityMarginHandCalc: 2.2,
  targetBand: '2.0 to 2.5 cal',
  motor: 'M1928',
  apogeeM: 5206,
  maxVelocityMs: 531,
  maxMachFormatted: 'Mach 1.58',
  maxAccelerationMs2: 232,
};
