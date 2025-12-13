import { useState } from 'react';
import axios from 'axios';
import SearchBar from '../components/SearchBar';
import GlobeComponent from '../components/GlobeComponent';
import AnalysisPanel from '../components/AnalysisPanel';
import { getAIServerURL } from '../config/api';

type AnalysisData = {
  error?: boolean;
  errorMessage?: string;
  status?: string;
  message?: string;
  details?: string;
  forest_coverage_percent?: number;
  deforestation_percent?: number;
  score?: number;
  image_before?: string;
  image_after?: string;
  mask?: string;
  [key: string]: any;
} | null;

const Dashboard = () => {
  const [targetLocation, setTargetLocation] = useState<{lat: number, lng: number} | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  // 1. Receive Lat/Lng from SearchBar
  const handleSearch = (lat: number, lng: number, name: string) => {
    console.log(`Flying to: ${name} (${lat}, ${lng})`);
    setTargetLocation({ lat, lng });
    setAnalysisData(null); // Reset previous data
    setShowPanel(false);   // Close panel while flying
  };

  // 2. Run the AI Model (This opens the Analysis Page)
  const runAnalysis = async () => {
    if (!targetLocation) return;
    
    setIsLoading(true);
    setShowPanel(true); // Open panel immediately to show loading spinner

    try {
      // Call your Python Server
      const response = await axios.post(getAIServerURL('/analyze'), {
        lat: targetLocation.lat,
        lng: targetLocation.lng
      }, {
        timeout: 30000, // 30 second timeout
      });
      
      // Add server URL to image paths
      const formattedData = {
        ...response.data,
        image_before: response.data.image_before?.startsWith('http') 
          ? response.data.image_before 
          : `${getAIServerURL()}/${response.data.image_before}`,
        image_after: response.data.image_after?.startsWith('http')
          ? response.data.image_after
          : `${getAIServerURL()}/${response.data.image_after}`,
        mask: response.data.mask?.startsWith('http')
          ? response.data.mask
          : `${getAIServerURL()}/${response.data.mask}`,
        forest_coverage_percent: response.data.forest_coverage_percent || response.data.score,
        deforestation_percent: response.data.deforestation_percent || (100 - (response.data.score || 0))
      };
      
      setAnalysisData(formattedData);
    
    } catch (error: any) {
      console.error("Analysis Failed:", error);
      
      // Set error data instead of closing panel - panel stays open
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Failed to connect to AI Server. The server may not be running.';
      
      setAnalysisData({
        error: true,
        errorMessage: errorMessage,
        status: 'error',
        // Show helpful message in the panel
        message: 'AI Server Connection Failed',
        details: error.code === 'ECONNREFUSED' 
          ? 'Cannot connect to AI server. Please ensure the Python server is running on port 5000.'
          : error.code === 'ETIMEDOUT'
          ? 'Request timed out. The server may be processing or unavailable.'
          : errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      
      {/* Top Center: Search Bar */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Bottom Center: The "Scan" Button (Appears after flying) */}
      {targetLocation && !showPanel && (
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <button 
            onClick={runAnalysis}
            className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-lg rounded-full shadow-[0_0_30px_rgba(220,38,38,0.6)] border border-red-400 flex items-center gap-2 transition-all hover:scale-105"
          >
            <span>🛰️</span>
            <span>Initiate Satellite Scan</span>
          </button>
        </div>
      )}

      {/* Right Side: The Analysis Page (Pop-up) */}
      {showPanel && (
        <AnalysisPanel 
          data={analysisData} 
          isLoading={isLoading} 
          onClose={() => setShowPanel(false)} 
        />
      )}

      {/* Background: The 3D Globe */}
      <div className="absolute inset-0 z-0">
        <GlobeComponent targetLocation={targetLocation} />
      </div>

    </div>
  );
};

export default Dashboard;