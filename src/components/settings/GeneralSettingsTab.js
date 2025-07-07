// src/components/settings/GeneralSettingsTab.js
import React, { useContext, useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { AppContext } from '../../context/AppContext';
import { Save } from 'lucide-react';
import { themeColors } from '../../constants/theme';
import { getEffectivePermissions } from '../../utils/helpers';

const GeneralSettingsTab = () => {
    const { 
        db, user, rolePermissions, showNotification, currentThemeColors, 
        exchangeRate, themePreference, setThemePreference 
    } = useContext(AppContext);

    const effectivePermissions = getEffectivePermissions(user, rolePermissions);
    
    // --- CORRECCIÓN: Los estados locales ahora son solo para la configuración de la tienda ---
    const [localTheme, setLocalTheme] = useState(themePreference);
    const [localExchangeRate, setLocalExchangeRate] = useState(exchangeRate);
    
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id-local';

    useEffect(() => {
        setLocalTheme(themePreference);
        setLocalExchangeRate(exchangeRate);
    }, [themePreference, exchangeRate]);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        
        if (user?.role !== 'administrador' || !user.storeId) {
            showNotification('Solo los administradores de tienda pueden cambiar esta configuración.', 'error');
            return;
        }

        // --- CORRECCIÓN CLAVE: Guardar solo en el documento de la tienda ---
        const storeDocRef = doc(db, `artifacts/${appId}/tenants/${user.storeId}`);
        
        try {
            await updateDoc(storeDocRef, {
                theme: localTheme,
                exchangeRate: Number(localExchangeRate)
            });
            // Actualizar el tema en vivo en la app
            setThemePreference(localTheme);
            showNotification('Configuración de la tienda guardada.', 'success');
        } catch (error) {
            console.error("Error updating store settings:", error);
            showNotification('Error al guardar la configuración.', 'error');
        }
    };
    
    // --- CORRECCIÓN: Lógica de acceso mejorada ---
    if (!effectivePermissions.canChangeGeneralSettings || user.role === 'super_usuario') {
        return (
            <div className={`${currentThemeColors.cardBg} p-6 rounded-xl shadow-xl text-center`}>
                <p>
                    {user.role === 'super_usuario' 
                        ? 'La configuración de temas y tasas de cambio se gestiona por tienda.'
                        : 'No tienes permiso para acceder a esta sección.'}
                </p>
            </div>
        );
    }

    return (
        <div className={`${currentThemeColors.cardBg} p-6 rounded-xl shadow-xl`}>
            <h3 className={`${currentThemeColors.textColor} text-2xl font-bold mb-4`}>Configuración de la Tienda</h3>
            <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
                <div>
                    <label>Tema Visual:</label>
                    <select value={localTheme} onChange={e => setLocalTheme(e.target.value)} className={`w-full p-2 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`}>
                        <option value="automatico">Automático (del sistema)</option>
                        {Object.keys(themeColors).map(themeKey => (
                            <option key={themeKey} value={themeKey}>
                                {themeKey.replace(/bg-gradient-to-br from-| to-/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Tasa de Cambio (Bs a $):</label>
                    <input type="number" step="0.01" value={localExchangeRate} onChange={e => setLocalExchangeRate(e.target.value)} className={`w-full p-2 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} />
                </div>
                <button type="submit" className={`mt-4 p-3 ${currentThemeColors.buttonBg} rounded-lg flex items-center justify-center`}>
                    <Save size={20} className="mr-2" /> Guardar Cambios
                </button>
            </form>
        </div>
    );
};

export default GeneralSettingsTab;