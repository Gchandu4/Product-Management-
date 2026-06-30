import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage        from './pages/LoginPage.jsx';
import Layout           from './components/Layout.jsx';
import DashboardPage    from './pages/DashboardPage.jsx';
import ProductsPage     from './pages/ProductsPage.jsx';
import CategoriesPage   from './pages/CategoriesPage.jsx';
import StockHistoryPage from './pages/StockHistoryPage.jsx';
import SaleRequestsPage from './pages/SaleRequestsPage.jsx';
import UsersPage        from './pages/UsersPage.jsx';

const Private = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const AdminOnly = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/products" replace />;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  // Reception has no Dashboard access — send them straight to Products
  const target = user?.role === 'reception' ? '/products' : '/dashboard';
  return <Navigate to={target} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Private><Layout /></Private>}>
          <Route index element={<HomeRedirect />} />
          <Route path="dashboard"  element={<DashboardPage />} />
          <Route path="products"   element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="stock"      element={<StockHistoryPage />} />
          <Route path="requests"   element={<SaleRequestsPage />} />
          <Route path="users"      element={<AdminOnly><UsersPage /></AdminOnly>} />
        </Route>
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </AuthProvider>
  );
}
