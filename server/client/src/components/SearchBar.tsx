import React, { useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
// @ts-ignore
import hotspotsData from '../seeds/hotspots.json'; 

// Fallback data in case JSON fails to load
const fallbackData = [
  { "name": "Bangalore, India", "lat": 12.9716, "lng": 77.5946, "risk": "Moderate" },
  { "name": "Amazon Rainforest, Brazil", "lat": -3.4653, "lng": -62.2159, "risk": "Critical" }
];

const hotspots = (hotspotsData || fallbackData) as any[];

const SearchBar = ({ onSearch }: { onSearch: any }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 0) {
      const filtered = hotspots.filter((item) =>
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
    console.log("Selected:", location); // DEBUG: Check console to see if this prints
    setQuery(location.name);
    setSuggestions([]);
    setIsOpen(false);
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
          placeholder="Search locations (e.g., Amazon)..."
          className="w-full pl-10 pr-4 py-3 bg-transparent text-white placeholder-cyan-500/50 focus:outline-none rounded-xl"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute mt-2 w-full bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          {suggestions.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSelect(item)}
              className="px-4 py-3 cursor-pointer hover:bg-cyan-500/20 text-white border-b border-white/10 flex justify-between"
            >
              <span>{item.name}</span>
              <span className="text-xs text-cyan-400 border border-cyan-400 px-2 rounded-full">{item.risk}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;