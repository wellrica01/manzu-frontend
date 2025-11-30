'use client';

import React, { useState } from 'react';
import { Filter, ZoomIn, ZoomOut, Maximize2, MapPin, Layers, Search } from 'lucide-react';

const KanoIntelligenceMap = () => {
  const [view, setView] = useState('kano');
  const [selectedZone, setSelectedZone] = useState('all');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [showConnections, setShowConnections] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightRoutes, setHighlightRoutes] = useState(false);

  // Northern States Data
  const northernStates = [
    { name: "Benue", capital: "Makurdi", lat: 7.740379, lon: 8.528557, zone: "North Central", population: "5,787,706", color: "#10b981" },
    { name: "Kogi", capital: "Lokoja", lat: 8.154306, lon: 6.470405, zone: "North Central", population: "4,153,734", color: "#10b981" },
    { name: "Kwara", capital: "Ilorin", lat: 8.492085, lon: 4.647421, zone: "North Central", population: "3,259,613", color: "#10b981" },
    { name: "Nasarawa", capital: "Lafia", lat: 8.566893, lon: 8.615892, zone: "North Central", population: "2,632,239", color: "#10b981" },
    { name: "Niger", capital: "Minna", lat: 9.605730, lon: 6.520510, zone: "North Central", population: "6,220,617", color: "#10b981" },
    { name: "Plateau", capital: "Jos", lat: 9.837414, lon: 8.920163, zone: "North Central", population: "4,400,974", color: "#10b981" },
    { name: "FCT", capital: "Abuja", lat: 9.001178, lon: 7.424535, zone: "North Central", population: "2,702,443", color: "#10b981" },
    { name: "Adamawa", capital: "Yola", lat: 9.213820, lon: 12.553746, zone: "North East", population: "4,536,948", color: "#f59e0b" },
    { name: "Bauchi", capital: "Bauchi", lat: 10.239599, lon: 9.869878, zone: "North East", population: "7,540,663", color: "#f59e0b" },
    { name: "Borno", capital: "Maiduguri", lat: 11.846994, lon: 13.217766, zone: "North East", population: "5,751,590", color: "#f59e0b" },
    { name: "Gombe", capital: "Gombe", lat: 10.312032, lon: 11.241617, zone: "North East", population: "3,623,462", color: "#f59e0b" },
    { name: "Taraba", capital: "Jalingo", lat: 8.878602, lon: 11.414956, zone: "North East", population: "3,331,885", color: "#f59e0b" },
    { name: "Yobe", capital: "Damaturu", lat: 11.764709, lon: 12.023528, zone: "North East", population: "3,398,177", color: "#f59e0b" },
    { name: "Jigawa", capital: "Dutse", lat: 11.778039, lon: 9.300826, zone: "North West", population: "6,779,080", color: "#3b82f6" },
    { name: "Kaduna", capital: "Kaduna", lat: 10.514893, lon: 7.447554, zone: "North West", population: "8,324,285", color: "#3b82f6" },
    { name: "Kano", capital: "Kano", lat: 11.944157, lon: 8.483233, zone: "North West", population: "14,253,549", color: "#ef4444", isHub: true },
    { name: "Katsina", capital: "Katsina", lat: 12.996765, lon: 7.603135, zone: "North West", population: "9,300,382", color: "#3b82f6" },
    { name: "Kebbi", capital: "Birnin Kebbi", lat: 12.458929, lon: 4.256396, zone: "North West", population: "5,001,610", color: "#3b82f6" },
    { name: "Sokoto", capital: "Sokoto", lat: 13.039870, lon: 5.270807, zone: "North West", population: "5,863,187", color: "#3b82f6" },
    { name: "Zamfara", capital: "Gusau", lat: 12.106123, lon: 6.737003, zone: "North West", population: "5,317,793", color: "#3b82f6" }
  ];

  // Kano LGAs Data
  const kanoLGAs = [
    { name: "Ajingi", lat: 11.97819031, lon: 9.028078103, district: "East" },
    { name: "Albasu", lat: 11.651497, lon: 9.153337334, district: "East" },
    { name: "Bagwai", lat: 12.1613076, lon: 8.146918354, district: "West" },
    { name: "Bebeji", lat: 11.66595444, lon: 8.255353809, district: "Central" },
    { name: "Bichi", lat: 12.19072733, lon: 8.193985317, district: "West" },
    { name: "Bunkure", lat: 11.68477212, lon: 8.532921022, district: "Central" },
    { name: "Dala", lat: 12.0167, lon: 8.4833, district: "Metropolitan", isMetro: true },
    { name: "Dambatta", lat: 12.39738781, lon: 8.536801099, district: "North" },
    { name: "Dawakin Kudu", lat: 11.84341232, lon: 8.588567209, district: "Central" },
    { name: "Dawakin Tofa", lat: 12.11234745, lon: 8.343793221, district: "Central" },
    { name: "Doguwa", lat: 10.74423476, lon: 8.606166028, district: "South" },
    { name: "Fagge", lat: 12.0067, lon: 8.5292, district: "Metropolitan", isMetro: true },
    { name: "Gabasawa", lat: 12.16417154, lon: 8.888191945, district: "North" },
    { name: "Garko", lat: 11.61100232, lon: 8.75437773, district: "East" },
    { name: "Garum Mallam", lat: 11.6709982, lon: 8.325301379, district: "Central" },
    { name: "Gaya", lat: 11.83067369, lon: 9.034707762, district: "East" },
    { name: "Gezawa", lat: 12.11564093, lon: 8.748604314, district: "North" },
    { name: "Gwale", lat: 11.9667, lon: 8.5000, district: "Metropolitan", isMetro: true },
    { name: "Gwarzo", lat: 11.91410689, lon: 7.927826562, district: "West" },
    { name: "Kabo", lat: 11.84658641, lon: 8.179198752, district: "West" },
    { name: "Kano Municipal", lat: 11.9519, lon: 8.5403, district: "Metropolitan", isMetro: true, isHub: true },
    { name: "Karaye", lat: 11.79107326, lon: 8.022594242, district: "West" },
    { name: "Kibiya", lat: 11.5197996, lon: 8.625747533, district: "South" },
    { name: "Kiru", lat: 11.69955834, lon: 8.15470437, district: "West" },
    { name: "Kumbotso", lat: 11.8881, lon: 8.5028, district: "Metropolitan", isMetro: true },
    { name: "Kunchi", lat: 12.49901596, lon: 8.288600914, district: "North" },
    { name: "Kura", lat: 11.74004179, lon: 8.412020222, district: "Central" },
    { name: "Madobi", lat: 11.76787492, lon: 8.280328563, district: "Central" },
    { name: "Makoda", lat: 12.4232591, lon: 8.407853609, district: "North" },
    { name: "Minjibir", lat: 12.15882104, lon: 8.656771156, district: "North" },
    { name: "Nassarawa", lat: 11.9769, lon: 8.5625, district: "Metropolitan", isMetro: true },
    { name: "Rano", lat: 11.53462388, lon: 8.551242227, district: "South" },
    { name: "Rimin Gado", lat: 11.95408098, lon: 8.257522726, district: "Central" },
    { name: "Rogo", lat: 11.55190186, lon: 7.835528127, district: "South" },
    { name: "Shanono", lat: 12.04562446, lon: 7.970345245, district: "West" },
    { name: "Sumaila", lat: 11.48701594, lon: 8.92812862, district: "East" },
    { name: "Takai", lat: 11.55641207, lon: 9.111899078, district: "East" },
    { name: "Tarauni", lat: 11.9667, lon: 8.5667, district: "Metropolitan", isMetro: true },
    { name: "Tofa", lat: 12.05046, lon: 8.241119925, district: "Central" },
    { name: "Tsanyawa", lat: 12.24716534, lon: 7.995661541, district: "North" },
    { name: "Tundun Wada", lat: 11.24287546, lon: 8.455228404, district: "South" },
    { name: "Ungogo", lat: 12.0906, lon: 8.4967, district: "Metropolitan", isMetro: true },
    { name: "Warawa", lat: 11.83156899, lon: 8.729350533, district: "East" },
    { name: "Wudil", lat: 11.81350673, lon: 8.828012312, district: "East" }
  ];

  const currentData = view === 'kano' ? kanoLGAs : northernStates;
  const filteredData = view === 'kano' 
    ? kanoLGAs.filter(lga => 
        (selectedZone === 'all' || lga.district === selectedZone) &&
        (searchTerm === '' || lga.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : northernStates.filter(state => 
        (selectedZone === 'all' || state.zone === selectedZone) &&
        (searchTerm === '' || state.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );

  // Web Mercator projection (same as Google Maps)
  const toWebMercator = (lat, lon) => {
    const latRad = lat * Math.PI / 180;
    const n = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    return { x: lon, y: n * 180 / Math.PI };
  };

  // Get projected bounds
  const projectedData = filteredData.map(d => ({
    ...d,
    projected: toWebMercator(d.lat, d.lon)
  }));

  const projectedX = projectedData.map(d => d.projected.x);
  const projectedY = projectedData.map(d => d.projected.y);
  const minX = Math.min(...projectedX);
  const maxX = Math.max(...projectedX);
  const minY = Math.min(...projectedY);
  const maxY = Math.max(...projectedY);

  const width = 1400;
  const height = 900;
  const padding = 100;

  // Calculate aspect ratio to maintain proper proportions
  const dataWidth = maxX - minX;
  const dataHeight = maxY - minY;
  const dataAspect = dataWidth / dataHeight;
  const viewAspect = (width - 2 * padding) / (height - 2 * padding);

  let scaleX, scaleY, offsetX, offsetY;
  
  if (dataAspect > viewAspect) {
    // Data is wider - fit to width
    scaleX = (width - 2 * padding) / dataWidth;
    scaleY = scaleX;
    offsetX = padding;
    offsetY = (height - dataHeight * scaleY) / 2;
  } else {
    // Data is taller - fit to height
    scaleY = (height - 2 * padding) / dataHeight;
    scaleX = scaleY;
    offsetY = padding;
    offsetX = (width - dataWidth * scaleX) / 2;
  }

  const projectPoint = (lat, lon) => {
    const mercator = toWebMercator(lat, lon);
    const x = (mercator.x - minX) * scaleX + offsetX;
    const y = height - ((mercator.y - minY) * scaleY + offsetY);
    return { x, y };
  };

  const getConnections = () => {
    const connections = [];
    const threshold = view === 'kano' ? 0.25 : 2.5;
    filteredData.forEach((node1, i) => {
      filteredData.forEach((node2, j) => {
        if (i < j) {
          const distance = Math.sqrt(Math.pow(node1.lat - node2.lat, 2) + Math.pow(node1.lon - node2.lon, 2));
          if (distance < threshold) {
            connections.push([node1, node2, distance]);
          }
        }
      });
    });
    return connections;
  };

  const connections = showConnections ? getConnections() : [];

  const getNodeColor = (node) => {
    if (view === 'kano') {
      if (node.isHub) return '#ef4444';
      if (node.isMetro) return '#8b5cf6';
      return '#3b82f6';
    }
    return node.color;
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-white">Strategic Intelligence Network</h1>
              <p className="text-slate-500 text-xs mt-0.5">Kano-Centric Regional Architecture</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setView('kano')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'kano' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                Kano LGAs (44)
              </button>
              <button onClick={() => setView('northern')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'northern' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                Northern States (20)
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-1.5 bg-slate-800 text-white text-sm rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
            </div>
            <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="px-3 py-1.5 bg-slate-800 text-white text-sm rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All {view === 'kano' ? 'Districts' : 'Zones'}</option>
              {view === 'kano' ? (
                <>
                  <option value="Metropolitan">Metropolitan</option>
                  <option value="North">North</option>
                  <option value="South">South</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="Central">Central</option>
                </>
              ) : (
                <>
                  <option value="North Central">North Central</option>
                  <option value="North East">North East</option>
                  <option value="North West">North West</option>
                </>
              )}
            </select>
            <button onClick={() => setShowConnections(!showConnections)} className={`p-1.5 rounded-md text-sm transition-all ${showConnections ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`} title="Toggle Connections">
              <Layers size={18} />
            </button>
            <button onClick={() => setHighlightRoutes(!highlightRoutes)} className={`p-1.5 rounded-md text-sm transition-all ${highlightRoutes ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'}`} title="Highlight Routes">
              <Filter size={18} />
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            <button onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors">
              <ZoomIn size={18} />
            </button>
            <button onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors">
              <ZoomOut size={18} />
            </button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors">
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 overflow-hidden relative cursor-move" onMouseDown={(e) => { setIsDragging(true); setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); }} onMouseMove={(e) => { if (isDragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }} onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center', transition: isDragging ? 'none' : 'transform 0.2s ease-out' }}>
          <defs>
            <radialGradient id="hubGrad"><stop offset="0%" stopColor="#fca5a5" /><stop offset="100%" stopColor="#ef4444" /></radialGradient>
            <radialGradient id="metroGrad"><stop offset="0%" stopColor="#c4b5fd" /><stop offset="100%" stopColor="#8b5cf6" /></radialGradient>
            <radialGradient id="normalGrad"><stop offset="0%" stopColor="#93c5fd" /><stop offset="100%" stopColor="#3b82f6" /></radialGradient>
            <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          
          <g opacity="0.05">
            {[...Array(30)].map((_, i) => <line key={`v${i}`} x1={(width/30)*i} y1="0" x2={(width/30)*i} y2={height} stroke="#fff" strokeWidth="0.5" />)}
            {[...Array(20)].map((_, i) => <line key={`h${i}`} x1="0" y1={(height/20)*i} x2={width} y2={(height/20)*i} stroke="#fff" strokeWidth="0.5" />)}
          </g>

          {connections.map((conn, i) => {
            const p1 = projectPoint(conn[0].lat, conn[0].lon);
            const p2 = projectPoint(conn[1].lat, conn[1].lon);
            const isHighlighted = highlightRoutes && (conn[0].isHub || conn[1].isHub || conn[0].isMetro || conn[1].isMetro);
            return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={isHighlighted ? '#60a5fa' : '#475569'} strokeWidth={isHighlighted ? '1.5' : '0.8'} opacity={isHighlighted ? '0.6' : '0.2'} />;
          })}

          {filteredData.map((node, i) => {
            const pos = projectPoint(node.lat, node.lon);
            const isHovered = hoveredNode === node.name;
            const nodeSize = node.isHub ? 12 : node.isMetro ? 9 : 6;
            const nodeColor = getNodeColor(node);
            const gradId = node.isHub ? 'hubGrad' : node.isMetro ? 'metroGrad' : 'normalGrad';
            
            return (
              <g key={i} onMouseEnter={() => setHoveredNode(node.name)} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: 'pointer' }}>
                {isHovered && <circle cx={pos.x} cy={pos.y} r="22" fill={nodeColor} opacity="0.15" filter="url(#glow)" />}
                <circle cx={pos.x} cy={pos.y} r={isHovered ? nodeSize + 2 : nodeSize} fill={`url(#${gradId})`} stroke={nodeColor} strokeWidth={isHovered ? '2.5' : '1.5'} filter={isHovered ? "url(#glow)" : ""} style={{ transition: 'all 0.2s' }} />
                <text x={pos.x} y={pos.y - nodeSize - 6} textAnchor="middle" fill="#e2e8f0" fontSize={isHovered ? '11' : '9'} fontWeight={isHovered ? '600' : '400'} style={{ pointerEvents: 'none', textShadow: '1px 1px 3px rgba(0,0,0,0.9)' }}>
                  {node.name}
                </text>
                {isHovered && (
                  <g>
                    <rect x={pos.x - 85} y={pos.y + 18} width="170" height={view === 'kano' ? '42' : '55'} fill="#0f172a" opacity="0.95" rx="6" stroke={nodeColor} strokeWidth="1.5" />
                    <text x={pos.x} y={pos.y + 32} textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="500">
                      {view === 'kano' ? `District: ${node.district}` : `${node.capital} • ${node.zone}`}
                    </text>
                    {view === 'northern' && (
                      <text x={pos.x} y={pos.y + 44} textAnchor="middle" fill="#94a3b8" fontSize="8">Pop: {node.population}</text>
                    )}
                    <text x={pos.x} y={pos.y + (view === 'kano' ? 44 : 56)} textAnchor="middle" fill="#64748b" fontSize="7">
                      {node.lat.toFixed(3)}°N, {node.lon.toFixed(3)}°E
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          <g transform={`translate(${width - 80}, 50)`}>
            <circle cx="0" cy="0" r="30" fill="#0f172a" opacity="0.9" stroke="#334155" strokeWidth="1.5"/>
            <line x1="0" y1="-20" x2="0" y2="-24" stroke="#ef4444" strokeWidth="2.5"/>
            <polygon points="0,-24 -3,-18 3,-18" fill="#ef4444"/>
            <text x="0" y="-28" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">N</text>
          </g>
        </svg>

        <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-lg p-3 max-w-xs">
          <div className="flex items-start gap-2">
            <MapPin className="text-blue-400 mt-0.5 flex-shrink-0" size={16} />
            <div className="text-xs">
              <p className="text-slate-300 mb-1.5 font-medium">
                {hoveredNode ? <span className="text-white text-sm">{hoveredNode}</span> : <span className="text-slate-500">Hover nodes for details</span>}
              </p>
              <div className="text-xs text-slate-500 space-y-0.5">
                <p>• Nodes: <span className="text-blue-400">{filteredData.length}</span></p>
                <p>• Routes: <span className="text-blue-400">{connections.length}</span></p>
                <p>• View: <span className="text-emerald-400">{view === 'kano' ? 'Intra-Kano' : 'Inter-State'}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-lg p-3">
          <p className="text-slate-400 text-xs font-medium mb-2">Legend</p>
          <div className="space-y-1.5">
            {view === 'kano' ? (
              <>
                <div className="flex items-center gap-2"><circle className="flex-shrink-0" r="5" fill="#ef4444" /><span className="text-slate-300 text-xs">Hub (Municipal)</span></div>
                <div className="flex items-center gap-2"><circle className="flex-shrink-0" r="4" fill="#8b5cf6" /><span className="text-slate-300 text-xs">Metropolitan</span></div>
                <div className="flex items-center gap-2"><circle className="flex-shrink-0" r="3" fill="#3b82f6" /><span className="text-slate-300 text-xs">District LGA</span></div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2"><circle className="flex-shrink-0" r="5" fill="#ef4444" /><span className="text-slate-300 text-xs">Kano (Hub)</span></div>
                <div className="flex items-center gap-2"><circle className="flex-shrink-0" r="4" fill="#10b981" /><span className="text-slate-300 text-xs">North Central</span></div>
                <div className="flex items-center gap-2"><circle className="flex-shrink-0" r="4" fill="#f59e0b" /><span className="text-slate-300 text-xs">North East</span></div>
                <div className="flex items-center gap-2"><circle className="flex-shrink-0" r="4" fill="#3b82f6" /><span className="text-slate-300 text-xs">North West</span></div>
              </>
            )}
          </div>
        </div>

        <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-lg p-3 text-center">
          <p className="text-slate-500 text-xs mb-0.5">{view === 'kano' ? 'Total LGAs' : 'Coverage'}</p>
          <p className="text-white font-bold text-lg">{filteredData.length}</p>
          <p className="text-slate-600 text-xs mt-0.5">{view === 'kano' ? '44 Total' : '20 States'}</p>
        </div>
      </div>
    </div>
  );
};

export default KanoIntelligenceMap;