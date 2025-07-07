// src/components/settings/AdminSelfPasswordChange.js
import React, { useState, useContext } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { AppContext } from '../../context/AppContext';
import { Eye, EyeOff, Key } from 'lucide-react';

const AdminSelfPasswordChange = () => {
    const { db, user, showConfirmationModal, showNotification, currentThemeColors } = useContext(AppContext);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id-local';

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            showNotification('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showNotification('Las contraseñas nuevas no coinciden.', 'error');
            return;
        }

        try {
            // Verificar la contraseña actual del administrador que ha iniciado sesión
            const userDocRef = doc(db, `artifacts/${appId}/public/data/custom_users`, user.id);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists() && userDocSnap.data().password === currentPassword) {
                // La contraseña actual es correcta, proceder a actualizar
                showConfirmationModal("Cambiar Contraseña", "¿Estás seguro de que quieres cambiar tu contraseña?", async () => {
                    try {
                        await updateDoc(userDocRef, { password: newPassword });
                        showNotification('Tu contraseña ha sido actualizada exitosamente.', 'success');
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                    } catch (error) {
                        showNotification('Error al actualizar la contraseña.', 'error');
                    }
                });
            } else {
                showNotification('La contraseña actual es incorrecta.', 'error');
            }
        } catch (error) {
            console.error("Error al verificar la contraseña:", error);
            showNotification('Error al verificar tu contraseña.', 'error');
        }
    };

    return (
        <div className={`${currentThemeColors.cardBg} p-6 rounded-xl shadow-xl`}>
            <h3 className={`${currentThemeColors.textColor} text-2xl font-bold mb-4`}>Cambiar mi Contraseña</h3>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                <div className="relative">
                    <label>Contraseña Actual:</label>
                    <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={`w-full p-3 pr-10 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} required />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 pt-6"><Eye size={20}/></button>
                </div>
                <div className="relative">
                    <label>Nueva Contraseña:</label>
                    <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className={`w-full p-3 pr-10 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} required />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 pt-6"><Eye size={20}/></button>
                </div>
                <div className="relative">
                    <label>Confirmar Nueva Contraseña:</label>
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={`w-full p-3 pr-10 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} required />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 pt-6"><Eye size={20}/></button>
                </div>
                <button type="submit" className={`mt-2 p-3 ${currentThemeColors.buttonBg} rounded-lg flex items-center justify-center`}>
                    <Key size={20} className="mr-2" /> Cambiar Contraseña
                </button>
            </form>
        </div>
    );
};

export default AdminSelfPasswordChange;