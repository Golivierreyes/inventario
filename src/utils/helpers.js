// src/utils/helpers.js
export const formatNumberForDisplay = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return '';
    return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatCurrencyBs = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return '';
    return `Bs ${num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatCurrencyUsd = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return '';
    return `$ ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// --- NUEVA FUNCIÓN ---
// Centraliza la lógica de permisos y le da poder absoluto al super_usuario
export const getEffectivePermissions = (user, rolePermissions) => {
    if (!user) return {};

    // El Super Usuario siempre tiene todos los permisos, sin importar la configuración.
    if (user.role === 'super_usuario') {
        return {
            canManageWarehouse: true,
            canManageSales: true,
            canViewReports: true,
            canAccessSettings: true,
            canDeleteSales: true,
            canManageUsers: true,
            canManagePermissions: true,
            canManageCategories: true,
            canManageDataTools: true,
            canChangeGeneralSettings: true,
            canViewUsers: true,
            canCreateUsers: true,
            canDeleteUsers: true,
        };
    }
    // Para otros roles, usa los permisos definidos en la base de datos.
    return rolePermissions[user.role] || {};
};
