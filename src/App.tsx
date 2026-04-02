import React, { useState, useEffect } from 'react';
import { useGeolocation } from './hooks/useGeolocation';
import MapComponent, { MAP_THEMES, MapThemeKey } from './components/MapComponent';
import { 
  Bookmark, 
  Navigation, 
  Trash2, 
  MapPin, 
  Car, 
  Settings as SettingsIcon, 
  Clock, 
  ShieldCheck, 
  History as HistoryIcon,
  ChevronRight,
  ChevronLeft,
  Info,
  Layers,
  Map as MapIcon,
  RefreshCw,
  MapPinOff,
  Check,
  AlertTriangle,
  LocateFixed,
  Globe
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SavedLocation {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
}

type Section = 'map' | 'history' | 'settings';
type SettingsSubPage = 'main' | 'themes' | 'privacy';

const App: React.FC = () => {
  const { location: userLocation, error: geoError } = useGeolocation();
  const [activeSection, setActiveSection] = useState<Section>('map');
  const [settingsSubPage, setSettingsSubPage] = useState<SettingsSubPage>('main');
  const [history, setHistory] = useState<SavedLocation[]>([]);
  const [carLocation, setCarLocation] = useState<SavedLocation | null>(null);
  const [recenterToggle, setRecenterToggle] = useState(0);
  const [mapTheme, setMapTheme] = useState<MapThemeKey>('light');

  // Load all data from LocalStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('perdido_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    const savedCar = localStorage.getItem('perdido_current_car');
    if (savedCar) {
      setCarLocation(JSON.parse(savedCar));
    }
    const savedTheme = localStorage.getItem('perdido_map_theme');
    if (savedTheme && savedTheme in MAP_THEMES) {
      setMapTheme(savedTheme as MapThemeKey);
    }
  }, []);

  const saveCarLocation = () => {
    if (userLocation) {
      const newLocation: SavedLocation = {
        id: Date.now().toString(),
        lat: userLocation[0],
        lng: userLocation[1],
        timestamp: Date.now(),
      };
      const updatedHistory = [newLocation, ...history.slice(0, 19)]; // Keep last 20
      setHistory(updatedHistory);
      setCarLocation(newLocation);
      localStorage.setItem('perdido_history', JSON.stringify(updatedHistory));
      localStorage.setItem('perdido_current_car', JSON.stringify(newLocation));
    } else {
      alert('Todavía no sabemos dónde estás, aguantá un toque.');
    }
  };

  const deleteCurrentLocation = () => {
    if (confirm('¿Seguro que querés borrar la ubicación actual?')) {
      setCarLocation(null);
      localStorage.removeItem('perdido_current_car');
    }
  };

  const clearHistory = () => {
    if (confirm('¿Borrar todo el historial? No vuelve más.')) {
      setHistory([]);
      localStorage.removeItem('perdido_history');
    }
  };

  const deleteHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('perdido_history', JSON.stringify(updated));
    if (carLocation?.id === id) {
      setCarLocation(null);
      localStorage.removeItem('perdido_current_car');
    }
  };

  const clearAllData = () => {
    if (confirm('⚠️ Esto borra TODO: ubicación actual, historial y preferencias. ¿Seguís?')) {
      setCarLocation(null);
      setHistory([]);
      setMapTheme('light');
      setSettingsSubPage('main');
      localStorage.removeItem('perdido_current_car');
      localStorage.removeItem('perdido_history');
      localStorage.removeItem('perdido_map_theme');
    }
  };

  const changeMapTheme = (theme: MapThemeKey) => {
    setMapTheme(theme);
    localStorage.setItem('perdido_map_theme', theme);
  };

  const goToLocation = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  const timeAgo = carLocation ? formatDistanceToNow(carLocation.timestamp, { addSuffix: true, locale: es }) : '';

  // Reset settings sub-page when navigating away
  useEffect(() => {
    if (activeSection !== 'settings') {
      setSettingsSubPage('main');
    }
  }, [activeSection]);

  // GPS status helpers
  const gpsStatus = userLocation
    ? { label: 'Activo', color: 'text-emerald-500', bg: 'bg-emerald-50', icon: <LocateFixed size={20} /> }
    : geoError
      ? { label: 'Denegado', color: 'text-red-500', bg: 'bg-red-50', icon: <MapPinOff size={20} /> }
      : { label: 'Esperando...', color: 'text-amber-500', bg: 'bg-amber-50', icon: <Globe size={20} /> };

  return (
    <div className="min-h-screen w-screen flex flex-col bg-slate-50 text-slate-900 font-body overflow-x-hidden">

      {/* Header */}
      <header className="fixed top-0 w-full flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 z-[1000]">
        <div className="flex items-center gap-2">
          {/* Back button for settings sub-pages */}
          {activeSection === 'settings' && settingsSubPage !== 'main' ? (
            <button onClick={() => setSettingsSubPage('main')} className="p-1 mr-1 text-slate-500 hover:text-slate-700">
              <ChevronLeft size={28} />
            </button>
          ) : (
            <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20">
              <Car className="w-6 h-6" />
            </div>
          )}
          <h1 className="text-xl font-black tracking-tighter italic text-slate-800 font-headline">
            {activeSection === 'settings' && settingsSubPage === 'themes' && 'Tema del Mapa'}
            {activeSection === 'settings' && settingsSubPage === 'privacy' && 'Privacidad'}
            {(activeSection !== 'settings' || settingsSubPage === 'main') && 'Perdido'}
          </h1>
        </div>
        <div className="flex gap-2">
          {activeSection === 'history' && history.length > 0 && (
            <button onClick={clearHistory} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Borrar historial">
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex flex-col pt-20 pb-32 max-w-2xl mx-auto w-full px-4 gap-6">
        
        {/* ════════ MAP SECTION ════════ */}
        {activeSection === 'map' && (
          <div className="flex flex-col gap-6">
            {/* Boxed Map */}
            <div className="w-full aspect-[4/5] bg-white rounded-[2.5rem] shadow-2xl border-4 border-white overflow-hidden relative">
              <div className="absolute inset-0 z-0">
                <MapComponent 
                  userLocation={userLocation} 
                  carLocation={carLocation ? { lat: carLocation.lat, lng: carLocation.lng } : null} 
                  recenterToggle={recenterToggle}
                  mapTheme={mapTheme}
                />
              </div>
              
              {/* Floating recenter */}
              <div className="absolute bottom-6 right-6 z-10">
                <button 
                  onClick={() => setRecenterToggle(prev => prev + 1)}
                  className="p-4 bg-white rounded-full shadow-2xl active:scale-90 transition-all border border-slate-100"
                  title="Recentrar"
                >
                  <LocateFixed className="text-primary w-6 h-6" />
                </button>
              </div>

              {/* Status badge */}
              {carLocation && (
                <div className="absolute top-6 left-6 z-10">
                  <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2 border border-white/50">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Auto guardado</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Panel */}
            <div className="flex flex-col gap-4">
              {!carLocation ? (
                <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 text-center relative overflow-hidden">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Car className="text-slate-400 w-10 h-10 opacity-60" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-headline font-black text-slate-800 mb-2 tracking-tight">
                    No guardaste nada <span className="text-primary italic">maestro</span>.
                  </h2>
                  <p className="text-slate-500 font-medium mb-8 max-w-xs mx-auto">
                    ¿Dejaste el auto en doble fila o simplemente te olvidaste?
                  </p>
                  <button 
                    onClick={saveCarLocation}
                    className="w-full h-20 bg-primary text-white rounded-3xl font-black text-xl shadow-2xl shadow-primary/30 active:scale-[0.97] transition-all flex items-center justify-center gap-4"
                  >
                    <Bookmark size={28} fill="currentColor" />
                    GUARDAR AUTO
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                        <Clock size={28} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estacionado</p>
                        <p className="text-2xl font-headline font-black text-slate-800">{timeAgo}</p>
                      </div>
                    </div>
                    <button onClick={deleteCurrentLocation} className="p-3 text-red-400 hover:bg-red-50 rounded-full transition-colors" title="Borrar">
                      <Trash2 size={24} />
                    </button>
                  </div>

                  <button 
                    onClick={() => goToLocation(carLocation.lat, carLocation.lng)}
                    className="w-full h-20 bg-primary text-white rounded-3xl font-black text-xl shadow-2xl shadow-primary/30 active:scale-[0.97] transition-all flex items-center justify-center gap-4"
                  >
                    <Navigation size={28} fill="currentColor" />
                    IR AL AUTO
                  </button>

                  <button 
                    onClick={saveCarLocation}
                    className="w-full h-16 bg-white text-slate-700 border-2 border-slate-200 rounded-3xl font-bold text-lg active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={20} />
                    Actualizar ubicación
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ HISTORY SECTION ════════ */}
        {activeSection === 'history' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end mb-2">
              <h2 className="text-3xl font-headline font-black text-slate-800 tracking-tight">Historial</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{history.length} guardados</p>
            </div>
            
            {history.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
                <HistoryIcon size={48} className="mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 font-bold">No tenés historial, estás re limpio.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-3xl shadow-md border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">
                          {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: es })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => goToLocation(item.lat, item.lng)}
                        className="p-3 bg-primary/5 text-primary rounded-xl hover:bg-primary hover:text-white transition-all"
                      >
                        <Navigation size={18} />
                      </button>
                      <button 
                        onClick={() => deleteHistoryItem(item.id)}
                        className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════ SETTINGS SECTION ════════ */}
        {activeSection === 'settings' && (
          <>
            {/* ─── Main Settings Menu ─── */}
            {settingsSubPage === 'main' && (
              <div className="flex flex-col gap-6">
                <h2 className="text-3xl font-headline font-black text-slate-800 tracking-tight">Ajustes</h2>
                
                <div className="flex flex-col gap-2">
                  {/* Theme Button */}
                  <div className="bg-white rounded-3xl shadow-md overflow-hidden border border-slate-100">
                    <button 
                      onClick={() => setSettingsSubPage('themes')}
                      className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                          <Layers size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-800">Tema del mapa</p>
                          <p className="text-xs text-slate-400">Actual: {MAP_THEMES[mapTheme].name}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300" />
                    </button>

                    {/* Privacy Button */}
                    <button 
                      onClick={() => setSettingsSubPage('privacy')}
                      className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                          <ShieldCheck size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-800">Privacidad</p>
                          <p className="text-xs text-slate-400">GPS y permisos</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300" />
                    </button>
                  </div>

                  {/* Delete All Data */}
                  <div className="bg-white rounded-3xl shadow-md overflow-hidden border border-slate-100">
                    <button 
                      onClick={clearAllData}
                      className="w-full p-6 flex items-center justify-between hover:bg-red-50 transition-colors text-red-500"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                          <Trash2 size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold">Borrar todos los datos</p>
                          <p className="text-xs opacity-60">Ubicación, historial y preferencias</p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* About Card */}
                  <div className="p-8 text-center bg-slate-900 rounded-[2.5rem] text-white mt-4 relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-2xl font-black mb-1 italic tracking-tighter">Perdido</h3>
                      <p className="text-slate-400 text-sm mb-3">v1.0.0</p>
                      <p className="text-slate-500 text-xs max-w-xs mx-auto">
                        Guardá dónde dejaste el auto. Sin backend, sin cuentas, todo en tu navegador.
                      </p>
                    </div>
                    <Car size={120} className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
                  </div>
                </div>
              </div>
            )}

            {/* ─── Map Themes Sub-Page ─── */}
            {settingsSubPage === 'themes' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-3xl font-headline font-black text-slate-800 tracking-tight">Tema del Mapa</h2>
                  <p className="text-sm text-slate-400 mt-1">Elegí cómo se ve el mapa. Se guarda automáticamente.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {(Object.entries(MAP_THEMES) as [MapThemeKey, typeof MAP_THEMES[MapThemeKey]][]).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => changeMapTheme(key)}
                      className={`relative rounded-3xl overflow-hidden border-4 transition-all active:scale-95 ${
                        mapTheme === key 
                          ? 'border-primary shadow-xl shadow-primary/20 scale-[1.02]' 
                          : 'border-white shadow-md hover:shadow-lg'
                      }`}
                    >
                      {/* Preview */}
                      <div className={`aspect-[4/3] ${theme.preview} flex items-center justify-center`}>
                        <MapIcon size={32} className={key === 'dark' || key === 'satellite' ? 'text-white/30' : 'text-slate-300'} />
                      </div>
                      {/* Label */}
                      <div className="bg-white p-3 flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-800">{theme.name}</span>
                        {mapTheme === key && (
                          <div className="bg-primary text-white p-1 rounded-full">
                            <Check size={14} />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Live preview mini-map */}
                <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-white h-48">
                  <MapComponent 
                    userLocation={userLocation} 
                    carLocation={carLocation ? { lat: carLocation.lat, lng: carLocation.lng } : null}
                    mapTheme={mapTheme}
                  />
                </div>
              </div>
            )}

            {/* ─── Privacy Sub-Page ─── */}
            {settingsSubPage === 'privacy' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-3xl font-headline font-black text-slate-800 tracking-tight">Privacidad</h2>
                  <p className="text-sm text-slate-400 mt-1">Info sobre cómo usamos tu ubicación.</p>
                </div>

                {/* GPS Status Card */}
                <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 ${gpsStatus.bg} rounded-2xl flex items-center justify-center ${gpsStatus.color}`}>
                      {gpsStatus.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estado del GPS</p>
                      <p className={`text-2xl font-headline font-black ${gpsStatus.color}`}>{gpsStatus.label}</p>
                    </div>
                  </div>

                  {/* Show coordinates if available */}
                  {userLocation && (
                    <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tu posición actual</p>
                      <p className="font-mono text-sm text-slate-700">
                        {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
                      </p>
                    </div>
                  )}

                  {/* Error message */}
                  {geoError && (
                    <div className="bg-red-50 rounded-2xl p-4 flex items-start gap-3 mb-4">
                      <AlertTriangle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-red-700 text-sm">Permiso denegado</p>
                        <p className="text-red-500 text-xs mt-1">
                          Tu navegador bloqueó el acceso a la ubicación. Andá a la config del navegador y habilitá GPS para este sitio.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* No location yet (pending) */}
                  {!userLocation && !geoError && (
                    <div className="bg-amber-50 rounded-2xl p-4 flex items-start gap-3 mb-4">
                      <Globe size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-amber-700 text-sm">Esperando GPS...</p>
                        <p className="text-amber-500 text-xs mt-1">
                          Si el navegador te pide permiso, aceptá para poder guardar la ubicación del auto.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Privacy Info Cards */}
                <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-50">
                    <div className="flex items-center gap-3 mb-2">
                      <ShieldCheck size={20} className="text-emerald-500" />
                      <p className="font-bold text-slate-800">100% local</p>
                    </div>
                    <p className="text-sm text-slate-500">
                      Tu ubicación se guarda ÚNICAMENTE en tu navegador (LocalStorage). No mandamos nada a ningún servidor.
                    </p>
                  </div>
                  <div className="p-6 border-b border-slate-50">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPinOff size={20} className="text-indigo-500" />
                      <p className="font-bold text-slate-800">Sin rastreo</p>
                    </div>
                    <p className="text-sm text-slate-500">
                      No usamos analytics, cookies de terceros, ni rastreo de ningún tipo. Tu ubicación es tuya.
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Trash2 size={20} className="text-red-400" />
                      <p className="font-bold text-slate-800">Borrado total</p>
                    </div>
                    <p className="text-sm text-slate-500">
                      Podés borrar todos los datos en cualquier momento desde Ajustes → "Borrar todos los datos".
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <footer className="fixed bottom-0 w-full flex justify-center pb-8 z-[1000] pointer-events-none">
        <nav className="bg-white/90 backdrop-blur-xl shadow-2xl w-[90%] max-w-md rounded-[2rem] px-4 py-3 flex justify-between items-center pointer-events-auto border border-white/50">
          <button 
            onClick={() => setActiveSection('map')}
            className={`flex flex-col items-center gap-1.5 px-6 py-2 rounded-full transition-all duration-300 ${activeSection === 'map' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <MapIcon size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Mapa</span>
          </button>
          <button 
            onClick={() => setActiveSection('history')}
            className={`flex flex-col items-center gap-1.5 px-6 py-2 rounded-full transition-all duration-300 ${activeSection === 'history' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <HistoryIcon size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Historial</span>
          </button>
          <button 
            onClick={() => setActiveSection('settings')}
            className={`flex flex-col items-center gap-1.5 px-6 py-2 rounded-full transition-all duration-300 ${activeSection === 'settings' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <SettingsIcon size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Ajustes</span>
          </button>
        </nav>
      </footer>
    </div>
  );
};

export default App;
