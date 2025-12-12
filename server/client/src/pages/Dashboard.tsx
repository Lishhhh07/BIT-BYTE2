import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import GlobeComponent from '../components/GlobeComponent';

const Dashboard = () => {
  const [targetLocation, setTargetLocation] = useState<{lat: number, lng: number} | null>(null);

  const handleSearch = (lat: number, lng: number, name: string) => {
    console.log(`Dashboard received: ${name} (${lat}, ${lng})`);
    setTargetLocation({ lat, lng });
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      
      {/* SEARCH BAR - HIGH Z-INDEX */}
      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* GLOBE - LOW Z-INDEX */}
      <div className="absolute inset-0 z-0">
        <GlobeComponent targetLocation={targetLocation} />
      </div>

    </div>
  );
};

export default Dashboard;