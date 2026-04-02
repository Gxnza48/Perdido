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

  useEffect(() => {
    const savedHistory = localStorage.getItem('perdido_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    const savedCar = localStorage.getItem('perdido_current_car');
    if (savedCar) setCarLocation(JSON.parse(savedCar));
    const savedTheme = localStorage.getItem('perdido_map_theme');
    if (savedTheme && savedTheme in MAP_THEMES) setMapTheme(savedTheme as MapThemeKey);
  }, []);

  const saveCarLocation = () => {
    if (userLocation) {
      const newLocation: SavedLocation = {
        id: Date.now().toString(),
        lat: userLocation[0],
        lng: userLocation[1],
        timestamp: Date.now(),
      };
      const updatedHistory = [newLocation, ...history.slice(0, 19)];
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

  useEffect(() => {
    if (activeSection !== 'settings') setSettingsSubPage('main');
  }, [activeSection]);

  const gpsStatus = userLocation
    ? { label: 'Activo', color: 'text-emerald-500', bg: 'bg-emerald-50', icon: <LocateFixed size={20} /> }
    : geoError
      ? { label: 'Denegado', color: 'text-red-500', bg: 'bg-red-50', icon: <MapPinOff size={20} /> }
      : { label: 'Esperando...', color: 'text-amber-500', bg: 'bg-amber-50', icon: <Globe size={20} /> };

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-slate-50 text-slate-900 font-body overflow-hidden">

      {/* ─── HEADER (Static, not fixed) ─── */}
      <header className="flex-shrink-0 flex justify-between items-center px-4 sm:px-6 py-3 bg-white border-b border-slate-200 z-50">
        <div className="flex items-center gap-2">
          {activeSection === 'settings' && settingsSubPage !== 'main' ? (
            <button onClick={() => setSettingsSubPage('main')} className="p-1 mr-1 text-slate-500 active:text-slate-700">
              <ChevronLeft size={28} />
            </button>
          ) : (
            <div className="bg-primary p-2 rounded-xl text-white shadow-md shadow-primary/20">
              <Car className="w-5 h-5" />
            </div>
          )}
          <h1 className="text-lg font-black tracking-tighter italic text-slate-800 font-headline">
            {activeSection === 'settings' && settingsSubPage === 'themes' ? 'Tema del Mapa' :
             activeSection === 'settings' && settingsSubPage === 'privacy' ? 'Privacidad' : 'Perdido'}
          </h1>
        </div>
        <div className="flex gap-2">
          {activeSection === 'history' && history.length > 0 && (
            <button onClick={clearHistory} className="p-2 text-red-500 active:bg-red-50 rounded-full transition-colors" title="Borrar historial">
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </header>

      {/* ─── MAIN SCROLLABLE CONTENT ─── */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto w-full px-4 py-4 pb-28 flex flex-col gap-4">

          {/* ════════ MAP SECTION ════════ */}
          {activeSection === 'map' && (
            <>
              {/* Map Card — responsive height: shorter on phones */}
              <div className="w-full h-[45vh] sm:h-[55vh] bg-white rounded-3xl shadow-xl border-2 border-white overflow-hidden relative">
                <div className="absolute inset-0 z-0">
                  <MapComponent 
                    userLocation={userLocation} 
                    carLocation={carLocation ? { lat: carLocation.lat, lng: carLocation.lng } : null} 
                    recenterToggle={recenterToggle}
                    mapTheme={mapTheme}
                  />
                </div>
                
                {/* Recenter */}
                <div className="absolute bottom-4 right-4 z-10">
                  <button 
                    onClick={() => setRecenterToggle(prev => prev + 1)}
                    className="p-3 bg-white rounded-full shadow-xl active:scale-90 transition-all border border-slate-100"
                  >
                    <LocateFixed className="text-primary w-5 h-5" />
                  </button>
                </div>

                {/* Status badge */}
                {carLocation && (
                  <div className="absolute top-4 left-4 z-10">
                    <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Auto guardado</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Action Panel ─── */}
              {!carLocation ? (
                /* Empty State */
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Car className="text-slate-300 w-8 h-8" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-headline font-black text-slate-800 mb-1 tracking-tight">
                    No guardaste nada <span className="text-primary italic">maestro</span>.
                  </h2>
                  <p className="text-slate-400 font-medium text-sm mb-5">
                    ¿Dejaste el auto en doble fila o te olvidaste?
                  </p>
                  <button 
                    onClick={saveCarLocation}
                    className="w-full min-h-[56px] bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/25 active:scale-[0.97] transition-all flex items-center justify-center gap-3"
                  >
                    <Bookmark size={22} fill="currentColor" />
                    GUARDAR AUTO
                  </button>
                </div>
              ) : (
                /* Saved State */
                <div className="flex flex-col gap-3">
                  {/* Time info */}
                  <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Estacionado</p>
                        <p className="text-lg font-headline font-black text-slate-800 leading-tight">{timeAgo}</p>
                      </div>
                    </div>
                    <button onClick={deleteCurrentLocation} className="p-3 text-red-400 active:bg-red-50 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <Trash2 size={20} />
                    </button>
                  </div>

                  {/* Navigate button */}
                  <button 
                    onClick={() => goToLocation(carLocation.lat, carLocation.lng)}
                    className="w-full min-h-[56px] bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/25 active:scale-[0.97] transition-all flex items-center justify-center gap-3"
                  >
                    <Navigation size={22} fill="currentColor" />
                    IR AL AUTO
                  </button>

                  {/* Update location */}
                  <button 
                    onClick={saveCarLocation}
                    className="w-full min-h-[48px] bg-white text-slate-600 border-2 border-slate-200 rounded-2xl font-bold text-base active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={18} />
                    Actualizar ubicación
                  </button>
                </div>
              )}
            </>
          )}

          {/* ════════ HISTORY SECTION ════════ */}
          {activeSection === 'history' && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-end mb-1">
                <h2 className="text-2xl font-headline font-black text-slate-800 tracking-tight">Historial</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{history.length} guardados</p>
              </div>
              
              {history.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-slate-200">
                  <HistoryIcon size={40} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-slate-400 font-bold text-sm">No tenés historial, estás re limpio.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {history.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0">
                          <MapPin size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">
                            {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: es })}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            {item.lat.toFixed(5)}, {item.lng.toFixed(5)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <button 
                          onClick={() => goToLocation(item.lat, item.lng)}
                          className="p-3 bg-primary/5 text-primary rounded-xl active:bg-primary active:text-white transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          <Navigation size={16} />
                        </button>
                        <button 
                          onClick={() => deleteHistoryItem(item.id)}
                          className="p-3 text-slate-300 active:text-red-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          <Trash2 size={16} />
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
              {/* Main Menu */}
              {settingsSubPage === 'main' && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-2xl font-headline font-black text-slate-800 tracking-tight">Ajustes</h2>
                  
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                    <button 
                      onClick={() => setSettingsSubPage('themes')}
                      className="w-full p-4 flex items-center justify-between active:bg-slate-50 transition-colors border-b border-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                          <Layers size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-800 text-sm">Tema del mapa</p>
                          <p className="text-xs text-slate-400">Actual: {MAP_THEMES[mapTheme].name}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300" />
                    </button>
                    <button 
                      onClick={() => setSettingsSubPage('privacy')}
                      className="w-full p-4 flex items-center justify-between active:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                          <ShieldCheck size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-800 text-sm">Privacidad</p>
                          <p className="text-xs text-slate-400">GPS y permisos</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300" />
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                    <button 
                      onClick={clearAllData}
                      className="w-full p-4 flex items-center justify-between active:bg-red-50 transition-colors text-red-500"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                          <Trash2 size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm">Borrar todos los datos</p>
                          <p className="text-xs opacity-60">Ubicación, historial y preferencias</p>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="p-6 text-center bg-slate-900 rounded-2xl text-white mt-2 relative overflow-hidden">
                    <h3 className="text-xl font-black italic tracking-tighter">Perdido</h3>
                    <p className="text-slate-400 text-xs mt-1">v1.0.0 — Todo en tu navegador.</p>
                    <Car size={80} className="absolute -bottom-6 -right-6 text-white/5 rotate-12" />
                  </div>
                </div>
              )}

              {/* Themes Sub-Page */}
              {settingsSubPage === 'themes' && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-slate-400">Elegí cómo se ve el mapa. Se guarda automáticamente.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.entries(MAP_THEMES) as [MapThemeKey, typeof MAP_THEMES[MapThemeKey]][]).map(([key, theme]) => (
                      <button
                        key={key}
                        onClick={() => changeMapTheme(key)}
                        className={`relative rounded-2xl overflow-hidden border-3 transition-all active:scale-95 ${
                          mapTheme === key 
                            ? 'border-primary shadow-lg shadow-primary/20' 
                            : 'border-white shadow-sm'
                        }`}
                      >
                        <div className={`aspect-[4/3] ${theme.preview} flex items-center justify-center`}>
                          <MapIcon size={28} className={key === 'dark' || key === 'satellite' ? 'text-white/30' : 'text-slate-300'} />
                        </div>
                        <div className="bg-white p-2.5 flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800">{theme.name}</span>
                          {mapTheme === key && (
                            <div className="bg-primary text-white p-0.5 rounded-full">
                              <Check size={12} />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Mini preview */}
                  <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-white h-36">
                    <MapComponent 
                      userLocation={userLocation} 
                      carLocation={carLocation ? { lat: carLocation.lat, lng: carLocation.lng } : null}
                      mapTheme={mapTheme}
                    />
                  </div>
                </div>
              )}

              {/* Privacy Sub-Page */}
              {settingsSubPage === 'privacy' && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-slate-400">Info sobre cómo usamos tu ubicación.</p>

                  {/* GPS Status */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 ${gpsStatus.bg} rounded-xl flex items-center justify-center ${gpsStatus.color}`}>
                        {gpsStatus.icon}
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">GPS</p>
                        <p className={`text-xl font-headline font-black ${gpsStatus.color}`}>{gpsStatus.label}</p>
                      </div>
                    </div>

                    {userLocation && (
                      <div className="bg-slate-50 rounded-xl p-3 mb-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Posición actual</p>
                        <p className="font-mono text-xs text-slate-600">
                          {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
                        </p>
                      </div>
                    )}

                    {geoError && (
                      <div className="bg-red-50 rounded-xl p-3 flex items-start gap-2">
                        <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-red-700 text-xs">Permiso denegado</p>
                          <p className="text-red-500 text-[11px] mt-0.5">Habilitá GPS en la config del navegador.</p>
                        </div>
                      </div>
                    )}

                    {!userLocation && !geoError && (
                      <div className="bg-amber-50 rounded-xl p-3 flex items-start gap-2">
                        <Globe size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-amber-700 text-xs">Esperando GPS...</p>
                          <p className="text-amber-500 text-[11px] mt-0.5">Aceptá el permiso cuando te lo pida el navegador.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Privacy Info */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-50">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck size={16} className="text-emerald-500" />
                        <p className="font-bold text-slate-800 text-sm">100% local</p>
                      </div>
                      <p className="text-xs text-slate-500">Tu ubicación se guarda solo en tu navegador. No mandamos nada a ningún servidor.</p>
                    </div>
                    <div className="p-4 border-b border-slate-50">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPinOff size={16} className="text-indigo-500" />
                        <p className="font-bold text-slate-800 text-sm">Sin rastreo</p>
                      </div>
                      <p className="text-xs text-slate-500">No usamos analytics, cookies de terceros, ni rastreo.</p>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Trash2 size={16} className="text-red-400" />
                        <p className="font-bold text-slate-800 text-sm">Borrado total</p>
                      </div>
                      <p className="text-xs text-slate-500">Podés borrar todo desde Ajustes → "Borrar todos los datos".</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* ─── BOTTOM NAV (Safe from content overlap) ─── */}
      <nav className="flex-shrink-0 bg-white border-t border-slate-200 px-4 pb-[env(safe-area-inset-bottom)] z-50">
        <div className="max-w-lg mx-auto flex justify-around items-center py-2">
          <button 
            onClick={() => setActiveSection('map')}
            className={`flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-all min-w-[64px] min-h-[48px] ${
              activeSection === 'map' ? 'bg-primary text-white shadow-md' : 'text-slate-400 active:text-slate-600'
            }`}
          >
            <MapIcon size={22} />
            <span className="text-[9px] font-black uppercase tracking-wider">Mapa</span>
          </button>
          <button 
            onClick={() => setActiveSection('history')}
            className={`flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-all min-w-[64px] min-h-[48px] ${
              activeSection === 'history' ? 'bg-primary text-white shadow-md' : 'text-slate-400 active:text-slate-600'
            }`}
          >
            <HistoryIcon size={22} />
            <span className="text-[9px] font-black uppercase tracking-wider">Historial</span>
          </button>
          <button 
            onClick={() => setActiveSection('settings')}
            className={`flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-all min-w-[64px] min-h-[48px] ${
              activeSection === 'settings' ? 'bg-primary text-white shadow-md' : 'text-slate-400 active:text-slate-600'
            }`}
          >
            <SettingsIcon size={22} />
            <span className="text-[9px] font-black uppercase tracking-wider">Ajustes</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
