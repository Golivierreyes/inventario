// src/components/settings/SecuritySettingsTab.js
import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import StoreManagement from './StoreManagement';
import RolePermissionsManagement from './RolePermissionsManagement'; // <-- Se importa el componente de permisos

const SecuritySettingsTab = () => {
    const { user } = useContext(AppContext);

    if (user?.role !== 'super_usuario') {
        return <p>No tienes permisos para gestionar la seguridad.</p>
    }

    return (
        <div className="flex flex-col gap-8">
            <StoreManagement />
            {/* --- CORRECCIÓN: Se añade el componente aquí para que sea visible --- */}
            <RolePermissionsManagement />
        </div>
    );
};

export default SecuritySettingsTab;