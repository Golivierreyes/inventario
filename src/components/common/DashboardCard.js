// src/components/common/DashboardCard.js
import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';

const DashboardCard = ({ icon, title, description, onClick, disabled = false }) => {
    const { currentThemeColors } = useContext(AppContext);
    const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : `${currentThemeColors.buttonHover} hover:scale-105`;
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center justify-center p-6 ${currentThemeColors.cardBg} rounded-2xl shadow-xl ${currentThemeColors.textColor} transform transition duration-300 ease-in-out ${disabledClass}`}
        >
            <div className="flex flex-col items-center justify-center">
                <div className="mb-4 text-purple-200">{icon}</div>
                <h3 className="text-2xl font-bold mb-2">{title}</h3>
                <p className="text-sm text-center opacity-80">{description}</p>
            </div>
        </button>
    );
};

export default DashboardCard;
