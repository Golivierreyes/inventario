// src/components/common/Notification.js
import React from 'react';
import { Bell } from 'lucide-react';

const Notification = ({ message, type }) => {
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    return (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 mt-2 px-4 py-2 rounded-lg shadow-lg text-white text-center z-[1000] animate-fade-in-down ${bgColor}`}>
            <div className="flex items-center justify-center">
                <Bell size={20} className="mr-2" />
                <span>{message}</span>
            </div>
        </div>
    );
};

export default Notification;
