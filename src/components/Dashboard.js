// src/components/Dashboard.js
import React, { useContext } from 'react';
import { Package, ShoppingCart, BarChart2, Settings } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import DashboardCard from './common/DashboardCard';
import { getEffectivePermissions } from '../utils/helpers';

const Dashboard = ({ setCurrentPage }) => {
    const { user, storeName, storeAddress, currentThemeColors, rolePermissions } = useContext(AppContext);
    const effectivePermissions = getEffectivePermissions(user, rolePermissions);

    return (
        <div className={`${currentThemeColors.cardBg} backdrop-filter backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-4xl text-center`}>
            <h2 className={`${currentThemeColors.textColor} text-4xl font-extrabold mb-6`}>Panel de Control de {storeName}</h2>
            <p className={`${currentThemeColors.textColor} text-lg mb-2`}>Bienvenido, {user?.username || 'Usuario'}.</p>
            <p className={`${currentThemeColors.textColor} text-md mb-8`}>Dirección: {storeAddress}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DashboardCard icon={<Package size={40} />} title="Almacén" description="Gestiona todos los productos de la tienda." onClick={() => setCurrentPage('warehouse')} disabled={!effectivePermissions.canManageWarehouse} />
                <DashboardCard icon={<ShoppingCart size={40} />} title="Ventas Diarias" description="Registra y visualiza las ventas del día." onClick={() => setCurrentPage('sales')} disabled={!effectivePermissions.canManageSales} />
                <DashboardCard icon={<BarChart2 size={40} />} title="Informes" description="Visualiza informes diarios, semanales y anuales." onClick={() => setCurrentPage('reports')} disabled={!effectivePermissions.canViewReports} />
                <DashboardCard icon={<Settings size={40} />} title="Configuración" description="Personaliza el nombre, logo, fondo y más." onClick={() => setCurrentPage('settings')} disabled={!effectivePermissions.canAccessSettings} />
            </div>
        </div>
    );
};

export default Dashboard;
