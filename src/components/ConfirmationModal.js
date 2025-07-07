// src/components/ConfirmationModal.js
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const ConfirmationModal = ({ title, message, onConfirm, onCancel, showCancel }) => {
    const { currentThemeColors } = useContext(AppContext);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
            <div className={`${currentThemeColors.modalBg} rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-sm text-center transform scale-100 animate-fade-in-up`}>
                <h3 className={`text-2xl font-bold ${currentThemeColors.modalText} mb-4`}>{title}</h3>
                <p className={`${currentThemeColors.modalText} mb-6`}>{message}</p>
                <div className="flex justify-center gap-4">
                    {showCancel && (
                        <button onClick={onCancel} className={`px-5 py-2 bg-gray-500 text-white rounded-xl shadow-md hover:bg-gray-600`}>
                            Cancelar
                        </button>
                    )}
                    <button onClick={onConfirm} className={`px-5 py-2 ${currentThemeColors.buttonBg} ${currentThemeColors.textColor} rounded-xl shadow-md ${currentThemeColors.buttonHover}`}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
