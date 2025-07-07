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

            // --- LÓGICA DE LOGIN SIMPLIFICADA ---

            if (username.toLowerCase() === 'golivier' && storeName.trim() === '') {
                // Caso especial para el superusuario, se mantiene igual.
                userEmail = 'golivier@super.user';
            } else {
                // Para usuarios normales, primero encontramos el storeId.
                const tenantsRef = collection(db, `artifacts/${appId}/tenants`);
                const q = query(tenantsRef, where("name", "==", storeName.trim()));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    throw new Error("No se encontró una tienda con ese nombre.");
                }
                
                // Obtenemos el ID de la tienda del primer resultado.
                const storeId = querySnapshot.docs[0].id;

                // CORRECCIÓN CLAVE: Construimos el email directamente, sin buscar al usuario.
                // Esto debe coincidir con la lógica de creación en tu función de Vercel.
                userEmail = `${username.trim().toLowerCase().replace(/\s+/g, '')}.${storeId.substring(0, 5)}@inventory.app`;
            }
            
            // Ahora, intentamos iniciar sesión con el email construido.
            await signInWithEmailAndPassword(auth, userEmail, password);
            showNotification('Inicio de sesión exitoso.', 'success');

        } catch (error) {
            console.error("Error de inicio de sesión:", error);
            setError("Credenciales incorrectas o error de conexión.");
            showNotification(error.message === "auth/invalid-credential" ? "Credenciales incorrectas." : "Error al iniciar sesión.", "error");
        }
    };

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-2xl shadow-2xl animate-fade-in-up">
            <h2 className={`text-4xl font-extrabold text-center ${currentThemeColors.textColor}`}>Bienvenido</h2>
            <form onSubmit={handleLogin} className="space-y-6">
                <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input type="text" placeholder="Nombre de la Tienda (comillas incluidas)" value={storeName} onChange={(e) => setStoreName(e.target.value)} className={`w-full p-3 pl-10 rounded-xl ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText} placeholder-gray-500`} />
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
                {error && <p className="text-red-400 text-center">{error}</p>}
            </form>
        </div>
    );
};

export default Login;
