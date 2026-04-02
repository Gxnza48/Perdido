import React, { useState, useEffect } from 'react';
import { useGeolocation } from './hooks/useGeolocation';
import MapComponent from './components/MapComponent';
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
  Info,
  Layers,
  Map as MapIcon,
  RefreshCw,
  MoreVertical
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SavedLocation {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
  address?: string;
}

type Section = 'map' | 'history' | 'settings';

const App: React.FC = () => {
  const { location: userLocation } = useGeolocation();
  const [activeSection, setActiveSection] = useState<Section>('map');
  const [history, setHistory] = useState<SavedLocation[]>([]);
  const [carLocation, setCarLocation] = useState<SavedLocation | null>(null);
  const [recenterToggle, setRecenterToggle] = useState(0);

  // Load data from LocalStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('perdido_history');
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      setHistory(parsedHistory);
      // Last one is the current car location if it exists
      const savedCar = localStorage.getItem('perdido_current_car');
      if (savedCar) {
        setCarLocation(JSON.parse(savedCar));
      }
    }
  }, []);

  const saveCarLocation = () => {
    console.log('Save triggered. User Location:', userLocation);
    if (userLocation) {
      const newLocation: SavedLocation = {
        id: Date.now().toString(),
        lat: userLocation[0],
        lng: userLocation[1],
        timestamp: Date.now(),
      };
      
      const updatedHistory = [newLocation, ...history.slice(0, 9)];
      console.log('Updating history:', updatedHistory);
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
    if (confirm('¿Vas a borrar todo el historial? Mirá que no vuelve más, che.')) {
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

  const goToLocation = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  const timeAgo = carLocation ? formatDistanceToNow(carLocation.timestamp, { addSuffix: true, locale: es }) : '';

  return (
    <div className="min-h-screen w-screen flex flex-col bg-slate-50 text-slate-900 font-body overflow-x-hidden transition-colors duration-300">
      
      {/* Dynamic Header */}
      <header className="fixed top-0 w-full flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 z-[1000]">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20">
             <Car className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-tighter italic text-slate-800 font-headline">Perdido</h1>
        </div>
        <div className="flex gap-2">
           {activeSection === 'history' && history.length > 0 && (
             <button onClick={clearHistory} className="p-2 text-error hover:bg-error/5 rounded-full transition-colors">
               <Trash2 size={20} />
             </button>
           )}
           <button 
            onClick={() => setActiveSection(activeSection === 'settings' ? 'map' : 'settings')}
            className={`p-2 rounded-full transition-all ${activeSection === 'settings' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
           >
            <SettingsIcon size={24} />
          </button>
        </div>
      </header>

      {/* Main Sections */}
      <main className="flex-grow flex flex-col pt-20 pb-32 max-w-2xl mx-auto w-full px-4 gap-6">
        
        {/* MAP SECTION */}
        {activeSection === 'map' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* The "Recuadro" Map Card */}
            <div className="w-full aspect-[4/5] bg-white rounded-[2.5rem] shadow-2xl border-6 border-white overflow-hidden relative group">
              <div className="absolute inset-0 z-0">
                <MapComponent 
                  userLocation={userLocation} 
                  carLocation={carLocation ? { lat: carLocation.lat, lng: carLocation.lng } : null} 
                  recenterToggle={recenterToggle}
                />
              </div>
              
              {/* Floating Map Actions */}
              <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-3">
                <button 
                  onClick={() => setRecenterToggle(prev => prev + 1)}
                  className="p-4 bg-white rounded-full shadow-2xl active:scale-90 transition-all border border-slate-100"
                >
                  <MapPin className="text-primary w-6 h-6" />
                </button>
              </div>


               {/* Top Status Overlay */}
               {carLocation && (
                 <div className="absolute top-6 left-6 z-10">
                   <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2 border border-white/50">
                     <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                     <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tengo el dato</span>
                   </div>
                 </div>
               )}
            </div>

            {/* Main Action Panel */}
            <div className="flex flex-col gap-4">
              {!carLocation ? (
                <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 text-center relative overflow-hidden group">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Car className="text-slate-400 w-10 h-10 opacity-60" />
                  </div>
                  <h2 className="text-4xl font-headline font-black text-slate-800 mb-2 tracking-tight">
                    No guardaste nada <span className="text-primary italic">maestro</span>.
                  </h2>
                  <p className="text-slate-500 font-medium mb-8 max-w-xs mx-auto">
                    ¿Dejaste el auto en doble fila o simplemente te olvidaste?
                  </p>
                  <button 
                    onClick={saveCarLocation}
                    className="w-full h-20 bg-primary text-white rounded-3xl font-black text-xl shadow-2xl shadow-primary/30 active:scale-[0.97] transition-all flex items-center justify-center gap-4 group"
                  >
                    <Bookmark size={28} className="group-hover:scale-110 transition-transform" fill="currentColor" />
                    <span>GUARDAR AUTO</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Status Card */}
                  <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-tertiary/10 rounded-2xl flex items-center justify-center text-tertiary">
                         <Clock size={28} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estacionado</p>
                        <p className="text-2xl font-headline font-black text-slate-800">{timeAgo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <button onClick={deleteCurrentLocation} className="p-3 text-error hover:bg-error/5 rounded-full transition-colors">
                         <Trash2 size={24} />
                       </button>
                    </div>
                  </div>

                  {/* Primary Navigation Button */}
                  <button 
                    onClick={() => goToLocation(carLocation.lat, carLocation.lng)}
                    className="w-full h-20 bg-primary text-white rounded-3xl font-black text-xl shadow-2xl shadow-primary/30 active:scale-[0.97] transition-all flex items-center justify-center gap-4 group"
                  >
                    <Navigation size={28} className="group-hover:rotate-12 transition-transform" fill="currentColor" />
                    <span>IR AL AUTO</span>
                  </button>

                  <button 
                    onClick={saveCarLocation}
                    className="w-full h-16 bg-white text-slate-700 border-3 border-slate-100 rounded-3xl font-bold text-lg shadow-sm active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={20} />
                    <span>Actualizar ubicación</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTORY SECTION */}
        {activeSection === 'history' && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
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
                  <div key={item.id} className="bg-white p-5 rounded-3xl shadow-md border border-slate-100 flex items-center justify-between group transition-all hover:shadow-lg">
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
                        className="p-3 bg-primary/5 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                      >
                        <Navigation size={18} />
                      </button>
                      <button 
                        onClick={() => deleteHistoryItem(item.id)}
                        className="p-3 text-slate-300 hover:text-error transition-colors"
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

        {/* SETTINGS SECTION */}
        {activeSection === 'settings' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-3xl font-headline font-black text-slate-800 tracking-tight">Ajustes</h2>
            
            <div className="flex flex-col gap-2">
              <div className="bg-white rounded-3xl shadow-md overflow-hidden border border-slate-100">
                 <button className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                          <Layers size={20} />
                       </div>
                       <div className="text-left">
                          <p className="font-bold text-slate-800">Tema del mapa</p>
                          <p className="text-xs text-slate-400">Seleccioná tu estilo visual</p>
                       </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                 </button>
                 <button className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                          <ShieldCheck size={20} />
                       </div>
                       <div className="text-left">
                          <p className="font-bold text-slate-800">Privacidad</p>
                          <p className="text-xs text-slate-400">Gestionar permisos de GPS</p>
                       </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                 </button>
              </div>

              <div className="bg-white rounded-3xl shadow-md overflow-hidden border border-slate-100">
                 <button className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors text-error">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-error/5 rounded-xl flex items-center justify-center">
                          <Trash2 size={20} />
                       </div>
                       <div className="text-left">
                          <p className="font-bold">Borrar todos los datos</p>
                          <p className="text-xs opacity-60">No se puede deshacer</p>
                       </div>
                    </div>
                 </button>
              </div>

              <div className="p-8 text-center bg-slate-900 rounded-[2.5rem] text-white mt-4 relative overflow-hidden group">
                 <div className="relative z-10">
                   <h3 className="text-2xl font-black mb-2 italic tracking-tighter">Perdido App</h3>
                   <p className="text-slate-400 text-sm mb-4">Versión 1.0.0 (Prototipo a Full)</p>
                   <div className="flex justify-center gap-4">
                      <div className="p-3 bg-white/10 rounded-2xl">
                         <Info size={20} className="text-white" />
                      </div>
                      <div className="p-3 bg-white/10 rounded-2xl">
                         <Car size={20} className="text-white" />
                      </div>
                   </div>
                 </div>
                 {/* Decorative background car */}
                 <Car size={120} className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Floating Navigation Nav (Fixed Bottom) */}
      <footer className="fixed bottom-0 w-full flex justify-center pb-8 z-[1000] pointer-events-none">
        <nav className="bg-white/90 backdrop-blur-xl shadow-2xl w-[90%] max-w-md rounded-[2rem] px-4 py-3 flex justify-between items-center pointer-events-auto border border-white/50">
          <button 
            onClick={() => setActiveSection('map')}
            className={`flex flex-col items-center gap-1.5 px-6 py-2 rounded-full transition-all duration-300 ${activeSection === 'map' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <MapIcon size={24} className={activeSection === 'map' ? 'animate-bounce-short' : ''} />
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

      {/* Signature Detail: Mate Progress Bar */}
      <div className="fixed bottom-0 left-0 w-full h-1.5 bg-slate-200 z-[1100]">
        <div className={`bg-primary h-full transition-all duration-700 ${carLocation ? 'w-1/2' : 'w-1/4'}`}>
          <div className="absolute right-0 -top-6">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>coffee_maker</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
