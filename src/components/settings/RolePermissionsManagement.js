// src/components/settings/RolePermissionsManagement.js
import React, { useContext, useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { AppContext } from '../../context/AppContext';

const RolePermissionsManagement = () => {
    const { db, rolePermissions: globalPermissions, setRolePermissions: setGlobalPermissions, user, showConfirmationModal, showNotification, currentThemeColors } = useContext(AppContext);
    
    const [localPermissions, setLocalPermissions] = useState(globalPermissions);
    const [selectedRoleToManage, setSelectedRoleToManage] = useState('administrador');

    useEffect(() => {
        setLocalPermissions(globalPermissions);
    }, [globalPermissions]);

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id-local';
    
    // --- CORRECCIÓN CLAVE ---
    // Se añade una comprobación para esperar a que el objeto 'user' esté cargado.
    if (!user) {
        return <p className="text-center">Cargando datos de usuario...</p>;
    }
    
    // Esta lógica ahora se ejecutará solo cuando 'user' exista.
    const isEditingDisabled = user.role !== 'super_usuario';

    const handlePermissionChange = (role, permission, value) => {
        setLocalPermissions(prev => ({
            ...prev,
            [role]: { ...prev[role], [permission]: value }
        }));
    };

    const handleSavePermissions = () => {
        showConfirmationModal(
            "Guardar Permisos",
            "¿Estás seguro de guardar estos cambios en los permisos?",
            async () => {
                try {
                    const rolePermissionsDocRef = doc(db, `artifacts/${appId}/public/data/role_permissions/default_permissions`);
                    await setDoc(rolePermissionsDocRef, localPermissions, { merge: true });
                    setGlobalPermissions(localPermissions);
                    showNotification('Permisos actualizados exitosamente.', 'success');
                } catch (error) {
                    console.error("Error updating permissions:", error);
                    showNotification('Error al actualizar permisos.', 'error');
                }
            }
        );
    };

    const permissionLabels = {
        canManageWarehouse: 'Gestionar Almacén',
        canManageSales: 'Gestionar Ventas',
        canViewReports: 'Ver Informes',
        canAccessSettings: 'Acceder a Configuración',
        canDeleteSales: 'Eliminar Ventas',
        canManageUsers: 'Gestionar Usuarios',
        canManagePermissions: 'Gestionar Permisos',
        canManageCategories: 'Gestionar Categorías',
        canManageDataTools: 'Herramientas de Datos',
        canChangeGeneralSettings: 'Cambiar Config. General'
    };

    return (
        <div className={`${currentThemeColors.cardBg} p-6 rounded-xl shadow-xl`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`${currentThemeColors.textColor} text-2xl font-bold`}>Gestión de Permisos por Rol</h3>
                <select 
                    value={selectedRoleToManage} 
                    onChange={(e) => setSelectedRoleToManage(e.target.value)}
                    className={`p-2 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`}
                    disabled={isEditingDisabled}
                >
                    {Object.keys(localPermissions).filter(role => role !== 'super_usuario').map(role => (
                        <option key={role} value={role} className="capitalize">{role}</option>
                    ))}
                </select>
            </div>

            {selectedRoleToManage && localPermissions[selectedRoleToManage] && (
                <div className={`transition-opacity duration-300 ${isEditingDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.keys(permissionLabels).map(permission => (
                            <div key={permission} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`${selectedRoleToManage}-${permission}`}
                                    checked={!!localPermissions[selectedRoleToManage][permission]}
                                    onChange={(e) => handlePermissionChange(selectedRoleToManage, permission, e.target.checked)}
                                    disabled={isEditingDisabled}
                                    className={`mr-2 h-5 w-5 ${currentThemeColors.buttonBg.replace('bg-', 'text-')} rounded focus:ring-0`}
                                />
                                <label htmlFor={`${selectedRoleToManage}-${permission}`} className={`${currentThemeColors.textColor} text-sm`}>{permissionLabels[permission] || permission}</label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button 
                onClick={handleSavePermissions} 
                disabled={isEditingDisabled}
                className={`w-full mt-6 px-6 py-3 ${currentThemeColors.buttonBg} ${currentThemeColors.textColor} text-lg font-semibold rounded-xl shadow-lg ${isEditingDisabled ? 'opacity-50 cursor-not-allowed' : currentThemeColors.buttonHover}`}
            >
                Guardar Permisos
            </button>
        </div>
    );
};

export default RolePermissionsManagement;
