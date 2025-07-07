// src/components/settings/EmployeePasswordChange.js
import React, { useState, useContext } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { AppContext } from '../../context/AppContext';
import { Eye, EyeOff } from 'lucide-react';

const EmployeePasswordChange = () => {
    const { db, showConfirmationModal, showNotification, currentThemeColors, rolePermissions, userRole, isAdminOverrideActive, setEmployeePassword } = useContext(AppContext);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id-local';
    
    const canChangePassword = isAdminOverrideActive || (userRole && rolePermissions[userRole]?.canAccessSettings);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!canChangePassword) {
            showNotification('No tienes permisos.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showNotification('La contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showNotification('Las contraseñas no coinciden.', 'error');
            return;
        }
        showConfirmationModal("Establecer Contraseña", "¿Establecer esta contraseña para el rol 'Empleado'?", async () => {
            try {
                const settingsDocRef = doc(db, `artifacts/${appId}/public/data/settings/app_settings`);
                await updateDoc(settingsDocRef, { employeePassword: newPassword });
                setEmployeePassword(newPassword);
                showNotification('Contraseña de Empleado establecida.', 'success');
                setNewPassword('');
                setConfirmPassword('');
            } catch (error) {
                showNotification('Error al establecer la contraseña.', 'error');
            }
        });
    };
    
    if (!canChangePassword) return null;

    return (
        <div className={`${currentThemeColors.cardBg} p-6 rounded-xl shadow-xl`}>
            <h3 className={`${currentThemeColors.textColor} text-2xl font-bold mb-4`}>Gestionar Contraseña del Rol "Empleado"</h3>
            <p className={`${currentThemeColors.textColor} text-sm mb-4`}>
                Esta contraseña es compartida por todos los usuarios que ingresan como "Empleado". Al cambiarla, se actualizará para todos.
            </p>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                 <div className="relative">
                    <label>Nueva Contraseña para Empleados:</label>
                    <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className={`w-full p-3 pr-10 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 pt-6"><Eye size={20}/></button>
                </div>
                <div className="relative">
                    <label>Confirmar Contraseña:</label>
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={`w-full p-3 pr-10 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 pt-6"><Eye size={20}/></button>
                </div>
                <button type="submit" className={`mt-2 p-3 ${currentThemeColors.buttonBg} rounded-lg`}>Establecer Contraseña de Empleado</button>
            </form>
        </div>
    );
};

export default EmployeePasswordChange;
