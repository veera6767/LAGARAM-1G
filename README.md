# LAGARAM ROCKET - 1G

Interactive 3D engineering inspector for **LAGARAM-1**, a high-power single-stage solid-propellant sounding rocket designed for atmospheric and meteorological research.

🔗 **Live website:** https://veera6767.github.io/LAGARAM-1G/

## About the Project
An interactive aerospace 3D engineering inspector and flight verification interface. Inspect alloy metallurgy, hollow cylindrical wall dimensions, axial stage layout, propulsion thermochemistry, and flight dynamics.

## Features
- **Interactive 3D Model**: Drag to orbit, scroll to zoom, click any section to inspect engineering specs.
- **Hand-Only Webcam Gesture Control**:
  - 🖐️ **Open Hand**: Move horizontally to continuously rotate the view; move closer/farther to zoom in/out with apparent hand depth.
  - ✊ **Fist (Hold 300ms)**: Trigger Exploded View.
  - ✌️ **Peace Sign (Hold 300ms)**: Collapse Model.
  - 🚫 **No Hand / Stillness**: Naturally holds position while mouse/keyboard remain fully active.
- **Exploded View & Scrubber**: Real-time axial and radial stage separation slider.
- **Aerodynamic Stability Markers**: Center of Gravity (CG) and Center of Pressure (CP) glyphs with caliber margin callout.
- **Subsystem Engineering Inspector**: Materials, axial coordinates, outer/inner diameter, wall thickness, itemized masses.
- **Mission Analysis & Verification**: NASA CEA thermochemistry, solid rocket motor curves (M1928), flight simulation trajectory, fin flutter safety margins, and launch rail exit velocities.

## Rocket Specifications
| Parameter | Value |
| --- | --- |
| Total Length | 2000 mm (2.00 m) |
| Outer Diameter | 102 mm |
| Wall Thickness | 3 mm |
| Inner Diameter | 96 mm |
| Fineness Ratio | 19.61:1 |
| Nose Cone | 550 mm (Carbon Fibre, Von Karman profile, 5.39:1) |
| Avionics Bay | 250 mm |
| Drogue Bay | 400 mm |
| Booster Section | 800 mm |
| Inner Motor Casing | 700 mm (M1928, 6061-T6 Aluminium) |
| Wet Mass | 13.32 kg |
| Dry Mass | 7.80 kg |
| Burnout Mass | 10.19 kg |

## Key Verification Results
| Parameter | OpenRocket | RASAero II | Engineering Delta |
| --- | --- | --- | --- |
| Apogee | 5,206 m | 4,493 m | -713 m (-13.7%) |
| Max Velocity | 531 m/s | 528.5 m/s | -2.5 m/s (-0.5%) |
| Max Mach | 1.58 | 1.55 | Transonic/Supersonic peak |
| Time to Apogee | 29.8 s | 27.5 s | -2.3 s |

- **Motor**: M1928, total impulse 7,926 N·s, average thrust 1,943 N, burn time 4.08 s
- **Static Stability Margin**: +2.38 calibers (CG: 1290 mm, CP: 1530 mm from nose tip)
- **Fin Flutter Velocity**: 1,428 m/s (2.69x safety factor)
- **Rail Exit Velocity**: 27.4 m/s on a 6 m rail (Minimum required threshold: 15.0 m/s)

## Tools & Tech Stack
NASA CEA, OpenMotor, OpenRocket, RASAero II, React 19, TypeScript, Three.js, MediaPipe Hands, Vite 6, Tailwind CSS

## Run Locally
```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build static production bundle
npm run build
```
