import { Phone, MapPin } from 'lucide-react';
import { useState } from 'react';

function SOSButton() {
  const [isPressed, setIsPressed] = useState(false);

  const handleSOSClick = () => {
    setIsPressed(true);
    setTimeout(() => {
      alert('Emergency services contacted! Help is on the way.');
      setIsPressed(false);
    }, 1000);
  };

  return (
    <div className="fixed bottom-10 right-10 flex flex-col items-end gap-6 z-50">
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 p-4 border border-white/50 dark:border-slate-700">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <MapPin className="w-4 h-4 text-emerald-500 animate-bounce" />
          <span>Location active</span>
        </div>
      </div>

      <button
        onClick={handleSOSClick}
        className={`bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-full p-6 shadow-2xl shadow-red-500/30 transition-all duration-300 ${isPressed ? 'scale-95' : 'hover:scale-110'
          } group relative flex items-center justify-center`}
        aria-label="Emergency SOS"
      >
        <Phone className="w-8 h-8 relative z-10" />
        {/* Ripple effect rings */}
        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping duration-1000"></div>
        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping duration-1000 delay-300"></div>

        <span className="absolute right-[calc(100%+1.5rem)] bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 whitespace-nowrap shadow-xl">
          Emergency SOS
        </span>
      </button>
    </div>
  );
}

export default SOSButton;
