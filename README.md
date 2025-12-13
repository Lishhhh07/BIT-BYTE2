EcoWatch is a full-stack application designed to monitor and analyze forest coverage using satellite imagery and advanced deep learning models. The application provides a user-friendly interface for visualizing predicted deforestation masks and generating detailed reports.This project uses a dual-server architecture: a Frontend Client (Vite/React) for the user interface and a separate Backend API (Flask/PyTorch) for AI-driven image segmentation and analysis.⚙️ Technologies UsedLayerTechnologyPurposeFrontendReact, TypeScript, ViteUser Interface, Map interaction, Data visualization.Backend/APIFlask, PythonREST API, handling analysis requests, serving static images.AI/MLPyTorch, Segmentation Models PyTorch (smp), NumPyDeep learning model for image segmentation and mask generation.DeploymentVercel (for both front and back)Serverless hosting for the web client and Python API endpoints.📁 Project StructureThe project is divided into two main folders to separate the frontend and backend concerns, which is critical for deployment on platforms like Vercel./ecowatch-app/
├── client/                     # Frontend Application (React/Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalysisPanel.tsx   # Displays results and handles image fetching
│   │   ├── pages/
│   │   │   └── Dashboard.tsx
│   │   └── App.tsx
│   └── package.json
│
├── api/                        # Backend Application (Flask/PyTorch Serverless)
│   ├── index.py                # Vercel entry point (replaces app.py)
│   ├── bridge.py               # Core AI logic: model loading, image processing, path generation
│   ├── ai_engine/
│   │   ├── data/
│   │   │   └── Forest Segmented/ # Source images for analysis
│   │   └── output/
│   │       └── best_model.pth    # Trained PyTorch model weights
│   └── requirements.txt        # Python dependencies (Flask, torch, numpy, etc.)
│
├── vercel.json                 # Vercel configuration for mono-repo deployment
└── README.md
💻 Local Setup and InstallationFollow these steps to get both the frontend and backend servers running on your machine.1. Backend Setup (Flask/Python)Navigate: Open a terminal and move to the API directory.Bashcd ecowatch-app/api
Create Environment: (Recommended) Create and activate a Python virtual environment.Bashpython -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # macOS/Linux
Install Dependencies: Install all necessary Python packages.Bashpip install -r requirements.txt
Add Assets: Place your satellite images into ai_engine/data/Forest Segmented/ and your trained model (best_model.pth) into ai_engine/output/.Start the Server (Terminal 1): Run the Flask application.Bashpython index.py
(The server should start on http://localhost:5000)2. Frontend Setup (React/Vite)Open a Second Terminal and navigate to the client directory.Bashcd ../client
Install Dependencies:Bashnpm install
Start the Client (Terminal 2): Run the development server.Bashnpm run dev
(The client should open in your browser, typically on http://localhost:5175)
