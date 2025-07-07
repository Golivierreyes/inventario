// src/components/Reports.js
import React, { useState, useEffect, useContext } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { AppContext } from '../context/AppContext';
import { formatCurrencyBs, formatCurrencyUsd, formatNumberForDisplay, getEffectivePermissions } from '../utils/helpers';
import { Lock } from 'lucide-react';

const Reports = () => {
    // --- CORRECCIÓN: Obtener el storeId del usuario ---
    const { db, user, rolePermissions, showNotification, currentThemeColors } = useContext(AppContext);
    
    const effectivePermissions = getEffectivePermissions(user, rolePermissions);
    const canViewReports = effectivePermissions.canViewReports;

    const [products, setProducts] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    // ... (otros estados)
    const [error, setError] = useState('');
    const [reportType, setReportType] = useState('daily');
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id-local';

    useEffect(() => {
        // --- CORRECCIÓN: Se añade user.storeId a las comprobaciones ---
        if (!db || !user?.storeId || !canViewReports) {
            setLoading(false);
            return;
        }
        setLoading(true);

        // --- CORRECCIÓN CLAVE: Rutas específicas de la tienda ---
        const productsColRef = collection(db, `artifacts/${appId}/tenants/${user.storeId}/products`);
        const salesColRef = collection(db, `artifacts/${appId}/tenants/${user.storeId}/sales`);

        const unsubProducts = onSnapshot(query(productsColRef), (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (err) => {
            setError("Error al cargar productos.");
            setLoading(false);
        });

        const unsubSales = onSnapshot(query(salesColRef), (snapshot) => {
            setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => {
            showNotification("Error al cargar ventas.", "error");
        });

        return () => { unsubProducts(); unsubSales(); };
    }, [db, user, canViewReports, appId, showNotification]);

    // ... (El resto del componente, incluyendo getReportData y el JSX, se mantiene igual)
    const getReportData = () => {
        let title = '';
        let data = [];
        let totalSalesBs = 0;
        let totalSalesUsd = 0;
        let totalProfitBs = 0;
        let totalProfitUsd = 0;
        let filteredSales = [];
        let aggregatedSoldProducts = [];
        const now = new Date();

        switch (reportType) {
            case 'daily':
                title = `Informe de Ventas (${selectedDate})`;
                filteredSales = sales.filter(sale => sale.saleDate === selectedDate);
                break;
            case 'daily_products':
                if (startDate && endDate) {
                    title = `Productos Vendidos (Desde ${startDate} a ${endDate})`;
                    filteredSales = sales.filter(sale => sale.saleDate >= startDate && sale.saleDate <= endDate);
                } else {
                    title = 'Productos Vendidos (Seleccione un rango)';
                    filteredSales = [];
                }
                const productMap = new Map();
                filteredSales.forEach(sale => {
                    sale.items.forEach(item => {
                        const { productCode, description, quantitySold } = item;
                        if (productMap.has(productCode)) {
                            productMap.get(productCode).quantitySold += quantitySold;
                        } else {
                            productMap.set(productCode, { productCode, description, quantitySold });
                        }
                    });
                });
                aggregatedSoldProducts = Array.from(productMap.values());
                break;
            case 'weekly':
                title = 'Informe Semanal';
                const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
                filteredSales = sales.filter(sale => {
                    const saleDateObj = new Date(sale.timestamp);
                    return saleDateObj >= startOfWeek && saleDateObj <= endOfWeek;
                });
                break;
            case 'annual':
                title = `Informe Anual (${now.getFullYear()})`;
                filteredSales = sales.filter(sale => new Date(sale.timestamp).getFullYear() === now.getFullYear());
                break;
            case 'range':
            case 'profit':
                if (startDate && endDate) {
                    title = `Informe (Desde ${startDate} a ${endDate})`;
                    filteredSales = sales.filter(sale => sale.saleDate >= startDate && sale.saleDate <= endDate);
                }
                break;
            default:
                break;
        }

        totalSalesBs = filteredSales.reduce((sum, sale) => sum + (sale.totalBs || 0), 0);
        totalSalesUsd = filteredSales.reduce((sum, sale) => sum + (sale.totalUsd || 0), 0);
        if (reportType === 'profit') {
            title = `Informe de Ganancias (Desde ${startDate || 'Inicio'} a ${endDate || 'Fin'})`;
            totalProfitBs = filteredSales.reduce((sum, sale) => {
                    return sum + sale.items.reduce((itemSum, item) => {
                        return itemSum + (item.priceAtSaleBs - (item.purchasePriceAtSaleBs || 0)) * item.quantitySold;
                    }, 0);
                }, 0);
            totalProfitUsd = filteredSales.reduce((sum, sale) => {
                    return sum + sale.items.reduce((itemSum, item) => {
                        return itemSum + (item.priceAtSaleUsd - (item.purchasePriceAtSaleUsd || 0)) * item.quantitySold;
                    }, 0);
                }, 0);
        }
        data = products;

        return { title, data, totalSalesBs, totalSalesUsd, totalProfitBs, totalProfitUsd, filteredSales, aggregatedSoldProducts };
    };

    const { title, data, totalSalesBs, totalSalesUsd, totalProfitBs, totalProfitUsd, filteredSales, aggregatedSoldProducts } = getReportData();

    if (loading) return <div className={`${currentThemeColors.textColor} text-xl`}>Cargando...</div>;
    if (error) return <div className="text-red-300 text-xl">{error}</div>;

    if (!canViewReports) {
        return (
            <div className={`${currentThemeColors.cardBg} backdrop-filter backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md text-center`}>
                <Lock size={60} className="text-red-300 mx-auto mb-4" />
                <h2 className={`${currentThemeColors.textColor} text-3xl font-bold mb-4`}>Acceso Restringido</h2>
                <p className={`${currentThemeColors.textColor} text-lg mb-4`}>No tienes permisos para ver los informes.</p>
            </div>
        );
    }
    
    return (
        <div className={`${currentThemeColors.cardBg} backdrop-filter backdrop-blur-lg p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-4xl`}>
            <h2 className={`${currentThemeColors.textColor} text-3xl font-bold mb-6 text-center`}>Informes de Inventario</h2>

            <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
                <button onClick={() => setReportType('daily')} className={`px-5 py-2 rounded-xl shadow-md ${reportType === 'daily' ? currentThemeColors.buttonBg : currentThemeColors.cardBg}`}>Ventas Diarias</button>
                <button onClick={() => setReportType('daily_products')} className={`px-5 py-2 rounded-xl shadow-md ${reportType === 'daily_products' ? currentThemeColors.buttonBg : currentThemeColors.cardBg}`}>Productos Vendidos</button>
                <button onClick={() => setReportType('weekly')} className={`px-5 py-2 rounded-xl shadow-md ${reportType === 'weekly' ? currentThemeColors.buttonBg : currentThemeColors.cardBg}`}>Semanal</button>
                <button onClick={() => setReportType('annual')} className={`px-5 py-2 rounded-xl shadow-md ${reportType === 'annual' ? currentThemeColors.buttonBg : currentThemeColors.cardBg}`}>Anual</button>
                <button onClick={() => setReportType('range')} className={`px-5 py-2 rounded-xl shadow-md ${reportType === 'range' ? currentThemeColors.buttonBg : currentThemeColors.cardBg}`}>Rango</button>
                <button onClick={() => setReportType('profit')} className={`px-5 py-2 rounded-xl shadow-md ${reportType === 'profit' ? currentThemeColors.buttonBg : currentThemeColors.cardBg}`}>Ganancias</button>
            </div>
            
            {reportType === 'daily' && (
                <div className="flex justify-center mb-4">
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={`p-2 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} />
                </div>
            )}
            {(reportType === 'range' || reportType === 'profit' || reportType === 'daily_products') && (
                <div className="flex justify-center flex-col sm:flex-row gap-2 mb-4">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`p-2 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} title="Fecha de inicio" />
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`p-2 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText}`} title="Fecha de fin" />
                </div>
            )}

            <h3 className={`${currentThemeColors.textColor} text-2xl font-semibold mb-4 text-center`}>{title}</h3>

            {(reportType !== 'daily_products') && (
                <div className={`${currentThemeColors.cardBg} p-4 rounded-xl mb-6 text-center`}>
                    <p>Ventas Totales: {formatCurrencyBs(totalSalesBs)} / {formatCurrencyUsd(totalSalesUsd)}</p>
                    {reportType === 'profit' && <p className="mt-2">Ganancia Total: {formatCurrencyBs(totalProfitBs)} / {formatCurrencyUsd(totalProfitUsd)}</p>}
                </div>
            )}

            {reportType === 'daily_products' ? (
                <div className="overflow-x-auto rounded-xl shadow-lg">
                    <table className={`min-w-full ${currentThemeColors.cardBg} rounded-xl`}>
                        <thead><tr className={`${currentThemeColors.tableHeaderBg}`}>
                            <th className="py-3 px-4 text-left">Código</th>
                            <th className="py-3 px-4 text-left">Descripción</th>
                            <th className="py-3 px-4 text-center">Cantidad Vendida</th>
                        </tr></thead>
                        <tbody>
                            {aggregatedSoldProducts.length > 0 ? aggregatedSoldProducts.map((p, i) => <tr key={i} className={`border-b ${currentThemeColors.tableBorder}`}>
                                <td className="py-3 px-4">{p.productCode}</td>
                                <td className="py-3 px-4">{p.description}</td>
                                <td className="py-3 px-4 text-center">{formatNumberForDisplay(p.quantitySold)}</td>
                            </tr>) : <tr><td colSpan="3" className="text-center py-4">No se vendieron productos en este rango de fechas.</td></tr>}
                        </tbody>
                    </table>
                </div>
            ) : reportType !== 'profit' ? (
                <div className="overflow-x-auto rounded-xl shadow-lg">
                    <h4 className={`${currentThemeColors.textColor} text-xl font-semibold my-4 text-center`}>Stock Actual</h4>
                    <table className={`min-w-full ${currentThemeColors.cardBg} rounded-xl`}>
                        <thead><tr className={`${currentThemeColors.tableHeaderBg}`}>
                            <th className="py-3 px-4 text-left">Descripción</th>
                            <th className="py-3 px-4 text-center">Cantidad</th>
                            <th className="py-3 px-4">Unidad</th>
                            <th className="py-3 px-4">Valor Total (Bs)</th>
                        </tr></thead>
                        <tbody>{data.map(p => <tr key={p.id} className={`border-b ${currentThemeColors.tableBorder}`}>
                            <td className="py-3 px-4">{p.description}</td>
                            <td className="py-3 px-4 text-center">{formatNumberForDisplay(p.quantity)}</td>
                            <td className="py-3 px-4">{p.unitType}</td>
                            <td className="py-3 px-4">{formatCurrencyBs(p.quantity * p.priceBs)}</td>
                        </tr>)}</tbody>
                    </table>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl shadow-lg">
                    <h4 className={`${currentThemeColors.textColor} text-xl font-semibold my-4 text-center`}>Detalle de Ganancias</h4>
                     <table className={`min-w-full ${currentThemeColors.cardBg} rounded-xl`}>
                        <thead><tr className={`${currentThemeColors.tableHeaderBg}`}>
                            <th className="py-3 px-4">Fecha</th>
                            <th className="py-3 px-4">Artículo</th>
                            <th className="py-3 px-4">Cantidad</th>
                            <th className="py-3 px-4">P. Venta</th>
                            <th className="py-3 px-4">P. Compra</th>
                            <th className="py-3 px-4">Ganancia</th>
                        </tr></thead>
                        <tbody>{filteredSales.flatMap(sale => sale.items.map((item, idx) => <tr key={`${sale.id}-${idx}`} className={`border-b ${currentThemeColors.tableBorder}`}>
                            <td className="py-3 px-4">{new Date(sale.timestamp).toLocaleDateString()}</td>
                            <td className="py-3 px-4">{item.description}</td>
                            <td className="py-3 px-4">{item.quantitySold}</td>
                            <td className="py-3 px-4">{formatCurrencyBs(item.priceAtSaleBs)}</td>
                            <td className="py-3 px-4">{formatCurrencyBs(item.purchasePriceAtSaleBs || 0)}</td>
                            <td className="py-3 px-4">{formatCurrencyBs((item.priceAtSaleBs - (item.purchasePriceAtSaleBs || 0)) * item.quantitySold)}</td>
                        </tr>))}</tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Reports;