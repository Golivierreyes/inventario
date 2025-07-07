// src/components/settings/CategoryManagementTab.js
import React, { useState, useEffect, useContext } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { AppContext } from '../../context/AppContext';
import { getEffectivePermissions } from '../../utils/helpers';
import { PlusCircle, Trash2 } from 'lucide-react';

const CategoryManagementTab = () => {
    const { db, user, showNotification, currentThemeColors, rolePermissions } = useContext(AppContext);
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const effectivePermissions = getEffectivePermissions(user, rolePermissions);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id-local';

    const canManageCategories = effectivePermissions.canManageCategories;

    useEffect(() => {
        if (!db || !user?.storeId || !canManageCategories) {
            setCategories([]);
            return;
        }

        const categoriesColRef = collection(db, `artifacts/${appId}/tenants/${user.storeId}/product_categories`);
        const unsubscribe = onSnapshot(categoriesColRef, (snapshot) => {
            setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            showNotification('Error al cargar las categorías.', 'error');
        });

        return () => unsubscribe();
    }, [db, user, canManageCategories, appId, showNotification]);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            showNotification('El nombre de la categoría no puede estar vacío.', 'error');
            return;
        }

        try {
            const categoriesColRef = collection(db, `artifacts/${appId}/tenants/${user.storeId}/product_categories`);
            await addDoc(categoriesColRef, { name: newCategoryName.trim() });
            showNotification('Categoría agregada exitosamente.', 'success');
            setNewCategoryName('');
        } catch (error) {
            showNotification('Error al agregar la categoría.', 'error');
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        try {
            const categoryDocRef = doc(db, `artifacts/${appId}/tenants/${user.storeId}/product_categories`, categoryId);
            await deleteDoc(categoryDocRef);
            showNotification('Categoría eliminada exitosamente.', 'success');
        } catch (error) {
            showNotification('Error al eliminar la categoría. Asegúrate de que no esté en uso.', 'error');
        }
    };

    if (!canManageCategories) {
        return <p>No tienes permisos para gestionar las categorías.</p>;
    }

    return (
        <div className={`${currentThemeColors.cardBg} p-6 rounded-xl shadow-xl`}>
            <h3 className={`${currentThemeColors.textColor} text-2xl font-bold mb-4`}>Gestión de Categorías de Productos</h3>
            <form onSubmit={handleAddCategory} className="flex gap-4 mb-6">
                <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Nombre de la nueva categoría"
                    className={`flex-grow p-2 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`}
                />
                <button type="submit" className={`${currentThemeColors.successButtonBg} p-2 rounded-lg flex items-center`}>
                    <PlusCircle size={18} className="mr-2" /> Agregar
                </button>
            </form>
            <div>
                <h4 className={`${currentThemeColors.textColor} text-xl font-bold mb-2`}>Categorías Existentes</h4>
                <ul className="space-y-2">
                    {/* --- CORRECCIÓN CLAVE: Verificar si 'categories' es un array --- */}
                    {Array.isArray(categories) && categories.map(cat => (
                        <li key={cat.id} className="flex justify-between items-center bg-black bg-opacity-20 p-3 rounded-lg">
                            <span>{cat.name}</span>
                            <button onClick={() => handleDeleteCategory(cat.id)} className={`p-2 ${currentThemeColors.dangerButtonBg} rounded-full`}>
                                <Trash2 size={16} />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default CategoryManagementTab;