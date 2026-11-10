import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Mic,
  ShoppingCart,
  Boxes,
  Package,
  Users,
  CreditCard,
  FileSpreadsheet,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Store,
  Radio,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { t } = useLanguage();
  const { user, shop, logout } = useAuth();

  const navItems = [
    { name: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('voiceAssistant'), path: '/voice', icon: Mic, badge: 'AI Core', badgeColor: 'bg-blue-600 text-white' },
    { name: 'Counter Soundbox', path: '/soundbox', icon: Radio, badge: 'Live Box', badgeColor: 'bg-emerald-100 text-emerald-800' },
    { name: t('sales'), path: '/sales', icon: ShoppingCart },
    { name: t('inventory'), path: '/inventory', icon: Boxes },
    { name: t('products'), path: '/products', icon: Package },
    { name: t('customers'), path: '/customers', icon: Users },
    { name: t('creditManagement'), path: '/credit', icon: CreditCard },
    { name: t('reports'), path: '/reports', icon: FileSpreadsheet },
    { name: t('aiInsights'), path: '/insights', icon: Sparkles, badge: 'Smart' },
    { name: t('settings'), path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-surface-border flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-surface-border shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 tracking-tight text-base leading-tight">
                  KadaiVoice <span className="text-blue-600">AI</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium truncate max-w-[130px]">
                  {shop?.name || 'Local Store'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.name}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        item.badgeColor || 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* User Profile & Logout Footer */}
        <div className="p-3 border-t border-surface-border bg-slate-50/50 shrink-0">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-surface-border/80 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-slate-800 truncate leading-tight">
                    {user?.name || 'Shop Owner'}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate capitalize">
                    {shop?.businessType || 'Retail Store'}
                  </span>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
