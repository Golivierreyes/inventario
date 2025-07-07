// src/components/settings/UserManagement.js
import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { AppContext } from '../../context/AppContext';
import { Trash2, UserPlus } from 'lucide-react';

const UserManagement = ({ storeId }) => {
    const { db, showNotification, currentThemeColors, showConfirmationModal } = useContext(AppContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('empleado');

    const isFormDisabled = !storeId;

    useEffect(() => {
        if (!db || !storeId) {
            setUsers([]);
            return;
        }
        setLoading(true);
        const usersColRef = collection(db, `users`);
        const q = query(usersColRef, where("storeId", "==", storeId));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (err) => {
            showNotification("Error al cargar usuarios de la tienda.", "error");
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, storeId, showNotification]);

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (isFormDisabled) return;
        if (!newUsername.trim() || !newPassword.trim()) {
            showNotification('Todos los campos son requeridos.', 'error');
            return;
        }

        const email = `${newUsername.trim().toLowerCase().replace(/\s+/g, '')}.${storeId.substring(0, 5)}@inventory.app`;

        showConfirmationModal(
            "Confirmar Creación de Usuario",
            `Se creará una cuenta para '${newUsername}' con el email de acceso '${email}'. ¿Continuar?`,
            async () => {
                try {
                    // --- CORRECCIÓN: Llamada a la función de Vercel en lugar de Firebase ---
                    const response = await fetch('/api/createUser', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email,
                            password: newPassword,
                            username: newUsername.trim(),
                            role: newUserRole,
                            storeId: storeId,
                        }),
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        // Si la respuesta del servidor no es exitosa, lanza un error
                        throw new Error(result.error || 'Ocurrió un error en el servidor.');
                    }
                    
                    showNotification(`Usuario '${newUsername}' creado exitosamente.`, 'success');
                    setNewUsername('');
                    setNewPassword('');
                } catch (error) {
                    console.error("Error al crear usuario:", error);
                    showNotification(error.message, 'error');
                }
            }
        );
    };
    
    const handleDeleteUser = async (userId, username) => {
        showConfirmationModal(
            "Eliminar Usuario",
            `¿Estás seguro de eliminar a '${username}'? Esta acción es permanente.`,
            async () => {
                try {
                    // --- CORRECCIÓN: Llamada a la función de Vercel para eliminar ---
                    // (Necesitarás crear un archivo /api/deleteUser.js similar al de createUser)
                    const response = await fetch('/api/deleteUser', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ uid: userId }),
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.error || 'Ocurrió un error en el servidor.');
                    }
                    
                    showNotification(`Usuario '${username}' eliminado.`, 'success');
                } catch (error) {
                    console.error("Error al eliminar usuario:", error);
                    showNotification(error.message, 'error');
                }
            }
        );
    };

    return (
        <div className={isFormDisabled ? 'opacity-50' : ''}>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
                <div>
                    <label className={`${currentThemeColors.textColor}`}>Usuario:</label>
                    <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} disabled={isFormDisabled} className={`w-full p-2 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText} disabled:bg-gray-600 disabled:cursor-not-allowed`} required />
                </div>
                <div>
                    <label className={`${currentThemeColors.textColor}`}>Contraseña:</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={isFormDisabled} className={`w-full p-2 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText} disabled:bg-gray-600 disabled:cursor-not-allowed`} required />
                </div>
                <div>
                    <label className={`${currentThemeColors.textColor}`}>Rol:</label>
                    <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} disabled={isFormDisabled} className={`w-full p-2 rounded-lg ${currentThemeColors.inputBg} border ${currentThemeColors.inputBorder} ${currentThemeColors.modalText} disabled:bg-gray-600 disabled:cursor-not-allowed`}>
                        <option value="empleado">Empleado</option>
                        <option value="administrador">Administrador</option>
                    </select>
                </div>
                <button type="submit" disabled={isFormDisabled} className={`p-3 ${currentThemeColors.successButtonBg} rounded-lg flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed`}>
                    <UserPlus size={18} className="mr-2"/> Agregar
                </button>
            </form>

            <div className="overflow-x-auto">
                 <table className="min-w-full">
                    <thead>
                        <tr className={`${currentThemeColors.tableHeaderBg}`}>
                            <th className="p-3 text-left">Usuario (Email de Acceso)</th>
                            <th className="p-3 text-left">Rol</th>
                            <th className="p-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" className="text-center p-4">Cargando...</td></tr>
                        ) : users.length === 0 && storeId ? (
                             <tr><td colSpan="3" className="text-center p-4 opacity-70">No hay usuarios en esta tienda.</td></tr>
                        ) : (
                            users.map(u => (
                                <tr key={u.id} className={`border-b ${currentThemeColors.tableBorder}`}>
                                    <td className="p-2">{u.username} <span className="text-xs opacity-70">({u.email})</span></td>
                                    <td className="p-2">{u.role}</td>
                                    <td className="p-2 text-center">
                                        <button onClick={() => handleDeleteUser(u.id, u.username)} className={`p-2 ${currentThemeColors.dangerButtonBg} rounded-full`}>
                                            <Trash2 size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                 </table>
            </div>
        </div>
    );
};

export default UserManagement;
