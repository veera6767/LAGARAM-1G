# LAGARAM ROCKET - 1G

Interactive 3D engineering inspector for **LAGARAM-1**, a high-power single-stage solid-propellant sounding rocket designed for atmospheric and meteorological research.

🔗 **Live website:** https://veera6767.github.io/LAGARAM-1G/

## About the Project
An interactive aerospace 3D engineering inspector and flight verification interface. Inspect alloy metallurgy, hollow cylindrical wall dimensions, axial stage layout, propulsion thermochemistry, and flight dynamics.

## Features
- **Interactive 3D Model**: Drag to orbit, scroll to zoom, click any section to inspect engineering specs.
- **Fullscreen Mode with Edge Tabs**:
  - Fullscreen toggle button with dynamic expand/collapse icons and labels (`Fullscreen` / `Exit Fullscreen`).
  - Seamless Fullscreen API integration with fallback for non-supporting browsers/devices.
  - In fullscreen, side panels slide out of the way to grant 100% unobstructed screen real estate to the 3D viewport, while keeping the top HUD slim and the bottom control bar accessible.
  - Interactive left and right edge tabs allow bringing back the **Rocket Structure** hierarchy and **Subsystem Inspector** on demand in floating slide-out drawers.
  - Quick toggle via keyboard shortcut `F` and exit via `Esc`.
  - Responsive WebGL renderer, aspect ratio, and pixel ratio resize without blurring or model stretching.
- **Wider Zoom-Out Range & Zoom Controls**:
  - Extended orbit control range scaling dynamically with stage separation (up to distance 60) so the entire rocket at 100% explosion fits comfortably within view from any orientation.
  - Scene fog density adjusted and camera far clipping plane extended to 350 so background stars, rings, and ground grids remain crisp and visible.
  - Dedicated **Zoom In** and **Zoom Out** icon buttons next to the camera presets, with intuitive keyboard shortcuts (`+`/`=` and `-`/`_`).
- **Auto-Fit Camera & Exploded View Framing**:
  - Dedicated **"Fit"** camera preset button (hotkey: `0` or `9`) that calculates the live bounding box of all visible components and frames the vehicle comfortably with vertical and horizontal clearance.
  - Full Stack preset dynamically utilizes the live bounding box calculation at any separation level.
  - Smooth auto-dolly when clicking "Exploded View": smoothly steps camera back as parts separate so no part of the stack is clipped, and gracefully restores previous camera framing when collapsed (without overriding user manual camera orbit adjustments).
- **Smartphone Telemetry Payload & Secure Mounting Hardware**:
  - Independent 3D telemetry smartphone inside the Avionics Bay beside the Flight Computer PCB, running the SmartPhone Telemetry app.
  - Logs accelerometer, gyroscope, magnetometer, and GNSS data at 100 Hz to a local file as an onboard backup, and transmits a thinned live copy over the internet during ground tests.
  - High-resolution emissive screen display reading **"PHONE TELEMETRY"** with a pulsing cyan indicator dot and multi-axis waveform sensor trace graphics.
  - Precision aerospace retention hardware stack: mounting tray with pocketed lips to prevent lateral sliding, vibration-damping foam pad, hold-down clamp straps leaving the display visible, and fastener screws with standoffs.
  - Exploded View Kinematics: slides axially out of the avionics tube and translates radially opposite to the Flight Computer PCB, tilting 15–25° toward the camera with an internal exploded hardware stack, screw leader lines, sled leader line, and floating HUD label.
- **Dedicated Phone Camera Preset**: One-click **"Phone"** camera preset (hotkey: `8`) next to the PCB preset that animates directly to a close, readable view of the smartphone telemetry assembly (automatically running the explosion if collapsed).
- **Hand-Only Webcam Gesture Control**:
  - 🖐️ **Open Hand**: Move horizontally to continuously rotate the view; move closer/farther to zoom in/out with apparent hand depth (fully functional in fullscreen).
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
