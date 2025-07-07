// src/components/Warehouse.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { PlusCircle, Edit, Trash2, Lock } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import ProductForm from './ProductForm';
import { formatNumberForDisplay, formatCurrencyBs, formatCurrencyUsd, getEffectivePermissions } from '../utils/helpers';

const Warehouse = () => {
    const { db, user, showConfirmationModal, rolePermissions, showNotification, customCategories, currentThemeColors } = useContext(AppContext);
    // ... (El resto de la lógica y estados del componente se mantienen igual)
    const effectivePermissions = getEffectivePermissions(user, rolePermissions);
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddingOrEditing, setIsAddingOrEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [lowStockThreshold, setLowStockThreshold] = useState(5);
    const [filterCategory, setFilterCategory] = useState('all');
    const [loadingMessage, setLoadingMessage] = useState('Cargando productos...');
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id-local';

    const isUnlocked = effectivePermissions.canManageWarehouse;

    const debouncedSetSearchQuery = useCallback((value) => {
        if (debouncedSetSearchQuery.timeout) clearTimeout(debouncedSetSearchQuery.timeout);
        debouncedSetSearchQuery.timeout = setTimeout(() => setSearchQuery(value), 500);
    }, []);

    useEffect(() => {
        if (!db || !user?.storeId || !isUnlocked) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setLoadingMessage('Cargando productos...');

        const productsColRef = collection(db, `artifacts/${appId}/tenants/${user.storeId}/products`);
        
        const q = query(productsColRef);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productsList);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching products:", err);
            showNotification("Error al cargar el almacén.", "error");
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, user, isUnlocked, appId, showNotification]);

    const handleAddProduct = () => {
        setCurrentProduct(null);
        setIsAddingOrEditing(true);
    };

    const handleEditProduct = (product) => {
        setCurrentProduct(product);
        setIsAddingOrEditing(true);
    };

    const handleDeleteProduct = (productId) => {
        showConfirmationModal(
            "Eliminar Producto",
            "¿Estás seguro de que quieres eliminar este producto?",
            async () => {
                await deleteDoc(doc(db, `artifacts/${appId}/tenants/${user.storeId}/products`, productId));
                showNotification("Producto eliminado.", "success");
            }
        );
    };

    const handleSaveProduct = async (productData) => {
        const productsColRef = collection(db, `artifacts/${appId}/tenants/${user.storeId}/products`);
        try {
            if (currentProduct) {
                const productDocRef = doc(db, `artifacts/${appId}/tenants/${user.storeId}/products`, currentProduct.id);
                await updateDoc(productDocRef, productData);
                showNotification("Producto actualizado.", "success");
            } else {
                await addDoc(productsColRef, productData);
                showNotification("Producto agregado.", "success");
            }
            setIsAddingOrEditing(false);
        } catch (e) {
            showNotification("Error al guardar el producto.", "error");
        }
    };
    
    // --- CORRECCIÓN CLAVE: Asegurarse de que customCategories sea un array ---
    const categoryFilterOptions = ['all', ...(Array.isArray(customCategories) ? customCategories.map(cat => cat.name) : [])];

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      (product.productCode && String(product.productCode).includes(searchQuery));
        const matchesLowStock = showLowStockOnly ? (product.quantity <= lowStockThreshold) : true;
        const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
        return matchesSearch && matchesLowStock && matchesCategory;
    });

    if (loading) return <div className={`${currentThemeColors.textColor} text-xl`}>{loadingMessage}</div>;

    if (!isUnlocked) {
         return (
            <div className={`${currentThemeColors.cardBg} backdrop-filter backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md text-center`}>
               <Lock size={60} className="text-red-300 mx-auto mb-4" />
               <h2 className={`${currentThemeColors.textColor} text-3xl font-bold mb-4`}>Acceso Restringido</h2>
               <p className={`${currentThemeColors.textColor} text-lg mb-4`}>No tienes permisos para gestionar el almacén.</p>
           </div>
       );
    }
    
    return (
        <div className={`${currentThemeColors.cardBg} backdrop-filter backdrop-blur-lg p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-7xl`}>
            <h2 className={`${currentThemeColors.textColor} text-3xl font-bold mb-6 text-center`}>Gestión de Almacén</h2>
            {isAddingOrEditing ? (
                <ProductForm product={currentProduct} onSave={handleSaveProduct} onCancel={() => setIsAddingOrEditing(false)} allProducts={products} />
            ) : (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <button onClick={handleAddProduct} className={`flex items-center px-6 py-3 ${currentThemeColors.successButtonBg} ${currentThemeColors.textColor} rounded-xl shadow-lg ${currentThemeColors.successButtonHover} w-full md:w-auto justify-center`}>
                            <PlusCircle size={20} className="mr-2" /> Agregar Producto
                        </button>
                        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                            <input type="text" placeholder="Buscar producto..." onChange={(e) => debouncedSetSearchQuery(e.target.value)} className={`w-full p-3 rounded-xl ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} />
                            <div className="flex items-center">
                                <input type="checkbox" id="lowStockFilter" checked={showLowStockOnly} onChange={(e) => setShowLowStockOnly(e.target.checked)} className={`mr-2 h-5 w-5 ${currentThemeColors.buttonBg.replace('bg-', 'text-')} rounded`} />
                                <label htmlFor="lowStockFilter" className={`${currentThemeColors.textColor} text-sm mr-2`}>Bajo stock</label>
                                {showLowStockOnly && <input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(Math.max(0, parseInt(e.target.value) || 0))} className={`w-20 p-2 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} min="0" />}
                            </div>
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={`w-full p-3 rounded-xl ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`}>
                                {categoryFilterOptions.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'Todas las Categorías' : cat}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto rounded-xl shadow-lg">
                        <table className={`min-w-full ${currentThemeColors.cardBg} rounded-xl`}>
                            <thead>
                                <tr className={`${currentThemeColors.tableHeaderBg} ${currentThemeColors.textColor} text-left`}>
                                    <th className="py-3 px-4">Código</th>
                                    <th className="py-3 px-4">Descripción</th>
                                    <th className="py-3 px-4 text-center">Cantidad</th>
                                    <th className="py-3 px-4">Unidad</th>
                                    <th className="py-3 px-4">Categoría</th>
                                    <th className="py-3 px-4">Precio Compra (Bs)</th>
                                    <th className="py-3 px-4">Precio Venta (Bs)</th>
                                    <th className="py-3 px-4">Precio Venta ($)</th>
                                    <th className="py-3 px-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(product => (
                                    <tr key={product.id} className={`border-b ${currentThemeColors.tableBorder} ${product.quantity <= lowStockThreshold ? 'bg-red-500 bg-opacity-20' : currentThemeColors.tableHoverBg}`}>
                                        <td className={`py-3 px-4 ${currentThemeColors.textColor}`}>{product.productCode}</td>
                                        <td className={`py-3 px-4 ${currentThemeColors.textColor}`}>{product.description}</td>
                                        <td className={`py-3 px-4 ${currentThemeColors.textColor} text-center`}>{formatNumberForDisplay(product.quantity)}</td>
                                        <td className={`py-3 px-4 ${currentThemeColors.textColor}`}>{product.unitType}</td>
                                        <td className={`py-3 px-4 ${currentThemeColors.textColor}`}>{product.category}</td>
                                        <td className={`py-3 px-4 ${currentThemeColors.textColor}`}>{formatCurrencyBs(product.purchasePriceBs)}</td>
                                        <td className={`py-3 px-4 ${currentThemeColors.textColor}`}>{formatCurrencyBs(product.priceBs)}</td>
                                        <td className={`py-3 px-4 ${currentThemeColors.textColor}`}>{formatCurrencyUsd(product.priceUsd)}</td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleEditProduct(product)} className={`p-2 ${currentThemeColors.infoButtonBg} ${currentThemeColors.textColor} rounded-full`}><Edit size={18} /></button>
                                                <button onClick={() => handleDeleteProduct(product.id)} className={`p-2 ${currentThemeColors.dangerButtonBg} ${currentThemeColors.textColor} rounded-full`}><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default Warehouse;