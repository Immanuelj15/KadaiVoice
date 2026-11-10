import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Mic, Boxes, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const MobileBottomNav = () => {
  const { t } = useLanguage();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-surface-border px-3 py-2 flex items-center justify-around shadow-lg">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            isActive ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>{t('dashboard')}</span>
      </NavLink>

      <NavLink
        to="/sales"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            isActive ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`
        }
      >
        <ShoppingCart className="w-5 h-5" />
        <span>{t('sales')}</span>
      </NavLink>

      {/* Prominent Center Voice Button */}
      <NavLink
        to="/voice"
        className={({ isActive }) =>
          `-mt-5 flex flex-col items-center justify-center`
        }
      >
        <div className="w-13 h-13 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 border-4 border-white active:scale-95 transition-transform">
          <Mic className="w-6 h-6 animate-pulse" />
        </div>
        <span className="text-[10px] font-bold text-blue-600 mt-0.5">Voice AI</span>
      </NavLink>

      <NavLink
        to="/inventory"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            isActive ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`
        }
      >
        <Boxes className="w-5 h-5" />
        <span>{t('inventory')}</span>
      </NavLink>

      <NavLink
        to="/reports"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            isActive ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`
        }
      >
        <FileSpreadsheet className="w-5 h-5" />
        <span>{t('reports')}</span>
      </NavLink>
    </nav>
  );
};

export default MobileBottomNav;

