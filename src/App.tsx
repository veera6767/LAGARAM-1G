import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RocketCanvas } from './components/RocketCanvas';
import { HudHeader } from './components/HudHeader';
import { PartsList } from './components/PartsList';
import { PartInfoPanel } from './components/PartInfoPanel';
import { ControlBar } from './components/ControlBar';
import { MissionAnalysisModal } from './components/MissionAnalysisModal';
import { GestureManager } from './components/GestureControl/GestureManager';
import { CameraPreset } from './types';
import { GestureCameraInput } from './types/gesture';
import { ROCKET_PARTS } from './data/rocketParts';
import { MousePointer, ChevronLeft, ChevronRight, Layers, Sliders, X } from 'lucide-react';

const getPresetForPart = (id: string): CameraPreset => {
  switch (id) {
    case 'flight-computer-pcb':
      return 'pcb';
    case 'smartphone-telemetry':
      return 'phone';
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

export default function App() {
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [explodeProgress, setExplodeProgress] = useState<number>(0.0);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [showStabilityMarkers, setShowStabilityMarkers] = useState<boolean>(false);
  const [finDetailScale, setFinDetailScale] = useState<boolean>(false);
  const [cameraPresetTrigger, setCameraPresetTrigger] = useState<{ preset: CameraPreset; id: number } | null>(null);
  const [resetCameraTrigger, setResetCameraTrigger] = useState<number>(0);
  const [isMissionAnalysisOpen, setIsMissionAnalysisOpen] = useState<boolean>(false);
  const [partVisibility, setPartVisibility] = useState<Record<string, boolean>>({});

  // Fullscreen and Edge Tab State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showLeftInFullscreen, setShowLeftInFullscreen] = useState<boolean>(false);
  const [showRightInFullscreen, setShowRightInFullscreen] = useState<boolean>(false);

  // Zoom & Auto-Fit Triggers
  const [zoomTrigger, setZoomTrigger] = useState<{ type: 'in' | 'out'; id: number } | null>(null);
  const [autoFitOnExplodeTrigger, setAutoFitOnExplodeTrigger] = useState<number>(0);
  const [collapseRestoreTrigger, setCollapseRestoreTrigger] = useState<number>(0);

  const handleTogglePartVisibility = useCallback((partId: string) => {
    setPartVisibility((prev) => ({
      ...prev,
      [partId]: prev[partId] === false ? true : false,
    }));
  }, []);

  // Gesture Control State
  const [isGestureControlActive, setIsGestureControlActive] = useState<boolean>(false);
  const [gestureError, setGestureError] = useState<string | null>(null);
  const gestureInputRef = useRef<GestureCameraInput>({ rotateDeltaX: 0, zoomDelta: 0, active: false });

  // Active tab on mobile/compact screens ('parts' | 'info' | 'none')
  const [mobileTab, setMobileTab] = useState<'parts' | 'info' | 'none'>('none');

  const selectedPart = ROCKET_PARTS.find((p) => p.id === selectedPartId);

  // Handle Explode Toggle with auto-fit and restore
  const handleToggleExplode = useCallback(() => {
    setIsExploded((prev) => {
      const next = !prev;
      setExplodeProgress(next ? 1.0 : 0.0);
      if (next) {
        setAutoFitOnExplodeTrigger(Date.now());
      } else {
        setCollapseRestoreTrigger(Date.now());
      }
      return next;
    });
  }, []);

  // Handle Explode Slider change
  const handleExplodeProgressChange = useCallback((val: number) => {
    setExplodeProgress(val);
    setIsExploded(val > 0.05);
  }, []);

  // Handle Camera Presets
  const handleSelectPreset = useCallback((preset: CameraPreset) => {
    if (preset === 'phone') {
      if (explodeProgress < 0.8 || !isExploded) {
        setIsExploded(true);
        setExplodeProgress(1.0);
      }
    }
    setCameraPresetTrigger({ preset, id: Date.now() });
  }, [explodeProgress, isExploded]);

  // Handle Reset Camera
  const handleResetCamera = useCallback(() => {
    setResetCameraTrigger(Date.now());
  }, []);

  // Handle Zoom In / Out
  const handleZoomIn = useCallback(() => {
    setZoomTrigger({ type: 'in', id: Date.now() });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomTrigger({ type: 'out', id: Date.now() });
  }, []);

  // Fullscreen toggle handler using HTML5 Fullscreen API with vendor and fallback support
  const handleToggleFullscreen = useCallback(() => {
    const doc = document as unknown as {
      fullscreenElement?: Element | null;
      webkitFullscreenElement?: Element | null;
      exitFullscreen?: () => Promise<void>;
      webkitExitFullscreen?: () => void;
      documentElement: HTMLElement & {
        requestFullscreen?: () => Promise<void>;
        webkitRequestFullscreen?: () => void;
      };
    };

    const isCurrentlyFs = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);

    if (!isCurrentlyFs) {
      const docEl = doc.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {
          setIsFullscreen((prev) => !prev);
        });
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else {
        // Fallback for browsers/devices without Fullscreen API (e.g. mobile Safari)
        setIsFullscreen((prev) => !prev);
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else {
        setIsFullscreen(false);
      }
    }
  }, []);

  // Synchronize state with native fullscreen change events
  useEffect(() => {
    const onFsChange = () => {
      const doc = document as unknown as {
        fullscreenElement?: Element | null;
        webkitFullscreenElement?: Element | null;
      };
      const isFs = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
      setIsFullscreen(isFs);
      if (!isFs) {
        setShowLeftInFullscreen(false);
        setShowRightInFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  // Select part and automatically open info panel on small screens
  const handleSelectPart = useCallback((partId: string | null) => {
    setSelectedPartId(partId);
    if (partId && window.innerWidth < 768) {
      setMobileTab('info');
    }
    // If in fullscreen and part selected, open right inspector drawer automatically
    if (partId && isFullscreen) {
      setShowRightInFullscreen(true);
    }
  }, [isFullscreen]);

  // Handle Toggle Gesture Control
  const handleToggleGestureControl = useCallback(() => {
    setIsGestureControlActive((prev) => {
      const next = !prev;
      if (next) {
        setGestureError(null);
      }
      return next;
    });
  }, []);

  // Handle Gesture-driven explode change
  const handleGestureExplodeChange = useCallback((explode: boolean, progress: number) => {
    setIsExploded(explode);
    setExplodeProgress(progress);
    if (explode && progress >= 0.8) {
      setAutoFitOnExplodeTrigger(Date.now());
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleExplode();
      } else if (e.key === 'r' || e.key === 'R') {
        handleResetCamera();
      } else if (e.key === 'a' || e.key === 'A') {
        setAutoRotate((prev) => !prev);
      } else if (e.key === 'w' || e.key === 'W') {
        setWireframe((prev) => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        setShowStabilityMarkers((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMissionAnalysisOpen((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0' || e.key === '9') {
        handleSelectPreset('fit');
      } else if (e.key === '1') {
        handleSelectPreset('hero');
      } else if (e.key === '2') {
        handleSelectPreset('full');
      } else if (e.key === '3') {
        handleSelectPreset('engine');
      } else if (e.key === '4') {
        handleSelectPreset('payload');
      } else if (e.key === '5') {
        handleSelectPreset('nose');
      } else if (e.key === '6') {
        handleSelectPreset('fins');
      } else if (e.key === '7') {
        handleSelectPreset('pcb');
      } else if (e.key === '8') {
        handleSelectPreset('phone');
      } else if (e.key === 'Escape') {
        if (isMissionAnalysisOpen) {
          setIsMissionAnalysisOpen(false);
        } else if (isFullscreen) {
          handleToggleFullscreen();
        } else {
          setSelectedPartId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleToggleExplode,
    handleResetCamera,
    handleSelectPreset,
    handleToggleFullscreen,
    handleZoomIn,
    handleZoomOut,
    isMissionAnalysisOpen,
    isFullscreen,
  ]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050608] text-slate-100 font-sans select-none">
      {/* 3D Three.js Canvas Layer */}
      <RocketCanvas
        selectedPartId={selectedPartId}
        onSelectPart={handleSelectPart}
        isExploded={isExploded}
        explodeProgress={explodeProgress}
        onExplodeProgressChange={setExplodeProgress}
        autoRotate={autoRotate}
        wireframe={wireframe}
        showStabilityMarkers={showStabilityMarkers}
        finDetailScale={finDetailScale}
        cameraPresetTrigger={cameraPresetTrigger}
        resetCameraTrigger={resetCameraTrigger}
        gestureInputRef={gestureInputRef}
        partVisibility={partVisibility}
        zoomTrigger={zoomTrigger}
        autoFitOnExplodeTrigger={autoFitOnExplodeTrigger}
        collapseRestoreTrigger={collapseRestoreTrigger}
      />

      {/* Atmospheric Space Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-radial-[circle_at_center,transparent_45%,rgba(2,4,7,0.85)_100%]" />

      {/* Edge tabs for Fullscreen mode (allows bringing back panels on demand) */}
      {isFullscreen && (
        <>
          {/* Left Edge Tab: Rocket Structure */}
          <div className="fixed left-0 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
            <button
              type="button"
              onClick={() => setShowLeftInFullscreen((prev) => !prev)}
              title={showLeftInFullscreen ? 'Hide Rocket Structure' : 'Show Rocket Structure'}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-r-lg bg-[#05070d]/90 hover:bg-cyan-950/60 border-t border-r border-b border-cyan-500/40 text-cyan-300 hover:text-white font-tech text-xs backdrop-blur-md shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#00E5FF]" />
              <span className="hidden sm:inline font-bold">Structure</span>
              {showLeftInFullscreen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Left Drawer in Fullscreen */}
          {showLeftInFullscreen && (
            <div className="fixed left-3 top-16 bottom-24 z-40 w-80 max-w-[calc(100vw-2rem)] pointer-events-auto animate-fadeIn overflow-y-auto">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLeftInFullscreen(false)}
                  className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white rounded bg-black/50 border border-cyan-500/30 z-10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <PartsList
                  selectedPartId={selectedPartId}
                  onSelectPart={handleSelectPart}
                  onFocusPreset={(partId) => handleSelectPreset(getPresetForPart(partId))}
                  partVisibility={partVisibility}
                  onTogglePartVisibility={handleTogglePartVisibility}
                />
              </div>
            </div>
          )}

          {/* Right Edge Tab: Subsystem Inspector */}
          <div className="fixed right-0 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
            <button
              type="button"
              onClick={() => setShowRightInFullscreen((prev) => !prev)}
              title={showRightInFullscreen ? 'Hide Inspector' : 'Show Inspector'}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-l-lg bg-[#05070d]/90 hover:bg-cyan-950/60 border-t border-l border-b border-cyan-500/40 text-cyan-300 hover:text-white font-tech text-xs backdrop-blur-md shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all cursor-pointer"
            >
              {showRightInFullscreen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline font-bold">Inspector</span>
              <Sliders className="w-4 h-4 text-[#00E5FF]" />
            </button>
          </div>

          {/* Right Drawer in Fullscreen */}
          {showRightInFullscreen && (
            <div className="fixed right-3 top-16 bottom-24 z-40 w-96 max-w-[calc(100vw-2rem)] pointer-events-auto animate-fadeIn overflow-y-auto">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRightInFullscreen(false)}
                  className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white rounded bg-black/50 border border-cyan-500/30 z-10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <PartInfoPanel
                  selectedPartId={selectedPartId}
                  onClose={() => setSelectedPartId(null)}
                  onFocusCameraPreset={handleSelectPreset}
                  onOpenMissionAnalysis={() => setIsMissionAnalysisOpen(true)}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating UI HUD Layout */}
      <div className={`pointer-events-none absolute inset-0 flex flex-col justify-between ${isFullscreen ? 'p-2 md:p-3' : 'p-3 md:p-5'}`}>
        {/* Top Header HUD (Slimmer in fullscreen mode) */}
        <HudHeader
          exploded={isExploded}
          selectedPartName={selectedPart ? selectedPart.name : null}
          onOpenMissionAnalysis={() => setIsMissionAnalysisOpen(true)}
        />

        {/* Center Lateral Floating Panels (Desktop & Tablet) - hidden in fullscreen to maximize 3D area */}
        {!isFullscreen && (
          <div className="pointer-events-none flex-1 flex justify-between items-start my-2 gap-4 min-h-0 overflow-hidden">
            {/* Left Panel: Parts Stack Hierarchy */}
            <div className="hidden md:block pointer-events-auto shrink-0 max-h-full">
              <PartsList
                selectedPartId={selectedPartId}
                onSelectPart={handleSelectPart}
                onFocusPreset={(partId) => handleSelectPreset(getPresetForPart(partId))}
                partVisibility={partVisibility}
                onTogglePartVisibility={handleTogglePartVisibility}
              />
            </div>

            {/* Interaction Instruction Pill (Desktop center top) */}
            <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/25 text-[11px] font-tech text-slate-300 shadow-[0_0_15px_rgba(0,229,255,0.1)] mx-auto">
              <span className="flex items-center gap-1.5 text-cyan-200">
                <MousePointer className="w-3.5 h-3.5 text-[#00E5FF] drop-shadow-[0_0_4px_#00E5FF]" />
                Drag to Orbit
              </span>
              <span className="text-cyan-500/40">•</span>
              <span>Scroll or [+/-] to Zoom</span>
              <span className="text-cyan-500/40">•</span>
              <span className="text-[#00E5FF] glow-cyan-text">Click Section to Inspect</span>
              <span className="text-cyan-500/40">•</span>
              <button
                type="button"
                onClick={() => setIsMissionAnalysisOpen(true)}
                className="text-amber-300 hover:text-white underline cursor-pointer pointer-events-auto"
              >
                [M] Mission Analysis
              </button>
            </div>

            {/* Right Panel: Subsystem Engineering Inspector */}
            <div className="hidden md:block pointer-events-auto shrink-0 max-h-full">
              <PartInfoPanel
                selectedPartId={selectedPartId}
                onClose={() => setSelectedPartId(null)}
                onFocusCameraPreset={handleSelectPreset}
                onOpenMissionAnalysis={() => setIsMissionAnalysisOpen(true)}
              />
            </div>
          </div>
        )}

        {/* If in fullscreen, show simple centered helper pill */}
        {isFullscreen && (
          <div className="pointer-events-none flex-1 flex justify-center items-start my-1">
            <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/25 text-[11px] font-tech text-slate-300 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
              <span className="text-cyan-300 font-bold">FULLSCREEN MODE</span>
              <span className="text-cyan-500/40">•</span>
              <span>Press [F] or [Esc] to exit</span>
              <span className="text-cyan-500/40">•</span>
              <span>Edge tabs toggle structure & inspector</span>
            </div>
          </div>
        )}

        {/* Mobile Floating Drawer Switchers (when not fullscreen or on small screens) */}
        {!isFullscreen && (
          <div className="md:hidden pointer-events-auto flex items-center justify-center gap-2 mb-2 font-tech">
            <button
              type="button"
              onClick={() => setMobileTab(mobileTab === 'parts' ? 'none' : 'parts')}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-all cursor-pointer ${
                mobileTab === 'parts'
                  ? 'bg-cyan-500 text-black font-bold border-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.5)]'
                  : 'bg-[#05070d]/90 text-slate-300 border-cyan-500/25 hover:border-cyan-400/50'
              }`}
            >
              Rocket Structure (6)
            </button>
            <button
              type="button"
              onClick={() => setMobileTab(mobileTab === 'info' ? 'none' : 'info')}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-all cursor-pointer ${
                mobileTab === 'info'
                  ? 'bg-cyan-500 text-black font-bold border-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.5)]'
                  : 'bg-[#05070d]/90 text-slate-300 border-cyan-500/25 hover:border-cyan-400/50'
              }`}
            >
              Engineering Specs
            </button>
            <button
              type="button"
              onClick={() => setIsMissionAnalysisOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs bg-cyan-950/40 border border-cyan-400/50 text-cyan-200 cursor-pointer"
            >
              Analysis
            </button>
          </div>
        )}

        {/* Mobile Modal Drawer Content */}
        {!isFullscreen && mobileTab === 'parts' && (
          <div className="md:hidden pointer-events-auto mb-2 max-h-[50vh] overflow-y-auto">
            <PartsList
              selectedPartId={selectedPartId}
              onSelectPart={(id) => {
                handleSelectPart(id);
                setMobileTab('info');
              }}
              onFocusPreset={(partId) => handleSelectPreset(getPresetForPart(partId))}
              partVisibility={partVisibility}
              onTogglePartVisibility={handleTogglePartVisibility}
            />
          </div>
        )}

        {!isFullscreen && mobileTab === 'info' && (
          <div className="md:hidden pointer-events-auto mb-2 max-h-[50vh] overflow-y-auto">
            <PartInfoPanel
              selectedPartId={selectedPartId}
              onClose={() => {
                setSelectedPartId(null);
                setMobileTab('none');
              }}
              onFocusCameraPreset={handleSelectPreset}
              onOpenMissionAnalysis={() => setIsMissionAnalysisOpen(true)}
            />
          </div>
        )}

        {/* Bottom Bar: Controls */}
        <ControlBar
          isExploded={isExploded}
          explodeProgress={explodeProgress}
          onToggleExplode={handleToggleExplode}
          onExplodeProgressChange={handleExplodeProgressChange}
          autoRotate={autoRotate}
          onToggleAutoRotate={() => setAutoRotate((prev) => !prev)}
          onResetCamera={handleResetCamera}
          onSelectPreset={handleSelectPreset}
          wireframe={wireframe}
          onToggleWireframe={() => setWireframe((prev) => !prev)}
          showStabilityMarkers={showStabilityMarkers}
          onToggleStabilityMarkers={() => setShowStabilityMarkers((prev) => !prev)}
          finDetailScale={finDetailScale}
          onToggleFinDetailScale={() => setFinDetailScale((prev) => !prev)}
          onOpenMissionAnalysis={() => setIsMissionAnalysisOpen(true)}
          isGestureControlActive={isGestureControlActive}
          onToggleGestureControl={handleToggleGestureControl}
          gestureError={gestureError}
          onDismissGestureError={() => setGestureError(null)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
      </div>

      {/* Full Mission Analysis Modal (NASA CEA, OpenMotor, RASAero II, Fin Flutter, Rail Exit) */}
      <MissionAnalysisModal
        isOpen={isMissionAnalysisOpen}
        onClose={() => setIsMissionAnalysisOpen(false)}
      />

      {/* Webcam Hand-Only Gesture Flight Controller */}
      <GestureManager
        isActive={isGestureControlActive}
        onDeactivate={() => setIsGestureControlActive(false)}
        onExplodeChange={handleGestureExplodeChange}
        gestureInputRef={gestureInputRef}
        onError={(err) => {
          setGestureError(err);
          setIsGestureControlActive(false);
        }}
      />
    </div>
  );
}
