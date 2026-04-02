import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapComponentProps {
  userLocation: [number, number] | null;
  carLocation: { lat: number; lng: number } | null;
  recenterToggle?: number;
}

// Separate component for Map Logic (to use useMap hook)
const MapLogic = ({ userLocation, recenterToggle }: { userLocation: [number, number] | null, recenterToggle?: number }) => {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.setView(userLocation, map.getZoom());
    }
  }, [userLocation, recenterToggle, map]);

  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ userLocation, carLocation, recenterToggle }) => {
  const defaultCenter: [number, number] = userLocation || [-34.6037, -58.3816];

  // Memoize icons to avoid re-creation on every render
  const userIcon = useMemo(() => new L.DivIcon({
    className: 'user-marker',
    html: '<div class="w-5 h-5 bg-blue-500 border-4 border-white rounded-full shadow-lg"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  }), []);

  const carMarkerIcon = useMemo(() => new L.DivIcon({
    className: 'car-marker-icon',
    html: `
      <div class="relative flex flex-col items-center">
        <div class="bg-indigo-600 p-3 rounded-full shadow-lg border-4 border-white transform scale-110">
          <span class="material-symbols-outlined text-white text-2xl" style="font-variation-settings: 'FILL' 1;">directions_car</span>
        </div>
        <div class="mt-1 bg-white px-2 py-0.5 rounded-full shadow-sm">
          <span class="text-[10px] font-bold text-indigo-800 uppercase tracking-tighter">Auto</span>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  }), []);

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={defaultCenter}
        zoom={16}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO'
        />

        <MapLogic userLocation={userLocation} recenterToggle={recenterToggle} />

        {userLocation && (
          <>
            <Circle
              center={userLocation}
              radius={20}
              pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.1, weight: 0 }}
            />
            <Marker position={userLocation} icon={userIcon} />
          </>
        )}

        {carLocation && (
          <Marker
            position={[carLocation.lat, carLocation.lng]}
            icon={carMarkerIcon}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
