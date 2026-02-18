import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Letters } from './pages/Letters';
import { Mailing } from './pages/Mailing';
import { Settings } from './pages/Settings';
import { SPKManagement } from './pages/SPKManagement';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar isOpen={sidebarOpen} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <>
                <Header onMenuToggle={handleMenuToggle} title="Dashboard" />
                <div className="content">
                  <Dashboard />
                </div>
              </>
            } />
            <Route path="/customers" element={
              <>
                <Header onMenuToggle={handleMenuToggle} title="Pelanggan" />
                <div className="content">
                  <Customers />
                </div>
              </>
            } />
            <Route path="/letters" element={
              <>
                <Header onMenuToggle={handleMenuToggle} title="Surat" />
                <div className="content">
                  <Letters />
                </div>
              </>
            } />
            <Route path="/mailing" element={
              <>
                <Header onMenuToggle={handleMenuToggle} title="Mailing" />
                <div className="content">
                  <Mailing />
                </div>
              </>
            } />
            <Route path="/spk" element={
              <>
                <Header onMenuToggle={handleMenuToggle} title="Manajemen SPK" />
                <div className="content">
                  <SPKManagement />
                </div>
              </>
            } />
            <Route path="/settings" element={
              <>
                <Header onMenuToggle={handleMenuToggle} title="Pengaturan" />
                <div className="content">
                  <Settings />
                </div>
              </>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;