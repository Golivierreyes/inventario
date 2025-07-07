// src/components/Login.js
import React, { useState, useContext } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { AppContext } from '../context/AppContext';
import { User, Eye, EyeOff, Building, Key } from 'lucide-react';

const Login = () => {
    const { db, auth, showNotification, currentThemeColors } = useContext(AppContext);
    const [storeName, setStoreName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id-local';

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!auth) {
            setError('Servicio de autenticación no disponible.');
            return;
        }

        try {
            let userEmail;

            // --- LÓGICA DE LOGIN HÍBRIDA ---
            if (username.toLowerCase() === 'golivier' && storeName.trim() === '') {
                // Caso especial para el superusuario
                userEmail = 'golivier@super.user'; 
            } else {
                // Para usuarios normales, buscar su email en la base de datos.
                if (!storeName.trim()) {
                    setError('Por favor, introduce el nombre de la Tienda.');
                    return;
                }
                const tenantsRef = collection(db, `artifacts/${appId}/tenants`);
                const storeQuery = query(tenantsRef, where("normalizedName", "==", storeName.trim().toLowerCase()));
                const storeSnapshot = await getDocs(storeQuery);

                if (storeSnapshot.empty) {
                    setError('Tienda no encontrada.');
                    return;
                }
                
                const storeId = storeSnapshot.docs[0].id;
                
                // Buscar al usuario por su 'username' y 'storeId' en la colección raíz 'users'
                const usersRef = collection(db, `users`);
                const userQuery = query(usersRef, where("username", "==", username.trim()), where("storeId", "==", storeId));
                const userSnapshot = await getDocs(userQuery);

                if (userSnapshot.empty) {
                    setError('Usuario o contraseña incorrectos.');
                    return;
                }

                const userData = userSnapshot.docs[0].data();
                userEmail = userData.email;

                if (!userEmail) {
                    setError('Cuenta de usuario mal configurada.');
                    return;
                }
            }

            // Iniciar sesión en Firebase Auth con el email encontrado y la contraseña
            await signInWithEmailAndPassword(auth, userEmail, password);
            showNotification('Inicio de sesión exitoso.', 'success');

        } catch (err) {
            console.error("Error en inicio de sesión:", err.code);
            if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                setError('Credenciales incorrectas.');
            } else {
                setError('Error al intentar iniciar sesión.');
            }
        }
    };

    return (
        <div className={`${currentThemeColors.cardBg} backdrop-filter backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md text-center`}>
            <h2 className={`${currentThemeColors.textColor} text-4xl font-extrabold mb-6`}>Bienvenido</h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input type="text" placeholder="Nombre de la Tienda (omitir para Super Usuario)" value={storeName} onChange={(e) => setStoreName(e.target.value)} className={`w-full p-3 pl-10 rounded-xl ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText} placeholder-gray-500`} />
                </div>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input type="text" placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} className={`w-full p-3 pl-10 rounded-xl ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText} placeholder-gray-500`} required />
                </div>
                <div className="relative">
                     <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input type={showPassword ? "text" : "password"} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full p-3 pl-10 pr-10 rounded-xl ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText} placeholder-gray-500`} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                <button type="submit" className={`flex items-center justify-center w-full px-6 py-3 ${currentThemeColors.buttonBg} ${currentThemeColors.textColor} text-lg font-semibold rounded-xl shadow-lg`}>
                    <Key size={24} className="mr-3" /> Ingresar
                </button>
                {error && <p className="text-red-300 mt-4 text-sm">{error}</p>}
            </form>
        </div>
    );
};

export default Login;
