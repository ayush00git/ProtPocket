import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ComplexDetailPage } from './pages/ComplexDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { MutationPage } from './pages/MutationPage';
import { Footer } from './components/layout/Footer';
import { LandingV3 } from './v3/LandingV3';

function LegacyShell() {
  return (
    <div className="flex flex-col min-h-screen bg-bg-primary font-body text-text-primary selection:bg-accent-dim selection:text-accent">
      <Navbar />
      <main className="flex-1 flex flex-col items-center w-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/complex/:id" element={<ComplexDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/mutation" element={<MutationPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/v3/*" element={<LandingV3 />} />
<Route path="/*" element={<LegacyShell />} />
      </Routes>
    </Router>
  );
}

export default App;
