// src/components/settings/StoreManagement.js
import React, { useState, useEffect, useContext } from 'react';
import { collection, addDoc, onSnapshot, deleteDoc, updateDoc, query, where, getDocs, doc as firestoreDoc } from 'firebase/firestore';
import { AppContext } from '../../context/AppContext';
import { Store, Trash2, Edit, CheckSquare, XSquare } from 'lucide-react';
import UserManagement from './UserManagement';

const StoreManagement = () => {
    const { db, showNotification, currentThemeColors } = useContext(AppContext);
    const [stores, setStores] = useState([]);
    const [newStoreName, setNewStoreName] = useState('');
    const [selectedStore, setSelectedStore] = useState(null);
    const [editingStoreId, setEditingStoreId] = useState(null);
    const [editingStoreName, setEditingStoreName] = useState('');
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id-local';

    useEffect(() => {
        if (!db) return;
        const tenantsColRef = collection(db, `artifacts/${appId}/tenants`);
        const unsubscribe = onSnapshot(tenantsColRef, (snapshot) => {
            setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [db, appId]);

    const handleAddStore = async (e) => {
        e.preventDefault();
        const trimmedName = newStoreName.trim();
        if (!trimmedName) {
            showNotification('El nombre de la tienda no puede estar vacío.', 'error');
            return;
        }

        // --- CORRECCIÓN CLAVE: Verificar si el nombre ya existe ---
        const tenantsColRef = collection(db, `artifacts/${appId}/tenants`);
        const q = query(tenantsColRef, where("name", "==", trimmedName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            showNotification('Ya existe una tienda con este nombre. Por favor, elige otro.', 'error');
            return;
        }
        // --- FIN DE LA CORRECCIÓN ---

        try {
            await addDoc(tenantsColRef, { name: trimmedName, createdAt: new Date().toISOString() });
            showNotification(`Tienda '${trimmedName}' creada exitosamente.`, 'success');
            setNewStoreName('');
        } catch (error) {
            showNotification('Error al crear la tienda.', 'error');
        }
    };

    const handleDeleteStore = async (storeId, storeName) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar la tienda '${storeName}'?`)) {
            try {
                await deleteDoc(firestoreDoc(db, `artifacts/${appId}/tenants`, storeId));
                showNotification(`Tienda '${storeName}' eliminada.`, 'success');
                if(selectedStore?.id === storeId) setSelectedStore(null);
            } catch (error) {
                showNotification('Error al eliminar la tienda.', 'error');
            }
        }
    };
    
    const handleEditClick = (store) => {
        setEditingStoreId(store.id);
        setEditingStoreName(store.name);
    };

    const handleSaveEdit = async (storeId) => {
        const storeDocRef = firestoreDoc(db, `artifacts/${appId}/tenants`, storeId);
        try {
            await updateDoc(storeDocRef, { name: editingStoreName });
            showNotification('Nombre de la tienda actualizado.', 'success');
            setEditingStoreId(null);
        } catch (error) {
            showNotification('Error al actualizar el nombre.', 'error');
        }
    };

    return (
        <div className={`${currentThemeColors.cardBg} p-6 rounded-xl shadow-xl`}>
            <h3 className={`${currentThemeColors.textColor} text-2xl font-bold mb-4`}>Gestión de Tiendas</h3>
            <form onSubmit={handleAddStore} className="flex gap-4 mb-6">
                <input
                    type="text"
                    value={newStoreName}
                    onChange={e => setNewStoreName(e.target.value)}
                    placeholder="Nombre de la nueva tienda"
                    className={`flex-grow p-2 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`}
                />
                <button type="submit" className={`${currentThemeColors.successButtonBg} p-2 rounded-lg flex items-center`}>
                    <Store size={18} className="mr-2" /> Crear Tienda
                </button>
            </form>

            <div>
                <h4 className={`${currentThemeColors.textColor} text-xl font-bold mb-2`}>Tiendas Existentes</h4>
                <ul className="space-y-2">
                    {stores.map(store => (
                        <li 
                            key={store.id} 
                            onClick={() => {
                                if (editingStoreId) return;
                                setSelectedStore(store);
                            }}
                            className={`flex justify-between items-center bg-black bg-opacity-20 p-3 rounded-lg transition-colors duration-200 
                                ${selectedStore?.id === store.id ? 'bg-purple-500 bg-opacity-40' : 'hover:bg-white hover:bg-opacity-10'}
                                ${editingStoreId ? 'cursor-default' : 'cursor-pointer'}`
                            }
                        >
                             {editingStoreId === store.id ? (
                                <input 
                                    type="text"
                                    value={editingStoreName}
                                    onChange={(e) => setEditingStoreName(e.target.value)}
                                    className={`flex-grow p-1 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`}
                                />
                            ) : (
                                <div className="flex flex-col">
                                    <span className="font-semibold">{store.name}</span>
                                    <span className="text-xs opacity-70">ID: {store.id}</span>
                                </div>
                            )}
                            <div className="flex gap-2">
                                {editingStoreId === store.id ? (
                                    <>
                                        <button onClick={() => handleSaveEdit(store.id)} className={`p-2 ${currentThemeColors.successButtonBg} rounded-full`}><CheckSquare size={16} /></button>
                                        <button onClick={() => setEditingStoreId(null)} className={`p-2 ${currentThemeColors.dangerButtonBg} rounded-full`}><XSquare size={16} /></button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handleEditClick(store)} className={`p-2 ${currentThemeColors.infoButtonBg} rounded-full`}><Edit size={16} /></button>
                                        <button onClick={() => handleDeleteStore(store.id, store.name)} className={`p-2 ${currentThemeColors.dangerButtonBg} rounded-full`}><Trash2 size={16} /></button>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="mt-6 pt-6 border-t-2 border-purple-400">
                <h4 className={`${currentThemeColors.textColor} text-xl font-bold mb-4`}>
                    Gestionar Usuarios para: <span className="text-purple-300">{selectedStore?.name || 'Ninguna tienda seleccionada'}</span>
                </h4>
                <UserManagement storeId={selectedStore?.id} />
            </div>
        </div>
    );
};

export default StoreManagement;