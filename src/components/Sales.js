// src/components/Sales.js
import React, { useState, useEffect, useContext } from 'react';
import { collection, query, onSnapshot, doc, getDoc, writeBatch } from 'firebase/firestore';
import { MinusCircle, XCircle } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { formatNumberForDisplay, formatCurrencyBs, formatCurrencyUsd } from '../utils/helpers';

const Sales = () => {
    const { db, user, exchangeRate, showConfirmationModal, rolePermissions, showNotification, currentThemeColors } = useContext(AppContext);
    const [products, setProducts] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchProductQuery, setSearchProductQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantitySold, setQuantitySold] = useState(1);
    const getLocalFormattedDate = () => new Date().toISOString().split('T')[0];
    const [saleDate, setSaleDate] = useState(getLocalFormattedDate());
    const [currentSaleProducts, setCurrentSaleProducts] = useState([]);
    const canDeleteSales = user?.role === 'super_usuario' || (user?.role && rolePermissions[user.role]?.canDeleteSales);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id-local';

    useEffect(() => {
        if (!db || !user?.storeId) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const productsColRef = collection(db, `artifacts/${appId}/tenants/${user.storeId}/products`);
        const salesColRef = collection(db, `artifacts/${appId}/tenants/${user.storeId}/sales`);
        
        const unsubscribeProducts = onSnapshot(productsColRef, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => {
            showNotification("Error al cargar productos.", "error");
        });

        const unsubscribeSales = onSnapshot(query(salesColRef), (snapshot) => {
            const allSales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // --- CORRECCIÓN CLAVE: Filtrar para mostrar solo las ventas de hoy ---
            const todayStr = new Date().toISOString().split('T')[0];
            const todaySales = allSales.filter(sale => sale.saleDate === todayStr);
            
            todaySales.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setSales(todaySales);
            setLoading(false);
        }, (err) => {
            showNotification("Error al cargar ventas.", "error");
            setLoading(false);
        });

        return () => {
            unsubscribeProducts();
            unsubscribeSales();
        };
    }, [db, user, appId, showNotification]);

    useEffect(() => {
        if (searchProductQuery.length > 0) {
            const lowerCaseQuery = searchProductQuery.toLowerCase();
            setFilteredProducts(products.filter(p => p.description.toLowerCase().includes(lowerCaseQuery) || (p.productCode && String(p.productCode).includes(lowerCaseQuery))));
        } else {
            setFilteredProducts([]);
        }
    }, [searchProductQuery, products]);

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setSearchProductQuery(product.description);
        setFilteredProducts([]);
    };

    const handleAddProductToSale = () => {
        if (!selectedProduct) {
            showNotification("Producto no seleccionado.", "error");
            return;
        }
        const qty = Number(quantitySold);
        if (qty <= 0 || qty > selectedProduct.quantity) {
            showNotification("Cantidad de venta inválida o excede el stock.", "error");
            return;
        }
        const existingItemIndex = currentSaleProducts.findIndex(item => item.id === selectedProduct.id);
        if (existingItemIndex > -1) {
            const updatedSaleProducts = [...currentSaleProducts];
            updatedSaleProducts[existingItemIndex].quantitySold += qty;
            setCurrentSaleProducts(updatedSaleProducts);
        } else {
            setCurrentSaleProducts([...currentSaleProducts, { ...selectedProduct, quantitySold: qty }]);
        }
        setSelectedProduct(null);
        setSearchProductQuery('');
        setQuantitySold(1);
        showNotification("Producto añadido a la venta.", "info");
    };

    const handleRemoveProductFromSale = (productId) => {
        setCurrentSaleProducts(currentSaleProducts.filter(item => item.id !== productId));
        showNotification("Producto eliminado de la venta.", "info");
    };

    const handleCompleteSale = async () => {
        if (currentSaleProducts.length === 0) {
            showNotification("No hay productos en la venta.", "error");
            return;
        }
        showConfirmationModal("Confirmar Venta", "¿Estás seguro de completar esta venta?", async () => {
            const batch = writeBatch(db);
            let totalBs = 0;
            let totalUsd = 0;
            const saleItems = currentSaleProducts.map(item => {
                const productRef = doc(db, `artifacts/${appId}/tenants/${user.storeId}/products`, item.id);
                const newQuantity = item.quantity - item.quantitySold;
                if (newQuantity < 0) throw new Error(`Stock insuficiente para ${item.description}`);
                batch.update(productRef, { quantity: newQuantity });
                const itemTotalBs = item.priceBs * item.quantitySold;
                const itemTotalUsd = item.priceUsd * item.quantitySold;
                totalBs += itemTotalBs;
                totalUsd += itemTotalUsd;
                return { 
                    productId: item.id, 
                    productCode: item.productCode, 
                    description: item.description, 
                    quantitySold: item.quantitySold, 
                    unitType: item.unitType, 
                    priceAtSaleBs: item.priceBs, 
                    priceAtSaleUsd: item.priceUsd, 
                    purchasePriceAtSaleBs: item.purchasePriceBs, 
                    purchasePriceAtSaleUsd: item.purchasePriceUsd, 
                    itemTotalBs, 
                    itemTotalUsd 
                };
            });
            const salesColRef = collection(db, `artifacts/${appId}/tenants/${user.storeId}/sales`);
            const newSaleRef = doc(salesColRef);
            
            const saleRecord = { 
                id: newSaleRef.id, 
                items: saleItems, 
                timestamp: new Date().toISOString(), 
                saleDate, 
                totalBs: parseFloat(totalBs.toFixed(2)), 
                totalUsd: parseFloat(totalUsd.toFixed(2)), 
                soldBy: user.id, 
                userRole: user.role, 
                exchangeRateAtSale: exchangeRate 
            };

            batch.set(newSaleRef, saleRecord);
            try {
                await batch.commit();
                setCurrentSaleProducts([]);
                setSaleDate(getLocalFormattedDate());
                showNotification("Venta completada exitosamente.", "success");
            } catch (e) {
                console.error("Error al completar la venta:", e);
                showNotification(`Error al completar la venta: ${e.message}`, "error");
            }
        });
    };

    const handleDeleteSale = (saleId, saleItems) => {
        showConfirmationModal("Eliminar Venta", "¿Estás seguro de eliminar esta venta? Esto revertirá el stock.", async () => {
            const batch = writeBatch(db);
            const saleDocRef = doc(db, `artifacts/${appId}/tenants/${user.storeId}/sales`, saleId);
            batch.delete(saleDocRef);
            for (const item of saleItems) {
                const productRef = doc(db, `artifacts/${appId}/tenants/${user.storeId}/products`, item.productId);
                const productDoc = await getDoc(productRef);
                if (productDoc.exists()) {
                    const currentQuantity = productDoc.data().quantity;
                    batch.update(productRef, { quantity: currentQuantity + item.quantitySold });
                }
            }
            try {
                await batch.commit();
                showNotification("Venta eliminada y stock revertido.", "success");
            } catch (e) {
                console.error("Error deleting sale:", e);
                showNotification("Error al eliminar la venta.", "error");
            }
        });
    };

    const totalCurrentSaleBs = currentSaleProducts.reduce((sum, item) => sum + (item.priceBs * item.quantitySold), 0);
    const totalCurrentSaleUsd = currentSaleProducts.reduce((sum, item) => sum + (item.priceUsd * item.quantitySold), 0);
    
    if (user?.role === 'super_usuario') {
        return <div className={`${currentThemeColors.cardBg} p-8 rounded-xl text-center`}>El superusuario no gestiona ventas de tiendas.</div>;
    }
    if (loading) return <div className={`${currentThemeColors.textColor} text-xl`}>Cargando...</div>;
    
    return (
        <div className={`${currentThemeColors.cardBg} backdrop-filter backdrop-blur-lg p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-6xl`}>
             <h2 className={`${currentThemeColors.textColor} text-3xl font-bold mb-6 text-center`}>Gestión de Ventas</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={`${currentThemeColors.cardBg} p-6 rounded-xl shadow-xl`}>
                    <h3 className={`${currentThemeColors.textColor} text-2xl font-bold mb-4`}>Realizar Nueva Venta</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="saleDate" className={`block ${currentThemeColors.textColor} text-sm font-semibold mb-1`}>Fecha de Venta:</label>
                            <input type="date" id="saleDate" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className={`w-full p-3 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`}/>
                        </div>
                        <div className="relative">
                            <label htmlFor="productSearch" className={`block ${currentThemeColors.textColor} text-sm font-semibold mb-1`}>Buscar Producto:</label>
                            <input type="text" id="productSearch" value={searchProductQuery} onChange={(e) => setSearchProductQuery(e.target.value)} placeholder="Escribe para buscar..." className={`w-full p-3 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`}/>
                            {filteredProducts.length > 0 && <ul className={`absolute z-10 w-full ${currentThemeColors.modalBg} border ${currentThemeColors.inputBorder} rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg`}>
                                {filteredProducts.map(product => <li key={product.id} onClick={() => handleProductSelect(product)} className={`p-3 cursor-pointer hover:bg-purple-100 ${currentThemeColors.modalText}`}>
                                    {product.description} (Stock: {formatNumberForDisplay(product.quantity)})
                                </li>)}
                            </ul>}
                        </div>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="quantitySold" className={`block ${currentThemeColors.textColor} text-sm font-semibold mb-1`}>Cantidad:</label>
                        <input type="number" id="quantitySold" value={quantitySold} onChange={(e) => setQuantitySold(e.target.value)} className={`w-full p-3 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} min="1" disabled={!selectedProduct} />
                    </div>
                    <button onClick={handleAddProductToSale} className={`w-full px-6 py-3 ${currentThemeColors.infoButtonBg} ${currentThemeColors.textColor} rounded-xl shadow-lg`} disabled={!selectedProduct}>Añadir a la Venta</button>
                    {currentSaleProducts.length > 0 && <div className="mt-6">
                        <h4 className={`${currentThemeColors.textColor} text-xl font-semibold mb-3`}>Productos en Venta:</h4>
                        <ul className="space-y-2 mb-4">
                            {currentSaleProducts.map(item => <li key={item.id} className={`grid grid-cols-[2fr_1fr_1fr_min-content] gap-2 items-center ${currentThemeColors.cardBg} p-3 rounded-lg`}>
                                <span>{item.description}</span>
                                <span className="text-center">{formatNumberForDisplay(item.quantitySold)}</span>
                                <span className="font-semibold text-right">{formatCurrencyBs(item.priceBs * item.quantitySold)}</span>
                                <button onClick={() => handleRemoveProductFromSale(item.id)} className={`p-1 ${currentThemeColors.dangerButtonBg} rounded-full`}><MinusCircle size={16} /></button>
                            </li>)}
                        </ul>
                        <div className={`${currentThemeColors.textColor} text-lg font-bold text-right mt-4`}>Total: {formatCurrencyBs(totalCurrentSaleBs)} / {formatCurrencyUsd(totalCurrentSaleUsd)}</div>
                        <button onClick={handleCompleteSale} className={`w-full px-6 py-3 ${currentThemeColors.successButtonBg} ${currentThemeColors.textColor} rounded-xl shadow-lg mt-4`}>Completar Venta</button>
                    </div>}
                </div>
                <div className={`${currentThemeColors.cardBg} p-6 rounded-xl shadow-xl`}>
                    <h3 className={`${currentThemeColors.textColor} text-2xl font-bold mb-4`}>Historial de Ventas (Hoy)</h3>
                    {sales.length === 0 ? <p>No hay ventas registradas para el día de hoy.</p> : <div className="overflow-y-auto max-h-96 pr-2">
                        {sales.map(sale => <div key={sale.id} className={`${currentThemeColors.cardBg} p-4 rounded-lg mb-3 shadow-md`}>
                            <p className="text-sm font-semibold">Fecha: {new Date(sale.timestamp).toLocaleString()}</p>
                            <p className="text-sm">Vendido por: {sale.userRole}</p>
                            <ul className="space-y-1 mt-2">
                                {sale.items.map((item, idx) => <li key={idx} className="text-sm">{item.description} x {item.quantitySold} @ {formatCurrencyBs(item.priceAtSaleBs)}</li>)}
                            </ul>
                            <p className="font-bold text-right mt-2">Total: {formatCurrencyBs(sale.totalBs)}</p>
                            {canDeleteSales && <button onClick={() => handleDeleteSale(sale.id, sale.items)} className={`mt-2 px-3 py-1 text-xs ${currentThemeColors.dangerButtonBg} rounded-full`}><XCircle size={16} className="inline mr-1"/>Eliminar</button>}
                        </div>)}
                    </div>}
                </div>
            </div>
        </div>
    );
};

export default Sales;