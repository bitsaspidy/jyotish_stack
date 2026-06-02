import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ComingSoon from './pages/ComingSoon';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import api from './lib/api';

// Protected route wrapper
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin-slow text-4xl">🪐</div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const [maintenance, setMaintenance] = useState(null);

  const toggleLang = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    localStorage.setItem('lang', next);
  };

  useEffect(() => {
    api.get('/settings/public')
      .then(({ data }) => {
        const s = data.settings;
        if (s.maintenance_mode === 'true') {
          setMaintenance({ title: s.maintenance_title, message: s.maintenance_message, message_hi: s.maintenance_message_hi });
        } else {
          setMaintenance(false);
        }
      })
      .catch(() => setMaintenance(false));
  }, []);

  // While checking maintenance status
  if (maintenance === null) return (
    <div className="min-h-screen flex items-center justify-center bg-cosmos-800">
      <div className="text-center">
        <div className="text-5xl animate-float">🪐</div>
        <p className="text-gold/50 text-sm mt-4 tracking-widest">JYOTISH STACK AI</p>
      </div>
    </div>
  );

  // Maintenance mode — show coming soon (with lang toggle still available)
  if (maintenance) return (
    <ComingSoon lang={lang} title={maintenance.title} message={maintenance.message} messageHi={maintenance.message_hi} />
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar lang={lang} onLangToggle={toggleLang} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home lang={lang} />} />
          <Route path="/login" element={<Login lang={lang} />} />
          <Route path="/register" element={<Register lang={lang} />} />
          <Route path="/dashboard" element={<Protected><Dashboard lang={lang} /></Protected>} />
          {/* Placeholder routes — will be added with feature PDFs */}
          <Route path="/kundli/*" element={<Protected><ComingSoonPage lang={lang} title="Kundli" /></Protected>} />
          <Route path="/predictions" element={<Protected><ComingSoonPage lang={lang} title="Predictions" /></Protected>} />
          <Route path="/matchmaking" element={<Protected><ComingSoonPage lang={lang} title="Matchmaking" /></Protected>} />
          <Route path="/pricing" element={<Home lang={lang} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer lang={lang} />
    </div>
  );
}

// Minimal placeholder for unbuilt pages
function ComingSoonPage({ lang, title }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20">
      <p className="text-6xl mb-6 animate-float">🪐</p>
      <h2 className="font-serif text-3xl text-gradient-gold mb-3">{title}</h2>
      <p className="text-ivory/50">{lang === 'hi' ? 'यह सुविधा जल्द आ रही है।' : 'This feature is coming soon.'}</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
