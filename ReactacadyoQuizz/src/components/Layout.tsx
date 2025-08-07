import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';


function Layout() {
  return (
    <div className="App">
      {/* Configuration du Toaster pour les notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Outlet pour afficher le contenu des routes */}
      <Outlet />
    </div>
  );
}

export default Layout; 