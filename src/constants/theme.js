// src/constants/theme.js

// Paleta de colores base para los temas claro y oscuro
const lightTheme = {
    buttonBg: 'bg-gray-200',
    buttonHover: 'hover:bg-gray-300',
    buttonRing: 'ring-gray-400',
    successButtonBg: 'bg-green-500',
    dangerButtonBg: 'bg-red-500',
    infoButtonBg: 'bg-blue-500',
    textColor: 'text-gray-800',
    tableHeaderBg: 'bg-gray-100',
    tableBorder: 'border-gray-200',
    tableHoverBg: 'hover:bg-gray-200',
    inputBg: 'bg-white',
    inputBorder: 'border-gray-300',
    cardBg: 'bg-white bg-opacity-90',
    modalBg: 'bg-white',
    modalText: 'text-gray-800',
};

const darkTheme = {
    buttonBg: 'bg-gray-700',
    buttonHover: 'hover:bg-gray-600',
    buttonRing: 'ring-gray-500',
    successButtonBg: 'bg-green-600',
    dangerButtonBg: 'bg-red-600',
    infoButtonBg: 'bg-blue-600',
    textColor: 'text-gray-200',
    tableHeaderBg: 'bg-gray-900',
    tableBorder: 'border-gray-700',
    tableHoverBg: 'hover:bg-gray-700',
    inputBg: 'bg-gray-800',
    inputBorder: 'border-gray-600',
    cardBg: 'bg-gray-800 bg-opacity-80 backdrop-filter backdrop-blur-lg',
    modalBg: 'bg-gray-900',
    modalText: 'text-gray-200',
};

export const themeColors = {
    // Temas base
    'claro': lightTheme,
    'oscuro': darkTheme,

    // Temas degradados (heredan del tema oscuro para la legibilidad)
    'bg-gradient-to-br from-purple-400 to-indigo-600': {
        ...darkTheme,
        buttonBg: 'bg-purple-600',
        buttonHover: 'hover:bg-purple-700',
        buttonRing: 'ring-purple-400',
        tableHeaderBg: 'bg-purple-800',
        tableBorder: 'border-purple-600',
        cardBg: 'bg-black bg-opacity-20 backdrop-filter backdrop-blur-lg',
    },
    'bg-gradient-to-br from-blue-500 to-blue-700': {
        ...darkTheme,
        buttonBg: 'bg-blue-600',
        buttonHover: 'hover:bg-blue-700',
        buttonRing: 'ring-blue-400',
        tableHeaderBg: 'bg-blue-800',
        tableBorder: 'border-blue-600',
        cardBg: 'bg-black bg-opacity-20 backdrop-filter backdrop-blur-lg',
    },
    'bg-gradient-to-br from-green-400 to-teal-600': {
        ...darkTheme,
        buttonBg: 'bg-green-600',
        buttonHover: 'hover:bg-green-700',
        buttonRing: 'ring-green-400',
        tableHeaderBg: 'bg-green-800',
        tableBorder: 'border-green-600',
        cardBg: 'bg-black bg-opacity-20 backdrop-filter backdrop-blur-lg',
    },
    'bg-gradient-to-br from-orange-400 to-red-600': {
        ...darkTheme,
        buttonBg: 'bg-orange-600',
        buttonHover: 'hover:bg-orange-700',
        buttonRing: 'ring-orange-400',
        tableHeaderBg: 'bg-orange-800',
        tableBorder: 'border-orange-600',
        cardBg: 'bg-black bg-opacity-20 backdrop-filter backdrop-blur-lg',
    },
};