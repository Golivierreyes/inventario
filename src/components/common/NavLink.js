// src/components/common/NavLink.js
import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';

const NavLink = ({ icon, text, onClick, disabled = false }) => {
    const { currentThemeColors } = useContext(AppContext);
    const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : `${currentThemeColors.buttonHover} hover:scale-105`;
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center px-4 py-2 ${currentThemeColors.buttonBg} ${currentThemeColors.textColor} rounded-full shadow-md transition duration-300 ease-in-out transform focus:outline-none focus:ring-2 ${currentThemeColors.buttonRing} focus:ring-opacity-75 ${disabledClass}`}
        >
            {icon}
            <span className="ml-2">{text}</span>
        </button>
    );
};

export default NavLink;