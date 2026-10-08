import React from 'react';
import {
  RotateCcw,
  Play,
  Pause,
  Box,
  Sliders,
  Camera,
  Maximize2,
  Anchor,
  Flame,
  Radio,
  Wind,
  Layers,
  BarChart2,
  Hand,
  AlertTriangle,
  X,
  Cpu,
} from 'lucide-react';
import { CameraPreset } from '../types';

interface ControlBarProps {
  isExploded: boolean;
  explodeProgress: number;
  onToggleExplode: () => void;
  onExplodeProgressChange: (val: number) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onResetCamera: () => void;
  onSelectPreset: (preset: CameraPreset) => void;
  wireframe: boolean;
  onToggleWireframe: () => void;
  showStabilityMarkers: boolean;
  onToggleStabilityMarkers: () => void;
  finDetailScale?: boolean;
  onToggleFinDetailScale?: () => void;
  onOpenMissionAnalysis?: () => void;
  isGestureControlActive?: boolean;
  onToggleGestureControl?: () => void;
  gestureError?: string | null;
  onDismissGestureError?: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isExploded,
  explodeProgress,
  onToggleExplode,
  onExplodeProgressChange,
  autoRotate,
  onToggleAutoRotate,
  onResetCamera,
  onSelectPreset,
  wireframe,
  onToggleWireframe,
  showStabilityMarkers,
  onToggleStabilityMarkers,
  finDetailScale = false,
  onToggleFinDetailScale,
  onOpenMissionAnalysis,
  isGestureControlActive = false,
  onToggleGestureControl,
  gestureError,
  onDismissGestureError,
}) => {
  return (
    <div className="pointer-events-auto flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-[#05070d]/85 backdrop-blur-xl border border-cyan-500/25 rounded-xl shadow-[0_0_25px_rgba(0,229,255,0.06),0_15px_30px_rgba(0,0,0,0.85)] relative">
      {/* Decorative corner ticks */}
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400/60 pointer-events-none rounded-tl-sm" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400/60 pointer-events-none rounded-tr-sm" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400/60 pointer-events-none rounded-bl-sm" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400/60 pointer-events-none rounded-br-sm" />

      {/* Primary Actions: Exploded View & Scrub Slider */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <button
          type="button"
          onClick={onToggleExplode}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-orbitron text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer ${
            isExploded
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-[0_0_22px_rgba(0,229,255,0.7)] border border-cyan-200'
              : 'bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-200 border border-cyan-500/30 hover:border-cyan-400/60 shadow-[0_0_10px_rgba(0,229,255,0.1)]'
          }`}
        >
          <Box className={`w-4 h-4 ${isExploded ? 'text-black' : 'text-[#00E5FF]'}`} />
          <span>{isExploded ? 'COLLAPSE MODEL' : 'EXPLODED VIEW'}</span>
        </button>

        {/* Explosion slider with custom HUD styling */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-black/60 border border-cyan-500/20 text-xs font-tech">
          <span className="text-[10px] text-cyan-400/70 tracking-widest uppercase">Separation</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={explodeProgress}
            onChange={(e) => onExplodeProgressChange(parseFloat(e.target.value))}
            className="hud-slider w-24 md:w-32 cursor-pointer"
          />
          <span className="text-xs text-[#00E5FF] font-bold font-tech w-9 text-right glow-cyan-text">
            {Math.round(explodeProgress * 100)}%
          </span>
        </div>
      </div>

      {/* Camera Presets Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto py-1">
        <span className="text-[10px] font-tech tracking-wider uppercase text-cyan-400/60 px-1 hidden lg:inline">Camera:</span>
        <button
          type="button"
          onClick={() => onSelectPreset('hero')}
          title="Hero 3/4 Perspective"
          className="px-2.5 py-1.5 rounded bg-black/40 hover:bg-cyan-950/30 text-slate-300 hover:text-[#00E5FF] text-xs font-tech border border-cyan-500/15 hover:border-cyan-400/40 transition-all cursor-pointer"
        >
          Iso 45°
        </button>
        <button
          type="button"
          onClick={() => onSelectPreset('full')}
          title="Full Rocket Profile"
          className="px-2.5 py-1.5 rounded bg-black/40 hover:bg-cyan-950/30 text-slate-300 hover:text-[#00E5FF] text-xs font-tech border border-cyan-500/15 hover:border-cyan-400/40 transition-all cursor-pointer"
        >
          Full Stack
        </button>
        <button
          type="button"
          onClick={() => onSelectPreset('fins')}
          title="Zoom to tail (booster aft section & stabilizing fins)"
          className="px-2.5 py-1.5 rounded bg-black/40 hover:bg-cyan-950/30 text-slate-300 hover:text-[#8DB8A0] text-xs font-tech border border-cyan-500/15 hover:border-[#8DB8A0]/50 transition-all flex items-center gap-1 cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-[#8DB8A0] shadow-[0_0_6px_#8DB8A0]" />
          <span>Fins</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectPreset('engine')}
          title="Engine / Motor Assembly & Nozzle"
          className="px-2.5 py-1.5 rounded bg-black/40 hover:bg-cyan-950/30 text-slate-300 hover:text-[#FF5A1F] text-xs font-tech border border-cyan-500/15 hover:border-amber-500/40 transition-all flex items-center gap-1 cursor-pointer"
        >
          <Flame className="w-3 h-3 text-[#FF5A1F]" />
          <span>Engine</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectPreset('payload')}
          title="Avionics & Payload Bay"
          className="px-2.5 py-1.5 rounded bg-black/40 hover:bg-cyan-950/30 text-slate-300 hover:text-[#00E5FF] text-xs font-tech border border-cyan-500/15 hover:border-cyan-400/40 transition-all flex items-center gap-1 cursor-pointer"
        >
          <Radio className="w-3 h-3 text-[#00E5FF]" />
          <span>Avionics</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectPreset('pcb')}
          title="Flight Computer PCB (framed closely)"
          className="px-2.5 py-1.5 rounded bg-black/40 hover:bg-cyan-950/30 text-slate-300 hover:text-cyan-300 text-xs font-tech border border-cyan-500/15 hover:border-cyan-400/40 transition-all flex items-center gap-1 cursor-pointer"
        >
          <Cpu className="w-3 h-3 text-cyan-300" />
          <span>PCB</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectPreset('nose')}
          title="Aerodynamic Nose Cone"
          className="px-2.5 py-1.5 rounded bg-black/40 hover:bg-cyan-950/30 text-slate-300 hover:text-[#00E5FF] text-xs font-tech border border-cyan-500/15 hover:border-cyan-400/40 transition-all flex items-center gap-1 cursor-pointer"
        >
          <Wind className="w-3 h-3 text-slate-300" />
          <span>Nose</span>
        </button>
      </div>

      {/* Secondary Controls: Auto-Rotate, Reset, Wireframe, Fin Detail, CG/CP */}
      <div className="flex items-center gap-1.5 w-full md:w-auto justify-end font-tech">
        {/* Stability Markers Toggle */}
        <button
          type="button"
          onClick={onToggleStabilityMarkers}
          title="Toggle Center of Gravity & Center of Pressure markers"
          className={`p-2 rounded-lg text-xs border transition-all flex items-center gap-1 cursor-pointer ${
            showStabilityMarkers
              ? 'bg-cyan-500/20 border-cyan-400 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)]'
              : 'bg-black/40 hover:bg-cyan-950/30 border-cyan-500/20 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Anchor className="w-4 h-4" />
          <span className="hidden sm:inline text-[11px] tracking-wider">CG / CP</span>
        </button>

        {/* Wireframe Toggle */}
        <button
          type="button"
          onClick={onToggleWireframe}
          title="Toggle Wireframe CAD Mesh"
          className={`p-2 rounded-lg text-xs border transition-all flex items-center gap-1 cursor-pointer ${
            wireframe
              ? 'bg-amber-500/20 border-amber-400 text-[#FF5A1F] shadow-[0_0_15px_rgba(255,90,31,0.4)]'
              : 'bg-black/40 hover:bg-cyan-950/30 border-cyan-500/20 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="hidden sm:inline text-[11px] tracking-wider">Wireframe</span>
        </button>

        {/* Fin Detail x1.5 Toggle (Next to Wireframe, OFF by default) */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={onToggleFinDetailScale}
            title="Toggle Fin Detail visual 1.5x span magnification (Visual only, real span 85 mm)"
            className={`p-2 rounded-lg text-xs border transition-all flex items-center gap-1 cursor-pointer ${
              finDetailScale
                ? 'bg-emerald-500/25 border-emerald-400 text-[#8DB8A0] shadow-[0_0_15px_rgba(141,184,160,0.5)]'
                : 'bg-black/40 hover:bg-cyan-950/30 border-cyan-500/20 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Maximize2 className="w-4 h-4 text-[#8DB8A0]" />
            <span className="hidden sm:inline text-[11px] tracking-wider font-bold">Fin Detail x1.5</span>
          </button>
          {finDetailScale && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-emerald-950/95 border border-emerald-400/70 text-[10px] text-emerald-200 font-tech pointer-events-none shadow-[0_0_12px_rgba(141,184,160,0.4)]">
              Visual scale only, real span 85 mm
            </div>
          )}
        </div>

        {/* Gesture Control Toggle */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={onToggleGestureControl}
            title="Toggle Webcam Hand-Only Gesture Control (Rotate, Zoom, Explode, Collapse)"
            className={`p-2 rounded-lg text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
              isGestureControlActive
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : 'bg-black/40 hover:bg-cyan-950/30 border-cyan-500/20 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hand className={`w-4 h-4 ${isGestureControlActive ? 'text-emerald-300' : 'text-slate-400'}`} />
            <span className="hidden sm:inline text-[11px] tracking-wider font-bold">Gesture</span>
            {isGestureControlActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
            )}
          </button>

          {/* Inline HUD Error Tooltip */}
          {gestureError && (
            <div className="absolute -top-10 right-0 whitespace-nowrap px-3 py-1 rounded-lg bg-red-950/95 border border-red-500/60 text-[10px] text-red-200 font-tech shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center gap-1.5 animate-fadeIn z-50">
              <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
              <span>{gestureError}</span>
              {onDismissGestureError && (
                <button
                  type="button"
                  onClick={onDismissGestureError}
                  className="ml-1 p-0.5 hover:text-white rounded cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Auto Rotate Toggle */}
        <button
          type="button"
          onClick={onToggleAutoRotate}
          title={autoRotate ? 'Pause auto-rotation' : 'Start auto-rotation'}
          className={`p-2 rounded-lg text-xs border transition-all flex items-center gap-1 cursor-pointer ${
            autoRotate
              ? 'bg-cyan-500/25 border-cyan-300 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)]'
              : 'bg-black/40 hover:bg-cyan-950/30 border-cyan-500/20 text-slate-400 hover:text-slate-200'
          }`}
        >
          {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="hidden sm:inline text-[11px] tracking-wider">Spin</span>
        </button>

        {/* Reset Camera Button */}
        <button
          type="button"
          onClick={onResetCamera}
          title="Reset Camera to default position"
          className="p-2 rounded-lg text-xs bg-black/40 hover:bg-cyan-950/30 border border-cyan-500/20 hover:border-cyan-400/40 text-slate-300 hover:text-[#00E5FF] transition-all flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline text-[11px] tracking-wider">Reset</span>
        </button>

        {/* Mission Analysis Button */}
        {onOpenMissionAnalysis && (
          <button
            type="button"
            onClick={onOpenMissionAnalysis}
            title="Open Mission Analysis (NASA CEA, OpenMotor, RASAero II)"
            className="p-2 rounded-lg text-xs bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-400/40 hover:border-cyan-300 text-cyan-200 hover:text-white transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(0,229,255,0.2)]"
          >
            <BarChart2 className="w-4 h-4 text-[#00E5FF]" />
            <span className="hidden md:inline text-[11px] font-bold tracking-wider">Analysis</span>
          </button>
        )}
      </div>
    </div>
  );
};
