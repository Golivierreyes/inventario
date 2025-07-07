// src/components/Header.js
import React, { useContext } from 'react';
import { Home, Package, ShoppingCart, BarChart2, Settings, LogOut } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import NavLink from './common/NavLink';
import Notification from './common/Notification';
import { getEffectivePermissions } from '../utils/helpers';

const Header = ({ storeName, logoUrl, setCurrentPage, handleLogout, user, rolePermissions, notification }) => {
    const { currentThemeColors } = useContext(AppContext);
    const effectivePermissions = getEffectivePermissions(user, rolePermissions);

    return (
        <header className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg p-4 shadow-lg flex flex-col md:flex-row items-center justify-between rounded-b-xl relative">
            <div className="flex items-center mb-4 md:mb-0">
                <img src={logoUrl} alt="Logo de la Tienda" className="h-12 w-12 rounded-full mr-3 object-cover shadow-md" onError={(e) => e.target.src = 'https://placehold.co/100x100/A78BFA/FFFFFF?text=LOGO'} />
                <h1 className={`${currentThemeColors.textColor} text-3xl font-bold tracking-wide`}>{storeName}</h1>
            </div>
            <nav className="flex flex-wrap justify-center gap-3 md:gap-6">
                <NavLink icon={<Home size={20} />} text="Inicio" onClick={() => setCurrentPage('dashboard')} />
                <NavLink icon={<Package size={20} />} text="Almacén" onClick={() => setCurrentPage('warehouse')} disabled={!effectivePermissions.canManageWarehouse} />
                <NavLink icon={<ShoppingCart size={20} />} text="Ventas" onClick={() => setCurrentPage('sales')} disabled={!effectivePermissions.canManageSales} />
                <NavLink icon={<BarChart2 size={20} />} text="Informes" onClick={() => setCurrentPage('reports')} disabled={!effectivePermissions.canViewReports} />
                <NavLink icon={<Settings size={20} />} text="Configuración" onClick={() => setCurrentPage('settings')} disabled={!effectivePermissions.canAccessSettings} />
                <button onClick={handleLogout} className={`flex items-center px-4 py-2 ${currentThemeColors.dangerButtonBg} ${currentThemeColors.textColor} rounded-full shadow-md`}>
                    <LogOut size={20} className="mr-2" />
                    Cerrar Sesión
                </button>
            </nav>
            {notification && <Notification message={notification.message} type={notification.type} />}
        </header>
    );
};

export default Header;