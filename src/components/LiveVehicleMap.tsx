"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Path between:
// Start: 23.0381, 72.5544 (LD College)
// End: 23.0398, 72.5318 (Commerce Six Roads)
const ROAD_PATH: [number, number][] = [
    [23.0381, 72.5544], // LD College
    [23.0382, 72.5535],
    [23.0383, 72.5510],
    [23.0385, 72.5485],
    [23.0386, 72.5460],
    [23.0388, 72.5435],
    [23.0390, 72.5410],
    [23.0393, 72.5385],
    [23.0395, 72.5350],
    [23.0397, 72.5330],
    [23.0398, 72.5318], // Commerce Six Roads
];

function RecenterMap({ position }: { position: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(position, 16);
    }, [position, map]);
    return null;
}

// Internal component to handle map interactions
function InternalMapControls({ isSatellite, setIsSatellite }: { isSatellite: boolean, setIsSatellite: (s: boolean) => void }) {
    const map = useMap();
    return (
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-[1000] flex flex-col gap-2 sm:gap-3 animate-fade-in" style={{ animationDelay: '0.2s', pointerEvents: 'auto' }}>
            <button
                onClick={() => map.zoomIn()}
                className="h-10 w-10 sm:h-14 sm:w-14 bg-white/90 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-xl flex items-center justify-center text-sm sm:text-xl border border-white/50 hover:bg-white transition-all hover:scale-105 active:scale-95"
            >
                ➕
            </button>
            <button
                onClick={() => map.zoomOut()}
                className="h-10 w-10 sm:h-14 sm:w-14 bg-white/90 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-xl flex items-center justify-center text-sm sm:text-xl border border-white/50 hover:bg-white transition-all hover:scale-105 active:scale-95"
            >
                ➖
            </button>
            <button
                onClick={() => setIsSatellite(!isSatellite)}
                className={`h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl shadow-xl flex items-center justify-center text-sm sm:text-xl transition-all hover:scale-110 shadow-blue-500/30 ${isSatellite ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}
            >
                {isSatellite ? '🏙️' : '🛰️'}
            </button>
        </div>
    );
}

export default function LiveVehicleMap({ vehicleName }: { vehicleName: string }) {
    const [currentPos, setCurrentPos] = useState<[number, number]>(ROAD_PATH[0]);
    const [rotation, setRotation] = useState(0);
    const [pathIndex, setPathIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isSatellite, setIsSatellite] = useState(false);

    // Create a rotating premium marker using a DivIcon
    const vehicleIcon = useMemo(() => {
        if (typeof window === "undefined") return null;
        return L.divIcon({
            className: "bg-transparent",
            html: `
                <div class="relative group" style="transform: rotate(${rotation - 90}deg); transition: transform 0.1s linear;">
                    <div class="h-12 w-12 bg-blue-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-xl hover:scale-110 transition-transform">
                        ${vehicleName.toLowerCase().includes('water') ? '💧' : '🚛'}
                    </div>
                </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
        });
    }, [rotation, vehicleName]);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 1) {
                    setPathIndex((idx) => (idx + 1) % (ROAD_PATH.length - 1));
                    return 0;
                }
                return prev + 0.01;
            });
        }, 80);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const start = ROAD_PATH[pathIndex];
        const end = ROAD_PATH[pathIndex + 1];

        // Calculate heading (bearing)
        const angle = Math.atan2(end[1] - start[1], end[0] - start[0]) * (180 / Math.PI);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRotation(90 - angle);

        const lat = start[0] + (end[0] - start[0]) * progress;
        const lng = start[1] + (end[1] - start[1]) * progress;

        setCurrentPos([lat, lng]);
    }, [pathIndex, progress]);

    if (!vehicleIcon) return null;

    return (
        <div className="relative h-full w-full overflow-hidden bg-slate-50">
            {/* Glassmorphism Header Overlay */}
            <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-[1000] animate-fade-in pointer-events-none">
                <div className="backdrop-blur-xl bg-white/80 border border-white/40 rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-6 sm:py-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-blue-500 animate-pulse ring-4 ring-blue-500/20" />
                        <div>
                            <p className="text-[8px] sm:text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] leading-none mb-1">Fleet Surveillance</p>
                            <p className="text-base sm:text-xl font-black text-slate-900 leading-none">{vehicleName}</p>
                        </div>
                    </div>
                </div>
            </div>

            <MapContainer
                center={ROAD_PATH[0]}
                zoom={16}
                scrollWheelZoom={true}
                className="h-full w-full"
                zoomControl={false}
            >
                <TileLayer
                    url={isSatellite
                        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    }
                    attribution={isSatellite ? "Esri, DigitalGlobe, GeoEye, i-cubed, USDA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community" : ""}
                />

                <Polyline
                    positions={ROAD_PATH}
                    color={isSatellite ? "#fde047" : "#3b82f6"}
                    weight={8}
                    opacity={isSatellite ? 0.4 : 0.1}
                />

                <Marker position={currentPos} icon={vehicleIcon} />

                <RecenterMap position={currentPos} />
                <InternalMapControls isSatellite={isSatellite} setIsSatellite={setIsSatellite} />
            </MapContainer>

            {/* Bottom Glass Badge */}
            <div className="absolute bottom-8 left-8 z-[1000] animate-fade-in pointer-events-none" style={{ animationDelay: '0.4s' }}>
                <div className="backdrop-blur-xl bg-slate-900/90 border border-white/10 rounded-2xl px-5 py-3 shadow-2xl">
                    <div className="flex items-center gap-4 text-xs font-bold text-white uppercase tracking-widest">
                        <span className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                            Speed: 42 km/h
                        </span>
                        <span className="w-px h-3 bg-white/20"></span>
                        <span className="opacity-60">Heading: {rotation.toFixed(0)}° SV</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
