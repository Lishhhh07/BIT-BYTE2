import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

interface GlobeProps {
  targetLocation: { lat: number; lng: number } | null;
}

const GlobeComponent: React.FC<GlobeProps> = ({ targetLocation }) => {
  const globeEl = useRef<any>();
  const [markers, setMarkers] = useState<any[]>([]);

  useEffect(() => {
    if (targetLocation && globeEl.current) {
      // 1. Add a Red "Pinpoint" Ring at the location
      setMarkers([{
        lat: targetLocation.lat,
        lng: targetLocation.lng,
        size: 1,
        color: 'red'
      }]);

      // 2. Stop Auto-Rotation (so user can focus)
      globeEl.current.controls().autoRotate = false;
      
      // 3. Fly the Camera to the spot (Smooth Animation)
      globeEl.current.pointOfView({
        lat: targetLocation.lat,
        lng: targetLocation.lng,
        altitude: 0.5  // <--- 0.5 is "Close Up / Satellite View"
      }, 2000); // 2 seconds travel time
    }
  }, [targetLocation]);

  return (
    <Globe
      ref={globeEl}
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
      backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
      
      // Markers (The Red Pinpoint)
      ringsData={markers}
      ringColor={() => '#ff0000'} // Red color
      ringMaxRadius={() => 5}     // Size of ring
      ringPropagationSpeed={() => 5} // Pulse speed
      ringRepeatPeriod={() => 1000}  // Pulse every 1s

      // Visuals
      atmosphereColor="#3a228a"
      atmosphereAltitude={0.2}
      enableZoom={true}
      
      // Default Rotation (Spins until you search)
      enableRotate={true}
      autoRotate={true}
      autoRotateSpeed={0.5}
    />
  );
};

export default GlobeComponent;