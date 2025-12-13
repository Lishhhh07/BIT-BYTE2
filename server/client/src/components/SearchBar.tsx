import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

// Try to import the JSON. If it fails, we use the fallback below.
// @ts-ignore
import rawHotspots from '../seeds/hotspot.json'; 

// FALLBACK DATA (In case JSON is missing or empty)
const fallbackHotspots = [
  { "name": "Amazon Rainforest, Brazil", "lat": -3.4653, "lng": -62.2159, "risk": "Critical" },
  { "name": "Borneo, Indonesia", "lat": -0.7893, "lng": 113.9213, "risk": "High" },
  { "name": "Congo Basin", "lat": -1.4061, "lng": 22.1820, "risk": "Severe" },
  { "name": "Daintree Rainforest, Australia", "lat": -16.1700, "lng": 145.4185, "risk": "Moderate" },
  { "name": "Sundarbans, India/Bangladesh", "lat": 21.9497, "lng": 89.1833, "risk": "High" }
];

const hotspots = (rawHotspots && rawHotspots.length > 0) ? rawHotspots : fallbackHotspots;

const SearchBar = ({ onSearch }: { onSearch: (lat: number, lng: number, name: string) => void }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 0) {
      // Filter the hotspots list based on typing
      const filtered = hotspots.filter((item: any) =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (location: any) => {
    setQuery(location.name);
    setSuggestions([]);
    setIsOpen(false);
    // Send the exact Lat/Lng to the Dashboard
    onSearch(location.lat, location.lng, location.name);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative flex items-center bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-xl">
        <Search className="absolute left-3 text-cyan-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search deforestation hotspots..."
          className="w-full pl-10 pr-4 py-3 bg-transparent text-white placeholder-cyan-500/50 focus:outline-none rounded-xl"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute mt-2 w-full bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          {suggestions.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSelect(item)}
              className="px-4 py-3 cursor-pointer hover:bg-cyan-500/20 text-white border-b border-white/10 flex justify-between items-center"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{item.name}</span>
              </div>
              <span className="text-xs text-cyan-400 border border-cyan-400 px-2 py-0.5 rounded-full">{item.risk || 'Alert'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;