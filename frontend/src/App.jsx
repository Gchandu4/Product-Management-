import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage       from './pages/LoginPage.jsx';
import Layout          from './components/Layout.jsx';
import DashboardPage   from './pages/DashboardPage.jsx';
import ProductsPage    from './pages/ProductsPage.jsx';
import CategoriesPage  from './pages/CategoriesPage.jsx';
import StockHistoryPage from './pages/StockHistoryPage.jsx';

const Private = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Private><Layout /></Private>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<DashboardPage />} />
          <Route path="products"   element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="stock"      element={<StockHistoryPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
