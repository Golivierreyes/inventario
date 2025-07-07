// src/components/settings/DataToolsTab.js
import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
// --- CORRECCIÓN: Se elimina 'RefreshCw' de la importación ya que no se usa ---
import { Download, Upload } from 'lucide-react';

const DataToolsTab = () => {
    const { currentThemeColors, exportData, importData } = useContext(AppContext);

    const handleImportClick = () => {
        const fileInput = document.getElementById('import-file-input');
        fileInput.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            importData(file);
        }
    };

    return (
        <div className={`${currentThemeColors.cardBg} p-6 rounded-xl shadow-xl`}>
            <h3 className={`${currentThemeColors.textColor} text-2xl font-bold mb-4`}>Herramientas de Datos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={exportData} className={`p-4 ${currentThemeColors.infoButtonBg} rounded-lg flex items-center justify-center`}>
                    <Download size={20} className="mr-2" /> Exportar Datos
                </button>
                <button onClick={handleImportClick} className={`p-4 ${currentThemeColors.successButtonBg} rounded-lg flex items-center justify-center`}>
                    <Upload size={20} className="mr-2" /> Importar Datos
                </button>
                <input
                    type="file"
                    id="import-file-input"
                    className="hidden"
                    accept=".json"
                    onChange={handleFileChange}
                />
            </div>
            <p className="text-sm mt-4 opacity-80">
                La exportación generará un archivo JSON con todos los productos y configuraciones. La importación sobreescribirá los datos actuales con los del archivo seleccionado. Úsalo con precaución.
            </p>
        </div>
    );
};

export default DataToolsTab;