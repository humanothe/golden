
import React from 'react';
import { Navigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
    // Redireccionamos fuera si alguien intenta acceder por URL manual
    // En el futuro, este archivo puede ser borrado físicamente del proyecto
    return <Navigate to="/dashboard" replace />;
};
