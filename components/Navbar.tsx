
import React from 'react';
import { Page } from '../types';

interface NavButtonProps {
    label: string;
    page: Page;
    activePage: Page;
    onClick: (page: Page) => void;
}

const NavButton: React.FC<NavButtonProps> = ({ label, page, activePage, onClick }) => {
    const isActive = activePage === page;
    const activeClasses = 'bg-blue-600 text-white font-medium';
    const inactiveClasses = 'text-slate-300 hover:bg-blue-900 hover:text-white';

    return (
        <button
            onClick={() => onClick(page)}
            className={`px-3 py-2 rounded-lg text-sm transition-all duration-300 ease-in-out ${isActive ? activeClasses : inactiveClasses}`}
        >
            {label}
        </button>
    );
};


interface NavbarProps {
    activePage: Page;
    onNavigate: (page: Page) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate }) => {
    const navItems = [
        { label: 'Inicio', page: Page.Home },
        { label: 'Planificar Inmersión', page: Page.Planner },
        { label: 'Mapas e Ideas', page: Page.Map },
        { label: 'Presupuesto', page: Page.Budget },
    ];
    
    return (
        <nav className="bg-blue-950/70 backdrop-blur-sm shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0 flex items-center">
                        <span className="text-2xl font-bold text-white">Planificador de Buceo</span>
                    </div>
                    <div className="hidden sm:block sm:ml-6">
                        <div className="flex space-x-4">
                            {navItems.map(item => (
                                <NavButton key={item.page} {...item} activePage={activePage} onClick={onNavigate} />
                            ))}
                        </div>
                    </div>
                     <div className="sm:hidden">
                        <select 
                            onChange={(e) => onNavigate(e.target.value as Page)} 
                            value={activePage}
                            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        >
                             {navItems.map(item => (
                                <option key={item.page} value={item.page}>{item.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
