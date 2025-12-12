import React, { useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';

interface GlobeProps {
  targetLocation: { lat: number; lng: number } | null;
}

const GlobeComponent: React.FC<GlobeProps> = ({ targetLocation }) => {
  const globeEl = useRef<any>();

  useEffect(() => {
    if (targetLocation && globeEl.current) {
      console.log("Globe moving to:", targetLocation); // DEBUG
      
      // Stop rotation when flying to a target
      globeEl.current.controls().autoRotate = false;
      
      globeEl.current.pointOfView({
        lat: targetLocation.lat,
        lng: targetLocation.lng,
        altitude: 1.5 // Zoom level
      }, 2000);
    }
  }, [targetLocation]);

  return (
    <div className="absolute inset-0 z-0">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // INTERACTION SETTINGS
        enableZoom={true}
        enableRotate={true}
        autoRotate={true} // Makes earth spin automatically
        autoRotateSpeed={0.5}
      />
    </div>
  );
};

export default GlobeComponent;