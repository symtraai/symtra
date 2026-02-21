'use client';

import { useRef, useEffect, useCallback } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import { motion } from 'framer-motion';
import { Scenario, scenarios } from '@/lib/scenarios';
import 'maplibre-gl/dist/maplibre-gl.css';

interface WorldMapProps {
  selectedScenario: Scenario | null;
  onScenarioSelect: (scenario: Scenario) => void;
}

// Free dark style — Stadia Maps Alidade Smooth Dark (no token needed on localhost)
const MAP_STYLE = 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json';

const INITIAL_VIEW = {
  longitude: 0,
  latitude: 20,
  zoom: 1.8,
};

export default function WorldMap({ selectedScenario, onScenarioSelect }: WorldMapProps) {
  const mapRef = useRef<MapRef>(null);

  const flyToScenario = useCallback((scenario: Scenario) => {
    mapRef.current?.flyTo({
      center: scenario.coords,
      zoom: 11,
      duration: 3000,
      curve: 1.4,
      essential: true,
    });
  }, []);

  useEffect(() => {
    if (selectedScenario) {
      flyToScenario(selectedScenario);
    } else {
      mapRef.current?.flyTo({
        center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
        zoom: INITIAL_VIEW.zoom,
        duration: 2000,
      });
    }
  }, [selectedScenario, flyToScenario]);

  return (
    <div className="relative flex-1 h-full">
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {scenarios.map((scenario) => (
          <Marker
            key={scenario.id}
            longitude={scenario.coords[0]}
            latitude={scenario.coords[1]}
            anchor="center"
            onClick={(e: { originalEvent: MouseEvent }) => {
              e.originalEvent.stopPropagation();
              onScenarioSelect(scenario);
            }}
          >
            <div className="relative cursor-pointer group" title={scenario.title}>
              {/* Outer pulse ring */}
              <div
                className={`absolute inset-0 rounded-full animate-ping opacity-60 ${
                  selectedScenario?.id === scenario.id
                    ? 'bg-cyan-400 scale-150'
                    : 'bg-red-500'
                }`}
                style={{ animationDuration: '1.5s' }}
              />
              {/* Inner dot */}
              <div
                className={`relative w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                  selectedScenario?.id === scenario.id
                    ? 'bg-cyan-400 border-cyan-200 shadow-[0_0_12px_rgba(0,212,255,0.8)]'
                    : 'bg-red-500 border-red-300 shadow-[0_0_8px_rgba(255,0,64,0.6)] group-hover:bg-red-400'
                }`}
              />
              {/* Label on hover */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                <div className="bg-black/90 border border-cyan-500/40 rounded px-2 py-1">
                  <p className="text-cyan-300 text-[9px] font-mono font-bold">{scenario.title}</p>
                  <p className="text-cyan-500/60 text-[8px] font-mono">{scenario.city}</p>
                </div>
              </div>
            </div>
          </Marker>
        ))}
      </Map>

      {/* Map overlay grid lines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Selected scenario city overlay */}
      {selectedScenario && (
        <motion.div
          key={selectedScenario.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 2.5, duration: 0.5 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel border border-cyan-500/30 rounded px-4 py-2 text-center"
        >
          <p className="text-[9px] text-cyan-500/50 font-mono tracking-widest">INCIDENT LOCATION</p>
          <p className="text-cyan-300 font-mono text-sm font-bold">{selectedScenario.city.toUpperCase()}, {selectedScenario.country.toUpperCase()}</p>
          <p className="text-[9px] text-red-400 font-mono mt-0.5">{selectedScenario.title.toUpperCase()} — {selectedScenario.severity}</p>
        </motion.div>
      )}

      {/* Bottom status bar */}
      <div className="absolute bottom-0 left-0 right-0 h-6 glass-panel border-t border-cyan-500/10 flex items-center px-3 justify-between">
        <span className="text-[9px] font-mono text-cyan-500/40">
          {selectedScenario
            ? `LOCKED: ${selectedScenario.coords[1].toFixed(4)}°N ${selectedScenario.coords[0].toFixed(4)}°E`
            : 'SELECT INCIDENT ON MAP OR SIDEBAR'}
        </span>
        <span className="text-[9px] font-mono text-cyan-500/30">
          MAPLIBRE GL — STADIA DARK
        </span>
      </div>
    </div>
  );
}
