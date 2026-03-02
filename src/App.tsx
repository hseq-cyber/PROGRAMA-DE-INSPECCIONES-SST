import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  ClipboardCheck, 
  AlertCircle, 
  Menu, 
  X,
  ChevronRight,
  LogOut,
  Settings,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './components/Dashboard';
import InspectionProgram from './components/InspectionProgram';
import InspectionForms from './components/InspectionForms';
import FindingsTracking from './components/FindingsTracking';
import SettingsModule from './components/Settings';

type Tab = 'dashboard' | 'program' | 'forms' | 'findings' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'program', label: 'Programa de Inspecciones', icon: Calendar },
    { id: 'forms', label: 'Formularios de Inspección', icon: ClipboardCheck },
    { id: 'findings', label: 'Seguimiento de Hallazgos', icon: AlertCircle },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-50`}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                M
              </div>
              <span className="font-bold text-xl tracking-tight">METALPREST SAS</span>
            </motion.div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-600 font-semibold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={22} />
              {isSidebarOpen && <span>{item.label}</span>}
              {activeTab === item.id && isSidebarOpen && (
                <motion.div 
                  layoutId="active-pill"
                  className="ml-auto"
                >
                  <ChevronRight size={16} />
                </motion.div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="w-full flex items-center gap-3 p-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
            <LogOut size={22} />
            {isSidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between z-40">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 capitalize">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p className="text-slate-500 text-sm">Bienvenido de nuevo, Inspector SST</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">METALPREST SAS</p>
                <p className="text-xs text-slate-500">hseq@metalprest.com.co</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold">
                AD
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'program' && <InspectionProgram />}
              {activeTab === 'forms' && <InspectionForms />}
              {activeTab === 'findings' && <FindingsTracking />}
              {activeTab === 'settings' && <SettingsModule />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
