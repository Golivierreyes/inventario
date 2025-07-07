// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, query } from 'firebase/firestore';
import { AppContext } from './context/AppContext';
import { themeColors } from './constants/theme';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Warehouse from './components/Warehouse';
import Sales from './components/Sales';
import Reports from './components/Reports';
import SettingsPage from './components/settings/SettingsPage';
import ConfirmationModal from './components/ConfirmationModal';

const App = () => {
    // --- Estados ---
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [app, setApp] = useState(null);
    const [user, setUser] = useState(null); // Usuario de Firebase Auth
    const [userData, setUserData] = useState(null); // Datos de Firestore (rol, storeId)
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    // UI y Estado
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [notification, setNotification] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '', onConfirm: null, showCancel: false });
    
    // Configuración
    const [themePreference, setThemePreference] = useState('automatico');
    const [globalTheme, setGlobalTheme] = useState('automatico');
    const [exchangeRate, setExchangeRate] = useState(0);
    const [rolePermissions, setRolePermissions] = useState({});
    const [storeName, setStoreName] = useState('Mi Tienda');
    const [logoUrl, setLogoUrl] = useState('');
    const [storeAddress, setStoreAddress] = useState('');
    const [customCategories, setCustomCategories] = useState([]);
    
    // Tema Derivado
    const [backgroundStyle, setBackgroundStyle] = useState('bg-gray-100');
    const [currentThemeColors, setCurrentThemeColors] = useState(themeColors['claro']);

    // --- EFECTO 1: Inicialización y Listener de Autenticación ---
    useEffect(() => {
        // CORRECCIÓN: Se utilizan variables de entorno para mayor seguridad.
        const firebaseConfig = {
            apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
            authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
            storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.REACT_APP_FIREBASE_APP_ID
        };
        const firebaseApp = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(firebaseApp);
        const firebaseAuth = getAuth(firebaseApp);
        
        setApp(firebaseApp);
        setDb(firestoreDb);
        setAuth(firebaseAuth);

        const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(firestoreDb, `users/${firebaseUser.uid}`);
                const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUser(firebaseUser);
                        setUserData(docSnap.data());
                    } else {
                        firebaseAuth.signOut();
                    }
                    if (!isAuthReady) setIsAuthReady(true);
                });
                return () => unsubDoc();
            } else {
                setUser(null);
                setUserData(null);
                if (!isAuthReady) setIsAuthReady(true);
            }
        });
        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Este efecto solo debe correr una vez al montar el componente.

    // --- EFECTO 2: Cargar Configuración Global ---
    useEffect(() => {
        if (!isAuthReady || !db) return;
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id-local';
        const globalSettingsRef = doc(db, `artifacts/${appId}/public/data/settings/app_settings`);
        const unsubGlobal = onSnapshot(globalSettingsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setGlobalTheme(data.theme || 'automatico');
                if (!userData) {
                    setExchangeRate(Number(data.exchangeRate) || 0);
                }
            }
        });
        const rolesRef = doc(db, `artifacts/${appId}/public/data/role_permissions/default_permissions`);
        const unsubRoles = onSnapshot(rolesRef, (docSnap) => {
            if (docSnap.exists()) setRolePermissions(docSnap.data());
        });
        return () => { unsubGlobal(); unsubRoles(); };
    }, [isAuthReady, db, userData]); // CORRECCIÓN: La advertencia de ESLint se resuelve asegurando que todas las dependencias estén aquí.

    // --- EFECTO 3: Cargar Datos de la Tienda ---
    useEffect(() => {
        const appUser = user && userData ? { uid: user.uid, ...userData } : null;
        if (!db || !appUser) {
             setStoreName('Mi Tienda');
             setCustomCategories([]);
             setThemePreference(globalTheme);
             return;
        }
        let unsubStore = () => {};
        let unsubCategories = () => {};
        if (appUser.role === 'super_usuario') {
            setStoreName('Panel Super Usuario');
            setThemePreference(globalTheme);
            setCustomCategories([]);
        } else if (appUser.storeId) {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id-local';
            const storeRef = doc(db, `artifacts/${appId}/tenants/${appUser.storeId}`);
            unsubStore = onSnapshot(storeRef, (docSnap) => {
                const data = docSnap.exists() ? docSnap.data() : {};
                setStoreName(data.name || 'Sin Nombre');
                setLogoUrl(data.logoUrl || '');
                setStoreAddress(data.address || '');
                setThemePreference(data.theme || globalTheme);
                setExchangeRate(Number(data.exchangeRate) || 0);
            });
            const categoriesRef = collection(db, `artifacts/${appId}/tenants/${appUser.storeId}/product_categories`);
            unsubCategories = onSnapshot(query(categoriesRef), (snapshot) => {
                setCustomCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
        }
        return () => { unsubStore(); unsubCategories(); };
    }, [user, userData, db, globalTheme]);

    // --- EFECTO 4: Aplicar el Tema Visual ---
    useEffect(() => {
        const applyTheme = (themeKey) => {
            let activeThemeKey = themeKey === 'automatico' 
                ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro') 
                : themeKey;
            const newColors = themeColors[activeThemeKey] || themeColors['claro'];
            setCurrentThemeColors(newColors);
            const newBackground = activeThemeKey.includes('bg-gradient') 
                ? activeThemeKey 
                : (activeThemeKey === 'oscuro' ? 'bg-gray-900' : 'bg-gray-100');
            setBackgroundStyle(newBackground);
        };
        applyTheme(themePreference);
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => applyTheme(themePreference);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [themePreference]);
    
    // --- Funciones de Utilidad ---
    const handleLogout = useCallback(() => {
        if (auth) auth.signOut();
    }, [auth]);
    
    const showNotification = useCallback((message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    }, []);

    const showConfirmationModal = useCallback((title, message, onConfirm, showCancel = true) => {
        setModalContent({ title, message, onConfirm, showCancel });
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
    }, []);

    const handleConfirm = useCallback(() => {
        if (modalContent.onConfirm) {
            modalContent.onConfirm();
        }
        closeModal();
    }, [modalContent, closeModal]);

    // --- Renderizado ---
    if (!isAuthReady) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-200"><div className="text-gray-800 text-2xl animate-pulse">Cargando...</div></div>;
    }
    
    const appUser = user && userData ? { uid: user.uid, email: user.email, ...userData } : null;

    return (
        <AppContext.Provider value={{ db, auth, app, user: appUser, storeName, logoUrl, storeAddress, backgroundStyle, exchangeRate, showConfirmationModal, rolePermissions, setRolePermissions, showNotification, customCategories, currentThemeColors, setCurrentPage, setThemePreference, themePreference }}>
            <div className={`min-h-screen ${backgroundStyle} ${currentThemeColors.textColor} font-sans flex flex-col transition-colors duration-500`}>
                {appUser && <Header storeName={storeName} logoUrl={logoUrl} setCurrentPage={setCurrentPage} handleLogout={handleLogout} user={appUser} rolePermissions={rolePermissions} notification={notification} />}
                <main className="flex-grow p-4 md:p-8 flex items-center justify-center">
                    {!appUser ? <Login /> : 
                        currentPage === 'dashboard' ? <Dashboard setCurrentPage={setCurrentPage} /> :
                        currentPage === 'warehouse' ? <Warehouse /> :
                        currentPage === 'sales' ? <Sales /> :
                        currentPage === 'reports' ? <Reports /> :
                        currentPage === 'settings' ? <SettingsPage /> :
                        <Dashboard setCurrentPage={setCurrentPage} /> 
                    }
                </main>
                {showModal && <ConfirmationModal title={modalContent.title} message={modalContent.message} onConfirm={handleConfirm} onCancel={closeModal} showCancel={modalContent.showCancel} />}
            </div>
        </AppContext.Provider>
    );
};

export default App;