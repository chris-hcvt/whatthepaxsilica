import { useEffect, useRef, useState } from 'react';
import { Engine, type Insets } from '../three/engine';
import type { ScenePreset } from '../content/slides';
import type { SiteLabels } from '../three/site';

interface Props {
  preset: ScenePreset;
  mall: string;
  labels: SiteLabels;
  insets: Insets;
  prefetchSite: boolean;
  reducedMotion: boolean;
  ui: { loading3d: string; error3d: string; noWebgl: string; dragHint: string };
}

export function Stage({ preset, mall, labels, insets, prefetchSite, reducedMotion, ui }: Props) {
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
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
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
  }, [size, insets.left, insets.bottom]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    engineRef.current?.setPreset(preset, { mall, labels }).catch(() => setSiteState('error'));
  }, [preset]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    engineRef.current?.refreshLabels(labels, preset, mall);
  }, [labels, mall]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (prefetchSite) engineRef.current?.loadSite().catch(() => setSiteState('error'));
  }, [prefetchSite]);

  const show3d = preset.kind === 'globe' || preset.kind === 'site';
  const interactive = preset.kind === 'site';

  return (
    <div className={`stage ${show3d ? 'on' : 'off'} ${interactive ? 'interactive' : ''}`} aria-hidden={!interactive}>
      <canvas ref={canvasRef} className="stage-canvas" />
      <div ref={labelRef} className="label-layer" />
      {preset.kind === 'site' && siteState === 'loading' && <div className="stage-status">{ui.loading3d}</div>}
      {preset.kind === 'site' && siteState === 'error' && <div className="stage-status err">{ui.error3d}</div>}
      {noGL && show3d && <div className="stage-status err">{ui.noWebgl}</div>}
      {interactive && siteState === 'ready' && <div className="drag-hint">{ui.dragHint}</div>}
    </div>
  );
}
