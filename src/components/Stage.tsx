import { useEffect, useRef, useState } from 'react';
import { Engine, type Insets, type SceneState } from '../three/engine';
import type { SiteLabels } from '../three/site';
import type { HomeKey } from '../three/hectare';
import type { WaterKey } from '../content/power';

interface Props {
  state: SceneState;
  refKey: string;
  homeKey: HomeKey;
  waterKey: WaterKey;
  labels: SiteLabels;
  insets: Insets;
  reducedMotion: boolean;
  /** hide the 3D labels (when a reading section or the 2D map covers the view) */
  quiet?: boolean;
  ui: { loading3d: string; error3d: string; noWebgl: string; dragHint: string };
}

/** Full-screen, fixed 3D view behind the story. */
export function Stage({ state, refKey, homeKey, waterKey, labels, insets, reducedMotion, quiet, ui }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [siteState, setSiteState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [noGL, setNoGL] = useState(false);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    let engine: Engine;
    try {
      engine = new Engine(canvasRef.current!, labelRef.current!);
    } catch {
      setNoGL(true);
      return;
    }
    engine.onSiteProgress = (s) => setSiteState(s);
    engineRef.current = engine;
    // phones fire resize when the URL bar hides; only react to real size changes
    let last = { w: window.innerWidth, h: window.innerHeight };
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w !== last.w || Math.abs(h - last.h) > 120) {
        last = { w, h };
        setSize({ w, h });
      }
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) engineRef.current.reducedMotion = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    engineRef.current?.resize(size.w, size.h, insets);
  }, [size, insets.left, insets.bottom, insets.top]); // eslint-disable-line react-hooks/exhaustive-deps

  const stateKey = JSON.stringify(state);
  useEffect(() => {
    engineRef.current?.setState(state, { refKey, homeKey, waterKey, labels }).catch(() => setSiteState('error'));
  }, [stateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    engineRef.current?.refresh(state, { refKey, homeKey, waterKey, labels });
  }, [labels, refKey, homeKey, waterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const on = state.kind === 'site';
  return (
    <div className={`stage ${on ? 'on' : 'off'} ${quiet ? 'quiet' : ''}`}>
      <canvas ref={canvasRef} className="stage-canvas" aria-hidden="true" />
      <div ref={labelRef} className="label-layer" aria-hidden="true" />
      {on && siteState === 'loading' && <div className="stage-status">{ui.loading3d}</div>}
      {on && siteState === 'error' && <div className="stage-status err">{ui.error3d}</div>}
      {noGL && on && <div className="stage-status err">{ui.noWebgl}</div>}
    </div>
  );
}
