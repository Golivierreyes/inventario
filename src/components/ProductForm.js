// src/components/ProductForm.js
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';

const ProductForm = ({ product, onSave, onCancel, allProducts }) => {
    const { customCategories, currentThemeColors, exchangeRate, showNotification } = useContext(AppContext);
    
    const [description, setDescription] = useState(product ? product.description : '');
    const [quantity, setQuantity] = useState(product ? product.quantity : '0');
    const [productCode, setProductCode] = useState(product ? product.productCode : '');
    const [unitType, setUnitType] = useState(product ? product.unitType : 'unidad');
    const [category, setCategory] = useState(product ? product.category : 'General');
    const [error, setError] = useState('');

    const [priceBs, setPriceBs] = useState(product ? String(product.priceBs) : '0');
    const [priceUsd, setPriceUsd] = useState(product ? String(product.priceUsd) : '0');
    const [purchasePriceBs, setPurchasePriceBs] = useState(product ? String(product.purchasePriceBs) : '0');
    const [purchasePriceUsd, setPurchasePriceUsd] = useState(product ? String(product.purchasePriceUsd) : '0');

    const unitOptions = useMemo(() => ['unidad', 'kg', 'litro', 'metro', 'caja', 'paquete', 'galon'], []);
    const categoryOptions = useMemo(() => ['General', ...customCategories.map(cat => cat.name)], [customCategories]);

    useEffect(() => {
        if (product) {
            setDescription(product.description);
            setQuantity(String(product.quantity || '0'));
            setProductCode(product.productCode);
            setUnitType(product.unitType);
            setCategory(categoryOptions.includes(product.category) ? product.category : 'General');
            setPriceBs(String(product.priceBs || '0'));
            setPriceUsd(String(product.priceUsd || '0'));
            setPurchasePriceBs(String(product.purchasePriceBs || '0'));
            setPurchasePriceUsd(String(product.purchasePriceUsd || '0'));
        }
    }, [product, categoryOptions]);

    const handlePriceBsChange = (e) => {
        const bsValue = e.target.value;
        setPriceBs(bsValue);
        if (bsValue && !isNaN(bsValue) && exchangeRate > 0) {
            const usdValue = (parseFloat(bsValue) / exchangeRate).toFixed(2);
            setPriceUsd(usdValue);
        } else {
            setPriceUsd('0');
        }
    };

    const handlePriceUsdChange = (e) => {
        const usdValue = e.target.value;
        setPriceUsd(usdValue);
        if (usdValue && !isNaN(usdValue) && exchangeRate > 0) {
            const bsValue = (parseFloat(usdValue) * exchangeRate).toFixed(2);
            setPriceBs(bsValue);
        } else {
            setPriceBs('0');
        }
    };
    
    const handlePurchasePriceBsChange = (e) => {
        const bsValue = e.target.value;
        setPurchasePriceBs(bsValue);
        if (bsValue && !isNaN(bsValue) && exchangeRate > 0) {
            const usdValue = (parseFloat(bsValue) / exchangeRate).toFixed(2);
            setPurchasePriceUsd(usdValue);
        } else {
            setPurchasePriceUsd('0');
        }
    };

    const handlePurchasePriceUsdChange = (e) => {
        const usdValue = e.target.value;
        setPurchasePriceUsd(usdValue);
        if (usdValue && !isNaN(usdValue) && exchangeRate > 0) {
            const bsValue = (parseFloat(usdValue) * exchangeRate).toFixed(2);
            setPurchasePriceBs(bsValue);
        } else {
            setPurchasePriceBs('0');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        
        const numericQuantity = Number(quantity);
        const numericPriceBs = Number(priceBs);
        const numericPriceUsd = Number(priceUsd);
        const numericPurchasePriceBs = Number(purchasePriceBs);
        const numericPurchasePriceUsd = Number(purchasePriceUsd);

        if (!description || numericQuantity < 0 || numericPriceBs < 0 || numericPriceUsd < 0 || numericPurchasePriceBs < 0 || numericPurchasePriceUsd < 0 || !productCode || !unitType || !category) {
            setError("Por favor, completa todos los campos con valores válidos.");
            showNotification("Datos inválidos en el formulario.", "error");
            return;
        }
        
        const isProductCodeUnique = allProducts.every(p => p.productCode !== productCode || (product && p.id === product.id));
        if (!isProductCodeUnique) {
            setError("Este Código de Producto ya existe. Por favor, elige uno diferente.");
            showNotification("Código de producto duplicado.", "error");
            return;
        }

        onSave({
            ...(product && { id: product.id }),
            description,
            quantity: numericQuantity,
            priceBs: numericPriceBs,
            priceUsd: numericPriceUsd,
            purchasePriceBs: numericPurchasePriceBs,
            purchasePriceUsd: numericPurchasePriceUsd,
            productCode: String(productCode),
            unitType,
            category
        });
    };

    return (
        <div className={`${currentThemeColors.cardBg} p-6 rounded-xl shadow-xl w-full max-w-lg mx-auto`}>
            <h3 className={`${currentThemeColors.textColor} text-2xl font-bold mb-4 text-center`}>{product ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h3>
            {error && <p className="text-red-300 mb-4 text-center">{error}</p>}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label htmlFor="description" className={`block ${currentThemeColors.textColor} text-sm font-semibold mb-1`}>Descripción:</label>
                    <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} className={`w-full p-3 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} required />
                </div>
                <div>
                    <label htmlFor="productCode" className={`block ${currentThemeColors.textColor} text-sm font-semibold mb-1`}>Código de Producto:</label>
                    <input type="text" id="productCode" value={productCode} onChange={(e) => setProductCode(e.target.value)} className={`w-full p-3 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} required />
                </div>
                <div>
                    <label htmlFor="quantity" className={`block ${currentThemeColors.textColor} text-sm font-semibold mb-1`}>Cantidad:</label>
                    <input type="number" id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={`w-full p-3 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} min="0" required />
                </div>
                <div>
                    <label htmlFor="category" className={`block ${currentThemeColors.textColor} text-sm font-semibold mb-1`}>Categoría:</label>
                    <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full p-3 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} required>
                        {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="unitType" className={`block ${currentThemeColors.textColor} text-sm font-semibold mb-1`}>Unidad:</label>
                    <select id="unitType" value={unitType} onChange={(e) => setUnitType(e.target.value)} className={`w-full p-3 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} required>
                        {unitOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="purchasePriceBs" className={`block ${currentThemeColors.textColor} text-sm font-semibold mb-1`}>Precio de Compra (Bs):</label>
                    <input type="number" id="purchasePriceBs" value={purchasePriceBs} onChange={handlePurchasePriceBsChange} className={`w-full p-3 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} step="0.01" min="0" required />
                </div>
                <div>
                    <label htmlFor="purchasePriceUsd" className={`block ${currentThemeColors.textColor} text-sm font-semibold mb-1`}>Precio de Compra ($):</label>
                    <input type="number" id="purchasePriceUsd" value={purchasePriceUsd} onChange={handlePurchasePriceUsdChange} className={`w-full p-3 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} step="0.01" min="0" required />
                </div>
                <div>
                    <label htmlFor="priceBs" className={`block ${currentThemeColors.textColor} text-sm font-semibold mb-1`}>Precio de Venta (Bs):</label>
                    <input type="number" id="priceBs" value={priceBs} onChange={handlePriceBsChange} className={`w-full p-3 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} step="0.01" min="0" required />
                </div>
                <div>
                    <label htmlFor="priceUsd" className={`block ${currentThemeColors.textColor} text-sm font-semibold mb-1`}>Precio de Venta ($):</label>
                    <input type="number" id="priceUsd" value={priceUsd} onChange={handlePriceUsdChange} className={`w-full p-3 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} step="0.01" min="0" required />
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                    <button type="button" onClick={onCancel} className={`px-5 py-2 bg-gray-500 text-white rounded-xl`}>Cancelar</button>
                    <button type="submit" className={`px-5 py-2 ${currentThemeColors.buttonBg} ${currentThemeColors.textColor} rounded-xl`}>Guardar Producto</button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
