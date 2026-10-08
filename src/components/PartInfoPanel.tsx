import React, { useState } from 'react';
import {
  X,
  Info,
  Shield,
  Wrench,
  CheckCircle2,
  ChevronRight,
  Gauge,
  Layers,
  Activity,
  Scale,
  BarChart2,
  Flame,
  Check,
} from 'lucide-react';
import {
  ROCKET_PARTS,
  ROCKET_SPEC,
  VEHICLE_TOTALS,
  MASS_BREAKDOWN,
} from '../data/rocketParts';
import { RocketPartInfo, CameraPreset } from '../types';

interface PartInfoPanelProps {
  selectedPartId: string | null;
  onClose: () => void;
  onFocusCameraPreset: (preset: CameraPreset) => void;
  onOpenMissionAnalysis?: () => void;
}

export const PartInfoPanel: React.FC<PartInfoPanelProps> = ({
  selectedPartId,
  onClose,
  onFocusCameraPreset,
  onOpenMissionAnalysis,
}) => {
  const [showMassTable, setShowMassTable] = useState(false);

  const selectedPart = ROCKET_PARTS.find((p) => p.id === selectedPartId);

  const getCameraPresetForPart = (id: string): CameraPreset => {
    switch (id) {
      case 'flight-computer-pcb':
        return 'pcb';
      case 'inner-motor':
      case 'booster-section':
        return 'engine';
      case 'fins':
        return 'fins';
      case 'drogue-bay':
        return 'recovery';
      case 'avionics-bay':
        return 'payload';
      case 'nose-cone':
        return 'nose';
      default:
        return 'hero';
    }
  };

  // =========================================================================
  // DEFAULT VEHICLE SUMMARY VIEW (When no specific part is clicked)
  // =========================================================================
  if (!selectedPart) {
    return (
      <div className="pointer-events-auto w-full md:w-96 bg-[#05070d]/85 backdrop-blur-xl border border-cyan-500/25 rounded-xl shadow-[0_0_25px_rgba(0,229,255,0.06),0_15px_30px_rgba(0,0,0,0.85)] p-4 flex flex-col gap-3 relative max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
        {/* Decorative corner ticks */}
        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400/60 pointer-events-none rounded-tl-sm" />
        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400/60 pointer-events-none rounded-tr-sm" />
        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400/60 pointer-events-none rounded-bl-sm" />
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400/60 pointer-events-none rounded-br-sm" />

        <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#00E5FF] drop-shadow-[0_0_4px_#00E5FF]" />
            <h3 className="font-orbitron font-bold text-sm tracking-wider text-slate-100 uppercase glow-cyan-text">
              Subsystem Inspector
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          Click any 3D section or select from the Rocket Structure panel to inspect alloy metallurgy, axial coordinates, hollow wall dimensions, and structural verification data.
        </p>

        {/* Confirmed Dimensions & Computed Masses (Single Source of Truth) */}
        <div className="grid grid-cols-2 gap-2 text-xs font-tech">
          <div className="p-2.5 rounded-lg bg-black/50 border border-cyan-500/15 hover:border-cyan-400/30 transition-colors">
            <span className="text-[10px] text-slate-400 block mb-0.5 tracking-wider uppercase">Total Rocket Length</span>
            <span className="font-bold text-slate-100">{ROCKET_SPEC.airframe.totalLengthMm} mm ({ROCKET_SPEC.airframe.totalLengthM.toFixed(2)} m)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-black/50 border border-cyan-500/15 hover:border-cyan-400/30 transition-colors">
            <span className="text-[10px] text-slate-400 block mb-0.5 tracking-wider uppercase">Airframe OD / ID</span>
            <span className="font-bold text-slate-100">
              {ROCKET_SPEC.airframe.outerDiameterMm} / {ROCKET_SPEC.airframe.innerDiameterMm} mm <span className="text-[10px] text-cyan-400 font-normal">({ROCKET_SPEC.airframe.wallThicknessMm}mm)</span>
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-black/50 border border-cyan-500/15 hover:border-cyan-400/30 transition-colors">
            <span className="text-[10px] text-slate-400 block mb-0.5 tracking-wider uppercase">Mass (Without Motor)</span>
            <span className="font-bold text-slate-100">{VEHICLE_TOTALS.dryMassKg.toFixed(2)} kg</span>
          </div>
          <div className="p-2.5 rounded-lg bg-black/50 border border-cyan-500/15 hover:border-cyan-400/30 transition-colors">
            <span className="text-[10px] text-slate-400 block mb-0.5 tracking-wider uppercase">Total Wet Mass</span>
            <span className="font-bold text-[#00E5FF] glow-cyan-text">{VEHICLE_TOTALS.wetMassKg.toFixed(2)} kg</span>
          </div>
        </div>

        {/* Toggle Mass Breakdown Table Button */}
        <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-500/15 text-xs font-tech">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-300 font-bold flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#00E5FF]" />
              Mass Breakdown ({MASS_BREAKDOWN.length} Items)
            </span>
            <button
              type="button"
              onClick={() => setShowMassTable(!showMassTable)}
              className="text-[10px] text-cyan-300 hover:text-white px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 cursor-pointer transition-all"
            >
              {showMassTable ? 'Hide Table' : 'Show Table'}
            </button>
          </div>

          {showMassTable && (
            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto custom-scrollbar pt-1 border-t border-cyan-500/15 text-[11px]">
              {MASS_BREAKDOWN.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-slate-300">{item.item}</span>
                  <span className="font-bold text-cyan-200">{item.massKg.toFixed(2)} kg</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1.5 text-xs font-bold text-[#00E5FF]">
                <span>Summed Total</span>
                <span>{VEHICLE_TOTALS.wetMassKg.toFixed(2)} kg</span>
              </div>
            </div>
          )}
        </div>

        {/* Flight Simulation Comparison Card (OpenRocket vs RASAero II) */}
        <div className="p-3 rounded-lg bg-black/50 border border-cyan-500/20 text-xs space-y-2 relative">
          <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/15">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#00E5FF] drop-shadow-[0_0_4px_#00E5FF]" />
              <span className="font-orbitron font-bold text-[11px] tracking-wider text-slate-100 uppercase glow-cyan-text">
                Flight Simulation Comparison
              </span>
            </div>
          </div>

          <div className="space-y-1 font-tech">
            <div className="grid grid-cols-3 gap-1 p-1 bg-black/60 rounded text-[10px] text-slate-400 border border-cyan-500/10 font-bold">
              <span>Metric</span>
              <span className="text-cyan-300">OpenRocket</span>
              <span className="text-emerald-300">RASAero II</span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 rounded bg-black/30 border border-cyan-500/10">
              <span className="text-slate-400">Apogee</span>
              <span className="font-bold text-cyan-200">5,206 m</span>
              <span className="font-bold text-emerald-300">4,493 m</span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 rounded bg-black/30 border border-cyan-500/10">
              <span className="text-slate-400">Max Velocity</span>
              <span className="font-bold text-cyan-200">531 m/s</span>
              <span className="font-bold text-emerald-300">528.5 m/s</span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 rounded bg-black/30 border border-cyan-500/10">
              <span className="text-slate-400">Max Mach</span>
              <span className="font-bold text-cyan-200">Mach 1.58</span>
              <span className="font-bold text-emerald-300">Mach 1.55</span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 rounded bg-black/30 border border-cyan-500/10">
              <span className="text-slate-400">Time to Apogee</span>
              <span className="font-bold text-cyan-200">29.8 s</span>
              <span className="font-bold text-emerald-300">27.5 s</span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 rounded bg-black/30 border border-cyan-500/10">
              <span className="text-slate-400">Max Accel.</span>
              <span className="font-bold text-cyan-200">232 m/s² (OR)</span>
              <span className="text-slate-500">N/A</span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 rounded bg-black/30 border border-cyan-500/10">
              <span className="text-slate-400">Peak Drag</span>
              <span className="text-slate-500">N/A</span>
              <span className="font-bold text-emerald-300">~280 lb</span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 rounded bg-black/30 border border-cyan-500/10">
              <span className="text-slate-400">Peak CD</span>
              <span className="text-slate-500">N/A</span>
              <span className="font-bold text-emerald-300">~1.08</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic pt-1 border-t border-cyan-500/10 font-sans leading-relaxed">
            Note: OpenRocket is not accurate above Mach 1; RASAero II used for better drag/stability prediction.
          </p>
        </div>

        {/* CG & CP Engineering Metrics */}
        <div className="p-2.5 rounded-lg bg-black/50 border border-cyan-500/15 text-xs font-tech space-y-1.5">
          <div className="flex items-center justify-between pb-1 border-b border-cyan-500/15">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Aero Stability (From Nose)</span>
            <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" />
              Target Band 2.0–2.5 cal
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#FFB300] shadow-[0_0_6px_#FFB300]" />
              CG:
            </span>
            <span className="font-bold text-[#FFB300]">{ROCKET_SPEC.stability.cgMmFromNose} mm from nose</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF]" />
              CP:
            </span>
            <span className="font-bold text-[#00E5FF]">{ROCKET_SPEC.stability.cpMmFromNose} mm from nose</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-cyan-500/15">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Stability Margin:</span>
            <span className="font-bold text-slate-200">
              +{ROCKET_SPEC.stability.marginCalibersOpenRocket} cal (OpenRocket) / ~{ROCKET_SPEC.stability.marginCalibersHandCalc} cal (Hand calc)
            </span>
          </div>
        </div>

        {/* Quick Button to Launch Mission Analysis Modal */}
        {onOpenMissionAnalysis && (
          <button
            type="button"
            onClick={onOpenMissionAnalysis}
            className="w-full py-2.5 px-3 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-400/50 hover:border-cyan-300 text-cyan-200 hover:text-white text-xs font-orbitron font-bold tracking-wider shadow-[0_0_15px_rgba(0,229,255,0.2)] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <BarChart2 className="w-4 h-4 text-[#00E5FF]" />
            <span>OPEN FULL MISSION ANALYSIS (PPT)</span>
          </button>
        )}
      </div>
    );
  }

  // =========================================================================
  // SELECTED PART VIEW (Specific Rocket Section Inspection)
  // =========================================================================
  const isNoseCone = selectedPart.id === 'nose-cone';
  const isMotor = selectedPart.id === 'inner-motor';
  const isFins = selectedPart.id === 'fins';
  const isPcb = selectedPart.id === 'flight-computer-pcb';

  return (
    <div className="pointer-events-auto w-full md:w-96 bg-[#05070d]/85 backdrop-blur-xl border border-cyan-500/25 rounded-xl shadow-[0_0_25px_rgba(0,229,255,0.06),0_15px_30px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[calc(100vh-140px)] animate-fadeIn relative">
      {/* Decorative corner ticks */}
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400/60 pointer-events-none rounded-tl-sm" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400/60 pointer-events-none rounded-tr-sm" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400/60 pointer-events-none rounded-bl-sm" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400/60 pointer-events-none rounded-br-sm" />

      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20 bg-black/40 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-1.5 py-0.5 text-[9px] font-tech font-bold rounded bg-cyan-500/15 text-[#00E5FF] border border-cyan-400/30 uppercase tracking-wider">
              {isPcb ? 'AVIONICS SUBSYSTEM' : `SECTION 0${selectedPart.order} OF 06`}
            </span>
            <span className="text-[10px] font-tech text-slate-400">
              ID: {selectedPart.id}
            </span>
          </div>
          <h3 className="font-orbitron font-bold text-lg tracking-wide text-slate-100 glow-cyan-text">
            {selectedPart.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-tech text-cyan-300">
              {selectedPart.assembly}
            </span>
            {isPcb && (
              <span className="text-[9px] font-tech px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                STM32 MCU • 2-Layer
              </span>
            )}
            {isMotor && (
              <span className="text-[9px] font-tech px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                M1928 Motor
              </span>
            )}
            {isFins && (
              <span className="text-[9px] font-tech px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                G10 Composite
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/30 transition-all cursor-pointer"
          title="Close inspector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
        {/* Colour Swatch for Nose Cone */}
        {isNoseCone && (
          <div className="p-2.5 rounded-lg bg-black/50 border border-cyan-500/25 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="w-5 h-5 rounded-md border border-white/40 shadow-[0_0_8px_rgba(139,147,155,0.6)] inline-block"
                style={{ backgroundColor: '#8B939B' }}
              />
              <div>
                <span className="font-tech text-xs font-bold text-white block">Carbon Fibre Grey</span>
                <span className="text-[10px] font-tech text-slate-400">Hex #8B939B • Metalness 0.5 • Roughness 0.3</span>
              </div>
            </div>
            <span className="text-[9px] font-tech px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 uppercase">
              2x2 Twill Gloss
            </span>
          </div>
        )}

        {/* Colour Swatch for Stabilizing Fins */}
        {isFins && (
          <div className="p-2.5 rounded-lg bg-black/50 border border-[#8DB8A0]/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="w-5 h-5 rounded-md border border-white/40 shadow-[0_0_8px_rgba(141,184,160,0.6)] inline-block"
                style={{ backgroundColor: '#8DB8A0' }}
              />
              <div>
                <span className="font-tech text-xs font-bold text-white block">G10 Fibreglass Green</span>
                <span className="text-[10px] font-tech text-slate-400">Hex #8DB8A0 • Metalness 0.05 • Roughness 0.55</span>
              </div>
            </div>
            <span className="text-[9px] font-tech px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 uppercase">
              Matte G10 Finish
            </span>
          </div>
        )}

        {/* Description */}
        <div>
          <h4 className="text-[10px] font-tech text-cyan-400/80 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Info className="w-3 h-3 text-[#00E5FF]" />
            Engineering Description
          </h4>
          <p className="text-slate-200 leading-relaxed font-sans text-xs">
            {selectedPart.description}
          </p>
        </div>

        {/* Section Dimensions & Hollow Wall Metrics (Section 4 requirement) */}
        <div className="p-3 rounded-lg bg-black/50 border border-cyan-500/20 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] text-slate-400 font-tech uppercase tracking-wider">Axial Location:</span>
            <span className="text-[11px] font-tech font-bold text-cyan-300 text-right">
              {selectedPart.startMm} mm to {selectedPart.endMm} mm (from nose)
            </span>
          </div>
          <div className="h-px bg-cyan-500/15" />
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] text-slate-400 font-tech uppercase tracking-wider">Surface Finish:</span>
            <span className="text-[11px] font-tech font-medium text-slate-300 text-right">
              {selectedPart.finish}
            </span>
          </div>
          <div className="h-px bg-cyan-500/15" />
          
          {/* Detailed Dimension Grid */}
          <div className="grid grid-cols-4 gap-1.5 pt-1 text-center font-tech">
            <div className="p-1.5 bg-black/40 rounded border border-cyan-500/10">
              <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Length</span>
              <span className="text-xs font-bold text-slate-100">{selectedPart.lengthMm} mm</span>
            </div>
            <div className="p-1.5 bg-black/40 rounded border border-cyan-500/10">
              <span className="text-[9px] text-slate-400 block uppercase tracking-wider">{isPcb ? 'Width' : 'Outer Dia'}</span>
              <span className="text-xs font-bold text-slate-100">{isPcb ? `${selectedPart.widthMm} mm` : `${selectedPart.outerDiameterMm} mm`}</span>
            </div>
            <div className="p-1.5 bg-black/40 rounded border border-cyan-500/10">
              <span className="text-[9px] text-slate-400 block uppercase tracking-wider">{isPcb ? 'Thickness' : 'Inner Dia'}</span>
              <span className="text-xs font-bold text-slate-100">{isPcb ? `${selectedPart.thicknessMm} mm` : `${selectedPart.innerDiameterMm} mm`}</span>
            </div>
            <div className="p-1.5 bg-black/40 rounded border border-cyan-500/10">
              <span className="text-[9px] text-slate-400 block uppercase tracking-wider">{isPcb ? 'Layers' : 'Wall'}</span>
              <span className="text-xs font-bold text-cyan-300">{isPcb ? '2-Layer' : `${selectedPart.wallThicknessMm} mm`}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-center font-tech">
            <div className="p-1.5 bg-black/40 rounded border border-cyan-500/10">
              <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Assembly Mass</span>
              <span className="text-xs font-bold text-[#00E5FF]">
                {isPcb ? 'Part of 2.30 kg Payload' : `${selectedPart.massKg.toFixed(2)} kg`}
              </span>
            </div>
            <div className="p-1.5 bg-black/40 rounded border border-cyan-500/10">
              <span className="text-[9px] text-slate-400 block uppercase tracking-wider">
                {isNoseCone ? 'Fineness Ratio' : isPcb ? 'Aspect Ratio' : 'Material Class'}
              </span>
              <span className="text-xs font-bold text-slate-100">
                {isNoseCone ? selectedPart.finenessRatio : isPcb ? '~3 : 2' : selectedPart.material.split('/')[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Specifications Table */}
        <div>
          <h4 className="text-[10px] font-tech text-cyan-400/80 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-[#00E5FF]" />
            Operating Specifications
          </h4>
          <div className="grid grid-cols-2 gap-2 font-tech">
            {selectedPart.specs.map((spec, i) => (
              <div key={i} className="p-2 rounded bg-black/40 border border-cyan-500/15 hover:border-cyan-400/30 transition-colors">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider">{spec.label}</span>
                <span className="text-[11px] font-bold text-slate-100">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-Components Breakdown */}
        {selectedPart.subParts && selectedPart.subParts.length > 0 && (
          <div>
            <h4 className="text-[10px] font-tech text-cyan-400/80 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#00E5FF]" />
              Internal Sub-Components
            </h4>
            <div className="space-y-1 font-tech">
              {selectedPart.subParts.map((sub, idx) => (
                <div key={idx} className="p-2 rounded bg-black/40 border border-cyan-500/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-200 font-bold block">{sub.name}</span>
                    {sub.note && <span className="text-[10px] text-slate-400">{sub.note}</span>}
                  </div>
                  {sub.massKg !== undefined ? (
                    <span className="text-cyan-300 font-bold">{sub.massKg.toFixed(2)} kg</span>
                  ) : (
                    <span className="text-slate-500 text-[10px]">Included</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Highlights */}
        <div>
          <h4 className="text-[10px] font-tech text-cyan-400/80 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Wrench className="w-3 h-3 text-cyan-400" />
            Engineering Details & Verification
          </h4>
          <ul className="space-y-1.5">
            {selectedPart.technicalDetails.map((detail, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-300 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00E5FF] shrink-0 mt-0.5" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button: Center Camera */}
        <button
          type="button"
          onClick={() => onFocusCameraPreset(getCameraPresetForPart(selectedPart.id))}
          className="w-full py-2.5 px-3 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 hover:border-cyan-400/60 text-cyan-200 hover:text-white text-xs font-tech font-bold tracking-wider shadow-[0_0_12px_rgba(0,229,255,0.15)] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Focus Camera on {selectedPart.name}</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#00E5FF]" />
        </button>
      </div>
    </div>
  );
};
