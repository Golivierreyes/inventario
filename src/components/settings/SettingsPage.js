// src/components/settings/SettingsPage.js
import React, { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import GeneralSettingsTab from './GeneralSettingsTab';
import SecuritySettingsTab from './SecuritySettingsTab';
import DataToolsTab from './DataToolsTab';
import CategoryManagementTab from './CategoryManagementTab';

const SettingsPage = () => {
    const { currentThemeColors } = useContext(AppContext);
    const [selectedTab, setSelectedTab] = useState('general');

    return (
        <div className={`${currentThemeColors.cardBg} backdrop-filter backdrop-blur-lg p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-4xl`}>
            <h2 className={`${currentThemeColors.textColor} text-3xl font-bold mb-6 text-center`}>Configuración</h2>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
                <button onClick={() => setSelectedTab('general')} className={`px-5 py-2 rounded-xl shadow-md ${selectedTab === 'general' ? currentThemeColors.buttonBg : currentThemeColors.cardBg}`}>General</button>
                <button onClick={() => setSelectedTab('security')} className={`px-5 py-2 rounded-xl shadow-md ${selectedTab === 'security' ? currentThemeColors.buttonBg : currentThemeColors.cardBg}`}>Seguridad</button>
                <button onClick={() => setSelectedTab('data')} className={`px-5 py-2 rounded-xl shadow-md ${selectedTab === 'data' ? currentThemeColors.buttonBg : currentThemeColors.cardBg}`}>Datos</button>
                <button onClick={() => setSelectedTab('categories')} className={`px-5 py-2 rounded-xl shadow-md ${selectedTab === 'categories' ? currentThemeColors.buttonBg : currentThemeColors.cardBg}`}>Categorías</button>
            </div>

            <div className={`${currentThemeColors.cardBg} p-6 rounded-xl shadow-inner`}>
                {selectedTab === 'general' && <GeneralSettingsTab />}
                {selectedTab === 'security' && <SecuritySettingsTab />}
                {selectedTab === 'data' && <DataToolsTab />}
                {selectedTab === 'categories' && <CategoryManagementTab />}
            </div>
        </div>
    );
};

export default SettingsPage;
