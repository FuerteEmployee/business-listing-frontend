import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { LocateFixed } from 'lucide-react';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
}

export default function MapPicker({ value, onChange, marker, onMarkerPositionChange, serviceRadius = 0 }) {
    const defaultCenter = [19.0760, 72.8777]; // Mumbai
    
    // Support both old-style 'value' and new-style 'marker' props for backward compatibility
    const initialPos = marker?.lat && marker?.lng 
        ? marker 
        : (value?.lat && value?.lng ? { lat: value.lat, lng: value.lng } : null);
        
    const [position, setPosition] = useState(initialPos);

    useEffect(() => {
        if (position) {
            if (onChange) onChange({ lat: position.lat, lng: position.lng });
            if (onMarkerPositionChange) onMarkerPositionChange({ lat: position.lat, lng: position.lng });
        }
    }, [position]);

    const handleLocate = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setPosition(newPos);
            });
        }
    };

    return (
        <div className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden border border-slate-200">
            <MapContainer 
                center={position || defaultCenter} 
                zoom={13} 
                className="w-full h-full z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ChangeView center={position} />
                <LocationMarker position={position} setPosition={setPosition} />
                
                {position && serviceRadius > 0 && (
                    <Circle 
                        center={position} 
                        radius={serviceRadius * 1000} // Circle radius is in meters
                        pathOptions={{ 
                            fillColor: '#4f46e5', 
                            fillOpacity: 0.2, 
                            color: '#4f46e5', 
                            weight: 2,
                            dashArray: '5, 10'
                        }} 
                    />
                )}
            </MapContainer>

            <button
                type="button"
                onClick={handleLocate}
                className="absolute bottom-4 right-4 z-[400] bg-white p-2 rounded-lg shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors text-indigo-600"
                title="Detect My Location"
            >
                <LocateFixed className="w-5 h-5" />
            </button>
            
            {!position && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[401] flex items-center justify-center p-6 text-center">
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-xs">
                        <p className="text-sm font-bold text-slate-800 mb-2">Pin Your Business Location</p>
                        <p className="text-xs text-slate-500 mb-4">Click anywhere on the map to set your business coordinates or use the locate button.</p>
                        <button 
                            type="button"
                            onClick={() => setPosition(defaultCenter)}
                            className="text-xs font-black uppercase text-indigo-600 hover:text-indigo-700"
                        >
                            Start with Default
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
