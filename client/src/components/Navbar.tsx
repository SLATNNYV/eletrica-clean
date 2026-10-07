import React from 'react';
import { Menu, Search, PlusCircle, Download, Calendar } from 'lucide-react';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  onOpenGlobalSearch: () => void;
  onNewWorkOrder: () => void;
  onBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileMenu,
  onOpenGlobalSearch,
  onNewWorkOrder,
  onBackup
}) => {
  // Format current date in Portuguese
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="h-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left side: Mobile menu toggle + Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          aria-label="Abrir Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Global Search Input Trigger */}
        <button
          onClick={onOpenGlobalSearch}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 hover:border-cyan-500/50 hover:text-slate-200 transition-all text-sm group"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          <span className="flex-1 text-left truncate">Pesquisar cliente, veículo, placa ou OS...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right side: Date, Backup, Quick New OS */}
      <div className="flex items-center gap-3">
        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs font-medium text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span className="capitalize">{todayFormatted}</span>
        </div>

        {/* Backup button */}
        <button
          onClick={onBackup}
          title="Fazer Backup do Banco de Dados"
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Backup</span>
        </button>

        {/* "+ Nova OS" Primary Action Button */}
        <button
          onClick={onNewWorkOrder}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
        >
          <PlusCircle className="w-4 h-4 fill-slate-950 text-cyan-400" />
          <span className="whitespace-nowrap">+ Nova OS</span>
        </button>
      </div>
    </header>
  );
};
