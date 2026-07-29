import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix Leaflet's default icon path issues with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// Component to dynamically adjust map view based on markers
function MapUpdater({ businesses, city }) {
    const map = useMap();
    
    useEffect(() => {
        if (businesses && businesses.length > 0) {
            const lats = businesses.map(b => b.latitude).filter(l => l !== undefined && l !== null);
            const lngs = businesses.map(b => b.longitude).filter(l => l !== undefined && l !== null);
            
            if (lats.length > 0 && lngs.length > 0) {
                const bounds = L.latLngBounds(lats.map((lat, i) => [lat, lngs[i]]));
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                return;
            }
        }
        
        // If no businesses have coordinates, or no businesses, fallback to city roughly
        if (city && city.name) {
             // We'll just center on a default if no businesses.
             map.setView([19.0760, 72.8777], 10); // Default to Mumbai roughly if no data
        }
    }, [businesses, city, map]);

    return null;
}

export default function MapComponent({ businesses, selectedCity }) {
    // Default center
    const defaultCenter = [19.0760, 72.8777];
    
    return (
        <MapContainer center={defaultCenter} zoom={11} className="w-full h-full z-0" style={{ minHeight: '100%', minWidth: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater businesses={businesses} city={selectedCity} />
            
            {businesses.map((biz) => {
                if (biz.latitude !== undefined && biz.longitude !== undefined && biz.latitude !== null && biz.longitude !== null) {
                    return (
                        <Marker key={biz._id} position={[biz.latitude, biz.longitude]}>
                            <Popup>
                                <div className="p-1 min-w-[200px]">
                                    <h3 className="font-bold text-sm mb-1">{biz.name}</h3>
                                    <p className="text-xs text-slate-500 mb-2">{biz.address}</p>
                                    <div className="flex items-center gap-1 text-xs mb-2">
                                        <span className="bg-green-100 text-green-700 px-1 py-0.5 rounded font-bold">{biz.rating || 'New'}</span>
                                        <span className="text-slate-400">({biz.reviewCount || 0} reviews)</span>
                                    </div>
                                    <a href={`/business/${biz.slug}`} className="text-xs text-orange-600 font-bold block" target="_blank" rel="noopener noreferrer">View Details</a>
                                </div>
                            </Popup>
                        </Marker>
                    );
                }
                return null;
            })}
        </MapContainer>
    );
}
