import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import {
    Activity,
    AlertCircle,
    Bell,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Copy,
    Download,
    FileText,
    Headphones,
    Eye,
    Image as ImageIcon,
    LayoutDashboard,
    LoaderCircle,
    LogOut,
    Menu,
    MessageCircle,
    Plus,
    Search,
    Settings,
    ShieldCheck,
    MonitorUp,
    Trash2,
    X,
    Wrench,
} from 'lucide-react';
import './bootstrap';
import './app.css';

const AuthContext = createContext(null);
const states = ['pendiente', 'asignado', 'en_proceso', 'finalizado', 'cancelado'];
const stateLabels = {
    pendiente: 'Pendiente',
    asignado: 'Asignado',
    en_proceso: 'En proceso',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
};
const pageBackgrounds = [
    { key: 'dark', label: 'Oscuro', className: 'bg-[#0b141a]', mode: 'dark' },
    { key: 'light', label: 'Claro', className: 'bg-[#f8fafc]', themeClass: 'admin-theme-light' },
    { key: 'blue', label: 'Azul', className: 'bg-[#eef7ff]', themeClass: 'admin-theme-blue' },
    { key: 'green', label: 'Verde', className: 'bg-[#eefbf4]', themeClass: 'admin-theme-green' },
    { key: 'pink', label: 'Rosa', className: 'bg-[#fff1f7]', themeClass: 'admin-theme-pink' },
];
const adminThemeBodyClasses = ['admin-dark-theme', 'admin-light-theme', 'admin-theme-blue', 'admin-theme-green', 'admin-theme-pink'];
const APP_BASE_PATH = normalizeBasePath(import.meta.env.BASE_URL || '/');
const API_BASE_URL = resolveApiBaseUrl();
const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin;
const API_PUBLIC_BASE_PATH = resolveApiPublicBasePath(API_BASE_URL);
const PRODUCTION_STORAGE_BASE_URL = 'https://www.esyspos.com/soporte/api';

function useAuth() {
    return useContext(AuthContext);
}

function stateLabel(state) {
    return stateLabels[state] || String(state || '-').replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase());
}

function App() {
    const [token, setToken] = useState(localStorage.getItem('support_token'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('support_user') || 'null'));

    useEffect(() => {
        if (token) {
            window.axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        } else {
            delete window.axios.defaults.headers.common.Authorization;
        }
    }, [token]);

    const auth = useMemo(() => ({
        user,
        token,
        login: (payload) => {
            localStorage.setItem('support_token', payload.token);
            localStorage.setItem('support_user', JSON.stringify(payload.user));
            window.axios.defaults.headers.common.Authorization = `Bearer ${payload.token}`;
            setToken(payload.token);
            setUser(payload.user);
        },
        logout: async () => {
            try {
                await api.post('/logout');
            } catch {
                // The local session still needs to be cleared when the token is expired.
            }
            localStorage.removeItem('support_token');
            localStorage.removeItem('support_user');
            delete window.axios.defaults.headers.common.Authorization;
            setToken(null);
            setUser(null);
        },
    }), [token, user]);

    return (
        <AuthContext.Provider value={auth}>
            <BrowserRouter basename={APP_BASE_PATH === '/' ? undefined : APP_BASE_PATH}>
                <Toaster richColors position="top-right" />
                <Routes>
                    <Route path="/" element={<PublicSupportRequestPage />} />
                    <Route path="/estado" element={<PublicSupportStatusPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
                    <Route path="/admin/soportes" element={<PrivateRoute><SupportsTablePage /></PrivateRoute>} />
                    <Route path="/admin/soportes/:id" element={<PrivateRoute><SupportDetailPage /></PrivateRoute>} />
                    <Route path="/admin/empresa" element={<PrivateRoute><CompanySettingsPage /></PrivateRoute>} />
                    <Route path="/admin/tecnicos" element={<PrivateRoute><TechniciansPage /></PrivateRoute>} />
                    <Route path="/admin/administradores" element={<PrivateRoute><AdministratorsPage /></PrivateRoute>} />
                    <Route path="/tecnico" element={<PrivateRoute><TechnicianDashboard /></PrivateRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthContext.Provider>
    );
}

function PrivateRoute({ children }) {
    const { token } = useAuth();
    return token ? children : <Navigate to="/login" replace />;
}

function resolveApiBaseUrl() {
    const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim();
    if (configuredUrl) return configuredUrl.replace(/\/$/, '');

    return joinUrlPath(APP_BASE_PATH, 'api');
}

function normalizeBasePath(path) {
    const normalized = `/${String(path || '/').replace(/^\/+|\/+$/g, '')}`;

    return normalized === '/' ? '/' : normalized;
}

function joinUrlPath(base, path) {
    const normalizedBase = normalizeBasePath(base);
    const normalizedPath = String(path || '').replace(/^\/+/, '');

    return normalizedBase === '/' ? `/${normalizedPath}` : `${normalizedBase}/${normalizedPath}`;
}

function resolveApiPublicBasePath(apiBaseUrl) {
    const { pathname } = new URL(apiBaseUrl, window.location.origin);
    const withoutApi = pathname.replace(/\/api\/?$/, '');

    return withoutApi === '' ? '' : withoutApi;
}

const api = {
    get: (url, config) => window.axios.get(`${API_BASE_URL}${url}`, config).then((r) => r.data),
    post: (url, data, config) => window.axios.post(`${API_BASE_URL}${url}`, data, config).then((r) => r.data),
    patch: (url, data, config) => window.axios.patch(`${API_BASE_URL}${url}`, data, config).then((r) => r.data),
    delete: (url, config) => window.axios.delete(`${API_BASE_URL}${url}`, config).then((r) => r.data),
};

function Shell({ children, title, subtitle, action }) {
    const { user, logout } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(localStorage.getItem('sidebar_collapsed') === 'true');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [backgroundKey, setBackgroundKey] = useState(localStorage.getItem('page_background') || 'dark');
    const pageBackground = pageBackgrounds.find((item) => item.key === backgroundKey) || pageBackgrounds[0];
    const themeClassName = pageBackground.mode === 'dark' ? 'admin-dark-theme' : `admin-light-theme ${pageBackground.themeClass}`;
    const nav = user?.role === 'tecnico'
        ? [{ to: '/tecnico', label: 'Mis soportes', icon: Wrench }]
        : [
            { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/admin/soportes', label: 'Soportes', icon: ClipboardList },
            { to: '/admin/empresa', label: 'Empresa', icon: Settings },
            { to: '/admin/tecnicos', label: 'Técnicos', icon: Wrench },
            { to: '/admin/administradores', label: 'Administradores', icon: ShieldCheck },
        ];

    useEffect(() => {
        document.body.classList.remove(...adminThemeBodyClasses);
        document.body.classList.add(...themeClassName.split(' ').filter(Boolean));

        return () => {
            document.body.classList.remove(...adminThemeBodyClasses);
        };
    }, [themeClassName]);

    function toggleSidebar() {
        const next = !sidebarCollapsed;
        setSidebarCollapsed(next);
        localStorage.setItem('sidebar_collapsed', String(next));
    }

    function closeMobileMenu() {
        setMobileMenuOpen(false);
    }

    function logoutFromMobile() {
        closeMobileMenu();
        logout();
    }

    return (
        <div className={`${themeClassName} min-h-screen ${pageBackground.className}`}>
            <motion.aside
                initial={false}
                animate={{ width: sidebarCollapsed ? 96 : 288 }}
                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                className="fixed inset-y-0 left-0 z-20 hidden border-r border-white/10 bg-[#111b21]/95 p-5 shadow-soft backdrop-blur-xl lg:block"
            >
                <motion.button
                    onClick={toggleSidebar}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    animate={{ rotate: sidebarCollapsed ? 0 : 180 }}
                    transition={{ type: 'spring', stiffness: 620, damping: 28 }}
                    className="absolute -right-4 top-8 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#202c33] text-brand-green shadow-md transition hover:text-white"
                    title={sidebarCollapsed ? 'Mostrar menu' : 'Ocultar menu'}
                >
                    <ChevronRight size={17} />
                </motion.button>
                <Link to="/" className={`flex items-center gap-3 rounded-2xl px-2 py-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                    <motion.span whileHover={{ rotate: -5, scale: 1.04 }} className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-blue text-white shadow-lg shadow-sky-200"><Headphones size={22} /></motion.span>
                    <AnimatePresence initial={false}>
                        {!sidebarCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -8, width: 0 }}
                                animate={{ opacity: 1, x: 0, width: 'auto' }}
                                exit={{ opacity: 0, x: -8, width: 0 }}
                                transition={{ duration: 0.1 }}
                                className="overflow-hidden whitespace-nowrap"
                            >
                                <span className="block text-sm font-bold text-white">esys<span className="text-brand-blue">POS</span></span>
                                <span className="text-xs text-brand-green">Centro tecnico</span>
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Link>
                <nav className="mt-8 space-y-2">
                    {nav.map((item) => <NavItem key={item.to} {...item} collapsed={sidebarCollapsed} />)}
                </nav>
                <motion.div layout className={`absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-[#202c33] p-4 ${sidebarCollapsed ? 'px-2' : ''}`}>
                    <AnimatePresence initial={false}>
                        {!sidebarCollapsed && (
                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.1 }}>
                                <p className="text-sm font-semibold text-white">{user?.name}</p>
                                <p className="text-xs capitalize text-slate-300">{user?.role}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button onClick={logout} className={`inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-brand-green ${sidebarCollapsed ? 'mt-0 w-full justify-center' : 'mt-4'}`} title="Salir">
                        <LogOut size={16} /> <span className={sidebarCollapsed ? 'hidden' : 'inline'}>Salir</span>
                    </button>
                </motion.div>
            </motion.aside>
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.button
                            type="button"
                            aria-label="Cerrar menu"
                            className="fixed inset-0 z-30 bg-black/55 backdrop-blur-sm lg:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeMobileMenu}
                        />
                        <motion.aside
                            className="fixed inset-y-0 left-0 z-40 w-72 max-w-[86vw] border-r border-white/10 bg-[#111b21] p-5 shadow-2xl shadow-black/50 lg:hidden"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-3 rounded-2xl px-2 py-3">
                                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-blue text-white shadow-lg shadow-black/30"><Headphones size={22} /></span>
                                    <span>
                                        <span className="block text-sm font-bold text-white">esys<span className="text-brand-blue">POS</span></span>
                                        <span className="text-xs text-brand-green">Centro tecnico</span>
                                    </span>
                                </Link>
                                <button type="button" onClick={closeMobileMenu} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-[#202c33] text-slate-100 transition hover:text-brand-green" aria-label="Cerrar menu">
                                    <X size={19} />
                                </button>
                            </div>
                            <nav className="mt-8 space-y-2">
                                {nav.map((item) => <NavItem key={item.to} {...item} onClick={closeMobileMenu} />)}
                            </nav>
                            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-[#202c33] p-4">
                                <p className="text-sm font-semibold text-white">{user?.name}</p>
                                <p className="text-xs capitalize text-slate-300">{user?.role}</p>
                                <button onClick={logoutFromMobile} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-brand-green">
                                    <LogOut size={16} /> Salir
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
            <main className="transition-all duration-300 lg:pl-24">
                <header className="sticky top-0 z-10 border-b border-white/10 bg-black/25 px-4 py-4 backdrop-blur-xl sm:px-8">
                    <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                            <button type="button" onClick={() => setMobileMenuOpen(true)} className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-[#202c33] text-slate-100 shadow-sm transition hover:border-brand-green/50 hover:text-brand-green lg:hidden" aria-label="Abrir menu">
                                <Menu size={21} />
                            </button>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-300">{subtitle}</p>
                                <h1 className="text-2xl font-bold text-white">{title}</h1>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <BackgroundPicker value={backgroundKey} onChange={setBackgroundKey} />
                            {action}
                        </div>
                    </div>
                </header>
                <AnimatePresence mode="wait">
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto max-w-screen-2xl p-3 sm:p-8" style={{ paddingTop: title === 'Tabla de soportes' || title === 'Mis soportes' ? 5 : undefined }}>
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

function LegacyShell({ children, title, subtitle, action }) {
    const { user, logout } = useAuth();
    const nav = user?.role === 'tecnico'
        ? [{ to: '/tecnico', label: 'Mis soportes', icon: Wrench }]
        : [
            { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/admin/soportes', label: 'Soportes', icon: ClipboardList },
            { to: '/admin/empresa', label: 'Empresa', icon: Settings },
        ];

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e0f2fe,transparent_28%),linear-gradient(180deg,#f8fafc,#eef2f7)]">
            <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur-xl lg:block">
                <Link to="/" className="flex items-center gap-3 rounded-2xl px-2 py-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white shadow-lg"><Headphones size={22} /></span>
                    <span>
                        <span className="block text-sm font-bold text-slate-950">Soporte ESYS POS</span>
                        <span className="text-xs text-slate-500">Centro técnico</span>
                    </span>
                </Link>
                <nav className="mt-8 space-y-2">
                    {nav.map((item) => <NavItem key={item.to} {...item} />)}
                </nav>
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                    <p className="text-xs capitalize text-slate-500">{user?.role}</p>
                    <button onClick={logout} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
                        <LogOut size={16} /> Salir
                    </button>
                </div>
            </aside>
            <main className="lg:pl-72">
                <header className="sticky top-0 z-10 border-b border-white/70 bg-white/70 px-4 py-4 backdrop-blur-xl sm:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">{subtitle}</p>
                            <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
                        </div>
                        {action}
                    </div>
                </header>
                <AnimatePresence mode="wait">
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="p-4 sm:p-8">
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

function NavItem({ to, label, icon: Icon, collapsed = false, onClick }) {
    return (
        <motion.div whileHover={{ x: collapsed ? 0 : 3, scale: collapsed ? 1.04 : 1 }} whileTap={{ scale: 0.98 }}>
            <Link to={to} onClick={onClick} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-brand-green ${collapsed ? 'justify-center' : ''}`} title={label}>
                <Icon size={18} />
                <AnimatePresence initial={false}>
                    {!collapsed && (
                        <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.15 }} className="whitespace-nowrap">
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>
            </Link>
        </motion.div>
    );
}

function BackgroundPicker({ value, onChange }) {
    function changeBackground(nextValue) {
        localStorage.setItem('page_background', nextValue);
        onChange(nextValue);
    }

    return (
        <select className="theme-select input w-auto min-w-32 py-2 text-xs" value={value} onChange={(e) => changeBackground(e.target.value)} title="Color de fondo">
            {pageBackgrounds.map((background) => (
                <option key={background.key} value={background.key}>{background.label}</option>
            ))}
        </select>
    );
}

function LoginPage() {
    const { login, token, user } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    if (token) return <Navigate to={user?.role === 'tecnico' ? '/tecnico' : '/admin'} replace />;

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await api.post('/login', form);
            login(data);
            toast.success('Bienvenido');
            navigate(data.user.role === 'tecnico' ? '/tecnico' : '/admin');
        } catch (error) {
            toast.error(error.response?.data?.message || 'No se pudo iniciar sesion');
        } finally {
            setLoading(false);
        }
    }

    return (
        <PublicFrame>
            <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-3 py-6 sm:px-4 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
                <div className="min-w-0">
                    <div className="mb-8 inline-flex items-center gap-3 rounded-2xl border border-brand-green/30 bg-brand-green/10 px-4 py-3 shadow-soft">
                        <ShieldCheck className="shrink-0 text-brand-green" size={22} />
                        <span className="min-w-0 text-sm font-semibold text-slate-100">Acceso administrativo seguro</span>
                    </div>
                    <h1 className="max-w-2xl text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">Gestiona soportes técnicos en tiempo real.</h1>
                    <p className="mt-5 max-w-xl text-lg text-slate-300">Tabla editable, chat web, WhatsApp y seguimiento técnico en un panel profesional.</p>
                </div>
                <form onSubmit={submit} className="card min-w-0 p-4 sm:p-6">
                    <h2 className="text-xl font-bold text-white">Iniciar sesión</h2>
                    <label className="mt-5 block text-sm font-semibold text-slate-200">Email</label>
                    <input className="input mt-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    <label className="mt-4 block text-sm font-semibold text-slate-200">Contraseña</label>
                    <input type="password" className="input mt-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    <button className="btn-primary mt-6 w-full" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
                    <Link to="/" className="mt-4 block text-center text-sm font-semibold text-slate-400 hover:text-brand-green">Volver al formulario público</Link>
                </form>
            </div>
        </PublicFrame>
    );
}

function AdminDashboard() {
    const [data, setData] = useState({ supports: { data: [] }, stats: {} });

    useEffect(() => {
        api.get('/supports', { params: { per_page: 8 } }).then(setData);
    }, []);

    return (
        <Shell title="Dashboard" subtitle="Resumen de operación">
            <StatsCards stats={data.stats} />
            <div className="card mt-6 p-5">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-bold text-white">Últimos soportes</h2>
                    <Link to="/admin/soportes" className="btn-secondary">Ver tabla</Link>
                </div>
                <MiniList supports={data.supports?.data || []} />
            </div>
        </Shell>
    );
}

function TechnicianDashboard() {
    return <SupportsTablePage technicianMode />;
}

function SupportsTablePage({ technicianMode = false }) {
    const [supports, setSupports] = useState([]);
    const [stats, setStats] = useState({});
    const [filters, setFilters] = useState({ q: '', estado: '', tecnico_id: '', desde: '', hasta: '' });
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const firstLoad = useRef(true);
    const loadRequestId = useRef(0);

    async function load() {
        const requestId = loadRequestId.current + 1;
        loadRequestId.current = requestId;
        setLoading(true);
        try {
            const data = await api.get('/supports', { params: { ...filters, per_page: 100 } });
            if (requestId !== loadRequestId.current) return;

            setSupports(data.supports.data);
            setStats(data.stats);
        } catch (error) {
            if (requestId === loadRequestId.current) {
                toast.error(error.response?.data?.message || 'No se pudieron cargar los soportes');
            }
        } finally {
            if (requestId === loadRequestId.current) {
                setLoading(false);
            }
        }
    }

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        if (user?.role !== 'administrador') return;

        api.get('/technicians')
            .then((d) => setTechnicians(d.technicians))
            .catch((error) => toast.error(error.response?.data?.message || 'No se pudieron cargar los tecnicos'));
    }, [user?.role]);

    useEffect(() => {
        if (firstLoad.current) {
            firstLoad.current = false;
            return undefined;
        }

        const timeout = setTimeout(load, 300);
        return () => clearTimeout(timeout);
    }, [filters]);

    useEffect(() => {
        let active = true;
        let channel = null;

        window.ensureEcho?.().then((echo) => {
            if (!active || !echo) return;

            channel = echo.channel('supports')
                .listen('.SupportCreated', (e) => {
                    if (!canSeeRealtimeSupport(e.support, user)) return;

                    setSupports((rows) => {
                        if (user?.role === 'tecnico') notifyAssignedSupport(e.support);
                        return upsertVisibleSupport(rows, e.support);
                    });
                })
                .listen('.SupportCellUpdated', (e) => {
                    setSupports((rows) => {
                        const support = e.support || { id: e.support_id, [e.field]: e.value };
                        if (user?.role === 'tecnico' && canSeeRealtimeSupport(support, user) && !rows.some((row) => row.id === support.id)) {
                            notifyAssignedSupport(support);
                        }

                        return syncRealtimeSupportForUser(rows, support, user);
                    });
                })
                .listen('.SupportUpdated', (e) => {
                    setSupports((rows) => {
                        if (user?.role === 'tecnico' && canSeeRealtimeSupport(e.support, user) && !rows.some((row) => row.id === e.support.id)) {
                            notifyAssignedSupport(e.support);
                        }

                        return syncRealtimeSupportForUser(rows, e.support, user);
                    });
                });
        });

        return () => {
            active = false;
            channel
                ?.stopListening('.SupportCreated')
                ?.stopListening('.SupportCellUpdated')
                ?.stopListening('.SupportUpdated');
        };
    }, [user?.id, user?.role]);

    return (
        <Shell
            title={technicianMode ? 'Mis soportes' : 'Tabla de soportes'}
            subtitle={technicianMode ? 'Casos asignados a ti' : 'Gestión tipo Excel en tiempo real'}
            action={user?.role === 'administrador' ? <CreateSupportButton technicians={technicians} onCreated={(s) => setSupports((rows) => [...rows.filter((row) => row.id !== s.id), s])} /> : <NotificationPermissionButton />}
        >
            <FiltersBar filters={filters} setFilters={setFilters} technicians={technicians} showTechnician={user?.role === 'administrador'} onExport={() => exportCsv(supports)} />
            <div className="mt-3 overflow-hidden rounded-2xl sm:card">
                {loading ? <LoadingSpinner /> : <EditableSupportsTable supports={supports} setSupports={setSupports} technicians={technicians} />}
            </div>
        </Shell>
    );
}

function isVisibleInDefaultSupportTable(support) {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const supportDate = String(support.fecha || '').slice(0, 10);

    return supportDate === today || support.estado_soporte !== 'finalizado';
}

function upsertVisibleSupport(rows, support) {
    const mergedRows = rows.map((row) => row.id === support.id ? { ...row, ...support } : row);
    const existing = mergedRows.some((row) => row.id === support.id);
    const nextRows = existing ? mergedRows : [...mergedRows, support];

    return nextRows
        .filter(isVisibleInDefaultSupportTable)
        .sort((a, b) => {
            const dateCompare = String(a.fecha || '').localeCompare(String(b.fecha || ''));
            return dateCompare || Number(a.id) - Number(b.id);
        });
}

function canSeeRealtimeSupport(support, user) {
    if (!support) return false;
    if (user?.role !== 'tecnico') return true;

    return String(support.tecnico_asignado_id || '') === String(user.id || '');
}

function syncRealtimeSupportForUser(rows, support, user) {
    if (!support?.id) return rows;

    if (user?.role === 'tecnico' && !canSeeRealtimeSupport(support, user)) {
        return rows.filter((row) => row.id !== support.id);
    }

    return upsertVisibleSupport(rows, support);
}

function notifyAssignedSupport(support) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        toast.info(`Nuevo soporte asignado: ${support.codigo_soporte || 'Soporte'}`);
        return;
    }

    try {
        const notification = new Notification('Nuevo soporte asignado', {
            body: `${support.codigo_soporte || 'Soporte'} - ${support.empresa || 'Sin empresa'}`,
            tag: `support-${support.id}`,
            icon: '/favicon.ico',
        });

        notification.onclick = () => {
            window.focus();
            window.location.href = `/admin/soportes/${support.id}`;
        };
    } catch {
        toast.info(`Nuevo soporte asignado: ${support.codigo_soporte || 'Soporte'}`);
    }
}

function CopyCell({ support, field, editable, canEdit, onUpdate, label }) {
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copiado!`);
        } catch (err) {
            toast.error(`No se pudo copiar el ${label.toLowerCase()}`);
        }
    };

    if (canEdit && editable) {
        return (
            <EditableCell support={support} field={field} align="center" compact onUpdate={onUpdate} />
        );
    }

    const value = formatTableCellValue(field, support[field]);

    if (!value) {
        return <ReadOnlyCell value={value} align="center" compact />;
    }

    return (
        <button 
            onClick={() => copyToClipboard(value)}
            className="cursor-pointer w-full"
            title={`Clic para copiar ${label.toLowerCase()}`}
        >
            <ReadOnlyCell value={value} align="center" compact />
        </button>
    );
}

function TelefonoCell({ support, editable, canEdit, onUpdate }) {
    return (
        <CopyCell 
            support={support} 
            field="telefono" 
            editable={editable} 
            canEdit={canEdit} 
            onUpdate={onUpdate} 
            label="Teléfono" 
        />
    );
}

function EmpresaCell({ support, editable, canEdit, onUpdate }) {
    return (
        <CopyCell 
            support={support} 
            field="empresa" 
            editable={editable} 
            canEdit={canEdit} 
            onUpdate={onUpdate} 
            label="Empresa" 
        />
    );
}

function CodigoCell({ support, canEdit }) {
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success('Código copiado!');
        } catch (err) {
            toast.error('No se pudo copiar el código');
        }
    };

    const value = formatTableCellValue('codigo_soporte', support.codigo_soporte);

    if (!value) {
        return <ReadOnlyCell value={value} align="center" compact />;
    }

    if (canEdit) {
        // Admin can still edit if needed? Wait, the columns have it as non-editable!
        // Let's check: columns array has ['codigo_soporte', 'Código', false], so editable is false!
        // So let's just make it copyable for everyone!
    }

    return (
        <button 
            onClick={() => copyToClipboard(value)}
            className="cursor-pointer w-full"
            title="Clic para copiar código"
        >
            <ReadOnlyCell value={value} align="center" compact />
        </button>
    );
}

function EditableSupportsTable({ supports, setSupports, technicians }) {
    const { user } = useAuth();
    const canAssignTechnician = user?.role === 'administrador';
    const [detailSupport, setDetailSupport] = useState(null);
    const [detailTextSupport, setDetailTextSupport] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const columns = [
        ['codigo_soporte', 'Código', false],
        ['fecha_registro', 'Fecha', false],
        ['empresa', 'Empresa', true],
        ['detalles_soporte', 'Detalle', false],
        ['telefono', 'Teléfono', true],
        ['estado_soporte', 'Estado', true],
        ['tecnico_asignado_id', 'Técnico', true],
        ['hora_inicio', 'Inicio', false],
        ['hora_final', 'Final', false],
        ['error_image_url', 'Foto', false],
    ];
    const columnWidths = [132, 112, 160, 64, 128, 150, 180, 70, 70, 58];
    const actionColumnWidth = user?.role === 'administrador' ? 176 : 138;
    const tableMinWidth = columnWidths.reduce((total, width) => total + width, actionColumnWidth);

    async function deleteSupport(support) {
        if (!support || deletingId) return;

        setDeletingId(support.id);
        try {
            await api.delete(`/supports/${support.id}`);
            setSupports((rows) => rows.filter((row) => row.id !== support.id));
            setDeleteTarget(null);
            toast.success('Soporte eliminado');
        } catch (error) {
            toast.error(error.response?.data?.message || 'No se pudo eliminar el soporte');
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="pb-4 sm:px-1">
            <div className="space-y-3 md:hidden">
                {supports.map((support) => (
                    <SupportMobileCard
                        key={support.id}
                        support={support}
                        technicians={technicians}
                        canAssignTechnician={canAssignTechnician}
                        onUpdate={(updated) => setSupports((rows) => rows.map((row) => row.id === updated.id ? updated : row))}
                        onDetail={() => setDetailSupport(support)}
                        onTextDetail={() => setDetailTextSupport(support)}
                        onDelete={user?.role === 'administrador' ? () => setDeleteTarget(support) : null}
                        deleting={deletingId === support.id}
                    />
                ))}
            </div>
            <div
                className="admin-scrollbar hidden max-h-[calc(100vh-250px)] min-h-[560px] w-full overflow-auto px-1 pb-4 md:block"
            >
                <table className="w-full table-fixed border-separate border-spacing-y-1.5 text-center text-sm" style={{ minWidth: tableMinWidth }}>
                    <colgroup>
                        {columnWidths.map((width, index) => <col key={`${width}-${index}`} style={{ width: `${width}px` }} />)}
                        <col style={{ width: `${actionColumnWidth}px` }} />
                    </colgroup>
                    <thead className="support-table-head sticky top-0 z-10 text-xs uppercase shadow-sm">
                        <tr>{columns.map(([, label]) => <th key={label} className="whitespace-nowrap border-b px-2 py-3 text-center font-bold">{label}</th>)}<th className="whitespace-nowrap border-b px-2 py-3 text-center">Acciones</th></tr>
                    </thead>
                    <tbody>
                        {supports.map((support) => (
                            <tr key={support.id} className={`group overflow-hidden rounded-2xl border-l-4 shadow-md shadow-black/30 ring-1 ring-white/10 transition hover:shadow-xl hover:shadow-black/40 ${supportRowClass(support.estado_soporte)}`}>
                                {columns.map(([field, , editable], index) => {
                                    const isDetail = field === 'detalles_soporte';
                                    const isTime = field === 'hora_inicio' || field === 'hora_final';
                                    const isCompact = field === 'estado_soporte' || field === 'tecnico_asignado_id' || field === 'error_image_url';
                                    const isTelefono = field === 'telefono';
                                    const isEmpresa = field === 'empresa';
                                    const isCodigo = field === 'codigo_soporte';
                                    const canEdit = user?.role === 'administrador';

                                    return (
                                    <td key={field} className={`${isDetail ? 'px-1.5' : 'px-2'} ${isTime || isCompact ? 'whitespace-nowrap' : ''} border-y border-white/10 py-1 text-center align-middle last:rounded-r-2xl last:border-r ${index === 0 ? `rounded-l-2xl border-l-4 ${supportAccentClass(support.estado_soporte)}` : ''}`}>
                                        {field === 'estado_soporte' ? (
                                            (editable || user?.role === 'tecnico') ? <EditableCell support={support} field={field} type="select" options={states} align="center" compact solidStatus onUpdate={(s) => setSupports((rows) => rows.map((r) => r.id === s.id ? s : r))} /> : <SupportStatusBadge state={support[field]} solid />
                                        ) : field === 'tecnico_asignado_id' ? (
                                            canAssignTechnician
                                                ? <EditableCell support={support} field={field} type="select" options={[{ value: '', label: 'Sin asignar' }, ...technicians.map((t) => ({ value: t.id, label: t.name }))]} align="center" compact onUpdate={(s) => setSupports((rows) => rows.map((r) => r.id === s.id ? s : r))} display={support.tecnico_asignado_nombre || 'Sin asignar'} />
                                                : <ReadOnlyCell value={support.tecnico_asignado_nombre || 'Sin asignar'} align="center" compact />
                                        ) : isDetail ? (
                                            <SupportDetailTextButton support={support} onClick={() => setDetailTextSupport(support)} />
                                        ) : field === 'fecha_registro' ? (
                                            <ReadOnlyCell value={formatDateWithRegisterTime(support)} align="center" compact />
                                        ) : isCodigo ? (
                                            <CodigoCell support={support} canEdit={canEdit} />
                                        ) : isTelefono ? (
                                            <TelefonoCell 
                                                support={support} 
                                                editable={editable} 
                                                canEdit={canEdit}
                                                onUpdate={(s) => setSupports((rows) => rows.map((r) => r.id === s.id ? s : r))} 
                                            />
                                        ) : isEmpresa ? (
                                            <EmpresaCell 
                                                support={support} 
                                                editable={editable} 
                                                canEdit={canEdit}
                                                onUpdate={(s) => setSupports((rows) => rows.map((r) => r.id === s.id ? s : r))} 
                                            />
                                        ) : editable ? (
                                            <EditableCell support={support} field={field} align={isDetail ? 'left' : 'center'} compact onUpdate={(s) => setSupports((rows) => rows.map((r) => r.id === s.id ? s : r))} />
                                        ) : field === 'error_image_url' ? (
                                            <SupportImageLink support={support} compact />
                                        ) : (
                                            <ReadOnlyCell value={formatTableCellValue(field, support[field])} align="center" compact />
                                        )}
                                    </td>
                                    );
                                })}
                                <td className="whitespace-nowrap rounded-r-2xl border-y border-r border-white/10 px-2 py-1 align-middle">
                                    <div className="flex min-w-max items-center justify-center gap-1.5">
                                        <button className="table-icon-button" onClick={() => setDetailSupport(support)} title="Ver soporte"><Eye size={17} /></button>
                                        <WhatsAppButton support={support} compact />
                                        <AnyDeskButton support={support} compact />
                                        {user?.role === 'administrador' && (
                                            <button
                                                className="table-icon-button border-rose-500/30 text-rose-500 hover:border-rose-400/60 hover:text-rose-300"
                                                onClick={() => setDeleteTarget(support)}
                                                disabled={deletingId === support.id}
                                                title="Eliminar soporte"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {detailSupport && (
                <SupportDetailModal
                    support={detailSupport}
                    technicians={technicians}
                    onClose={() => setDetailSupport(null)}
                    onSaved={(updated) => {
                        setSupports((rows) => rows.map((row) => row.id === updated.id ? updated : row));
                        setDetailSupport(updated);
                    }}
                />
            )}
            {detailTextSupport && (
                <SupportDetailTextModal
                    support={detailTextSupport}
                    onClose={() => setDetailTextSupport(null)}
                    onOpenFull={() => {
                        setDetailSupport(detailTextSupport);
                        setDetailTextSupport(null);
                    }}
                />
            )}
            {deleteTarget && (
                <DeleteSupportModal
                    support={deleteTarget}
                    deleting={deletingId === deleteTarget.id}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={() => deleteSupport(deleteTarget)}
                />
            )}
        </div>
    );
}

function SupportMobileCard({ support, technicians, canAssignTechnician = false, onUpdate, onDetail, onTextDetail, onDelete, deleting = false }) {
    return (
        <article className={`rounded-2xl border-l-4 p-4 shadow-md shadow-black/30 ring-1 ring-white/10 ${supportRowClass(support.estado_soporte)}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-slate-400">{support.codigo_soporte}</p>
                    <h3 className="mt-1 break-words text-base font-bold text-white">{support.empresa || 'Sin empresa'}</h3>
                </div>
                <SupportStatusBadge state={support.estado_soporte} solid />
            </div>
            <div className="mt-4 grid gap-3">
                <MobileField label="Estado">
                    <EditableCell support={support} field="estado_soporte" type="select" options={states} solidStatus onUpdate={onUpdate} />
                </MobileField>
                <MobileField label="Técnico">
                    {canAssignTechnician
                        ? <EditableCell support={support} field="tecnico_asignado_id" type="select" options={[{ value: '', label: 'Sin asignar' }, ...technicians.map((t) => ({ value: t.id, label: t.name }))]} onUpdate={onUpdate} display={support.tecnico_asignado_nombre || 'Sin asignar'} />
                        : <ReadOnlyCell value={support.tecnico_asignado_nombre || 'Sin asignar'} />}
                </MobileField>
                <div className="grid gap-3 sm:grid-cols-2">
                    <MobileField label="Fecha">
                        <ReadOnlyCell value={formatDate(support.fecha)} />
                    </MobileField>
                    <MobileField label="Teléfono">
                        <EditableCell support={support} field="telefono" onUpdate={onUpdate} />
                    </MobileField>
                </div>
                <MobileField label="Detalle">
                    <SupportDetailTextButton support={support} onClick={onTextDetail} />
                </MobileField>
                <MobileField label="Foto">
                    <SupportImageLink support={support} />
                </MobileField>
            </div>
            <div className={`mt-4 grid gap-2 ${onDelete ? 'grid-cols-4' : 'grid-cols-3'}`}>
                <button className="btn-secondary px-3 py-2" onClick={onDetail} title="Ver detalle"><Eye size={16} /></button>
                <WhatsAppButton support={support} />
                <AnyDeskButton support={support} />
                {onDelete && (
                    <button
                        className="btn-secondary border-rose-500/30 px-3 py-2 text-rose-600 hover:border-rose-400/60 hover:text-rose-700"
                        onClick={onDelete}
                        disabled={deleting}
                        title="Eliminar soporte"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </article>
    );
}

function MobileField({ label, children }) {
    return (
        <div className="min-w-0 rounded-xl border border-white/10 bg-[#0b141a]/45 p-3">
            <p className="mb-1 text-[11px] font-bold uppercase text-slate-400">{label}</p>
            {children}
        </div>
    );
}

function SupportDetailTextButton({ support, onClick }) {
    const hasDetail = Boolean(String(support.detalles_soporte || '').trim());

    return (
        <button
            type="button"
            className="table-detail-button inline-flex h-8 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#202c33] text-slate-100 shadow-sm transition-colors hover:border-brand-green/50 hover:bg-[#26343d] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClick}
            disabled={!hasDetail}
            title={hasDetail ? 'Ver detalle del soporte' : 'Sin detalle registrado'}
        >
            <FileText size={15} />
        </button>
    );
}

function DeleteSupportModal({ support, deleting, onCancel, onConfirm }) {
    useBodyScrollLock(true);

    return createPortal(
        <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                className="admin-modal-panel card w-full max-w-md overflow-hidden p-5 shadow-2xl shadow-black/40"
            >
                <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
                        <Trash2 size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-rose-400">Eliminar soporte</p>
                        <h2 className="mt-1 break-words text-xl font-black text-white">{support.codigo_soporte}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-300">
                            Esta acción no se puede deshacer. El soporte se quitará de la tabla de forma permanente.
                        </p>
                    </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-[#202c33] p-4">
                    <p className="text-xs font-bold uppercase text-slate-400">Empresa</p>
                    <p className="mt-1 break-words text-sm font-semibold text-slate-100">{support.empresa || 'Sin empresa'}</p>
                </div>

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onCancel} disabled={deleting} className="btn-secondary px-4 py-2">
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={deleting}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {deleting ? <><LoaderCircle className="animate-spin" size={17} /> Eliminando...</> : <><Trash2 size={17} /> Eliminar</>}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body,
    );
}

function SupportDetailTextModal({ support, onClose, onOpenFull }) {
    useBodyScrollLock(true);

    return createPortal(
        <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} className="admin-modal-panel card w-full max-w-3xl overflow-hidden shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-green">Detalle</p>
                        <h2 className="truncate text-xl font-black text-white">{support.codigo_soporte}</h2>
                        <p className="mt-1 truncate text-sm text-slate-300">{support.empresa || 'Sin empresa'}</p>
                    </div>
                    <button type="button" onClick={onClose} className="btn-secondary px-3 py-2">
                        <X size={17} />
                    </button>
                </div>
                <div className="p-5">
                    <div className="rounded-2xl border border-white/10 bg-[#202c33] p-4">
                        <p className="mb-3 text-xs font-bold uppercase text-slate-400">Detalle del soporte</p>
                        <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-white/10 bg-[#0b141a]/55 p-4">
                            <p className="whitespace-pre-wrap break-words text-[1.05rem] font-semibold leading-relaxed text-slate-300">
                                {support.detalles_soporte || 'Sin detalle registrado.'}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button type="button" onClick={onClose} className="btn-secondary px-4 py-2">Cerrar</button>
                        <button type="button" onClick={onOpenFull} className="btn-primary px-4 py-2">Abrir soporte</button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body,
    );
}

function SupportDetailModal({ support, technicians = [], onClose, onSaved }) {
    const { user } = useAuth();
    const [draft, setDraft] = useState({ ...support });
    const [saving, setSaving] = useState(false);
    useBodyScrollLock(true);
    const fields = [
        ['codigo_soporte', 'Código'],
        ['fecha', 'Fecha'],
        ['nit', 'NIT'],
        ['empresa', 'Empresa'],
        ['detalles_soporte', 'Detalle'],
        ['telefono', 'Teléfono'],
        ['anydesk', 'AnyDesk'],
        ['hora_registro', 'Registro'],
        ['hora_inicio', 'Inicio'],
        ['hora_final', 'Final'],
        ['observacion_tecnico', 'Observación técnica'],
        ['estado_soporte', 'Estado'],
        ['tecnico_asignado_nombre', 'Técnico'],
        ['created_at', 'Creado'],
        ['updated_at', 'Actualizado'],
    ];
    const editableFields = user?.role === 'tecnico' 
        ? new Set(['observacion_tecnico', 'estado_soporte']) 
        : new Set([
            'nit',
            'empresa',
            'detalles_soporte',
            'telefono',
            'anydesk',
            'observacion_tecnico',
            'estado_soporte',
            'tecnico_asignado_id',
        ]);

    async function save(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = Object.fromEntries([...editableFields].map((field) => [field, draft[field] ?? null]));
            const data = await api.patch(`/supports/${support.id}`, payload);
            onSaved(data.support);
            toast.success('Soporte actualizado');
        } catch (error) {
            toast.error(error.response?.data?.message || 'No se pudo guardar');
        } finally {
            setSaving(false);
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex bg-black/75 p-3 backdrop-blur-sm sm:p-5">
            <motion.form onSubmit={save} initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} className="admin-modal-panel card mx-auto flex h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden shadow-2xl shadow-black/40 sm:h-[calc(100dvh-2.5rem)]">
                <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
                    <div>
                        <p className="text-sm font-semibold text-brand-green">Detalle del soporte</p>
                        <h2 className="text-xl font-black text-white">{support.codigo_soporte}</h2>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="btn-secondary px-3 py-2">Cerrar</button>
                        <button className="btn-primary px-3 py-2" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-6">
                    <div className="mb-5 flex items-center justify-between rounded-2xl border border-white/10 bg-[#202c33] p-4">
                        <div>
                            <p className="text-sm font-semibold text-white">{support.empresa}</p>
                            <p className="text-sm text-slate-300">{support.telefono}</p>
                        </div>
                        <SupportStatusBadge state={support.estado_soporte} solid />
                    </div>
                    <SupportImagesEditor
                        support={draft}
                        onSaved={(updatedSupport) => {
                            setDraft({ ...updatedSupport });
                            onSaved(updatedSupport);
                        }}
                    />
                    <dl className="grid gap-4 md:grid-cols-2">
                        {fields.map(([key, label]) => (
                            <div key={key} className={`rounded-2xl border border-white/10 bg-[#202c33] p-4 ${key === 'detalles_soporte' || key === 'observacion_tecnico' ? 'md:col-span-2' : ''}`}>
                                <dt className="text-xs font-bold uppercase text-slate-400">{label}</dt>
                                <dd className="mt-2 min-w-0">
                                    <DetailField
                                        field={key}
                                        value={draft[key]}
                                        editable={editableFields.has(key)}
                                        technicians={technicians}
                                        onChange={(value) => setDraft((current) => ({ ...current, [key]: value }))}
                                    />
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </motion.form>
        </div>,
        document.body,
    );
}

function SupportImagesEditor({ support, onSaved }) {
    const [files, setFiles] = useState([]);
    const [savingMode, setSavingMode] = useState(null);
    const imageUrls = supportImageUrls(support);
    const remainingSlots = Math.max(0, 8 - imageUrls.length);
    const canAppendSelection = remainingSlots > 0 && files.length <= remainingSlots;

    async function upload(mode) {
        if (!files.length) {
            toast.error('Selecciona al menos una foto');
            return;
        }

        setSavingMode(mode);
        try {
            const data = new FormData();
            data.append('mode', mode);
            files.forEach((file) => data.append('error_images[]', file));

            const response = await api.post(`/supports/${support.id}/images`, data);
            onSaved(response.support);
            setFiles([]);
            toast.success(mode === 'replace' ? 'Fotos reemplazadas' : 'Fotos agregadas');
        } catch (error) {
            toast.error(validationMessage(error, 'No se pudieron guardar las fotos'));
        } finally {
            setSavingMode(null);
        }
    }

    return (
        <section className="mb-5 rounded-2xl border border-white/10 bg-[#0b141a]/45 p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Fotos del error</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{imageUrls.length ? `${imageUrls.length} de 8 fotos cargadas` : 'Sin fotos cargadas'}</p>
                </div>
                {imageUrls.length > 0 && (
                    <a className="btn-secondary min-h-0 px-3 py-2 text-xs" href={imageUrls[0]} target="_blank" rel="noreferrer">
                        <Eye size={15} /> Ver primera
                    </a>
                )}
            </div>

            {imageUrls.length > 0 && (
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    {imageUrls.map((url, index) => (
                        <a key={url} className="block overflow-hidden rounded-xl border border-white/10 bg-[#111b21]" href={url} target="_blank" rel="noreferrer">
                            <img className="h-48 w-full object-contain" src={url} alt={`Foto del error ${index + 1}`} />
                        </a>
                    ))}
                </div>
            )}

            <ImageDropField
                files={files}
                onChange={setFiles}
                disabled={Boolean(savingMode)}
                maxFiles={8}
                helperText={remainingSlots > 0 ? `Puedes agregar ${remainingSlots} foto(s) mas o reemplazar todas` : 'Ya hay 8 fotos; solo puedes reemplazarlas'}
            />

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn-secondary min-h-0 px-3 py-2 text-xs" disabled={!files.length || !canAppendSelection || Boolean(savingMode)} onClick={() => upload('append')}>
                    {savingMode === 'append' ? <><LoaderCircle className="animate-spin" size={15} /> Agregando...</> : <><Plus size={15} /> Agregar fotos</>}
                </button>
                <button type="button" className="btn-primary px-3 py-2 text-xs" disabled={!files.length || Boolean(savingMode)} onClick={() => upload('replace')}>
                    {savingMode === 'replace' ? <><LoaderCircle className="animate-spin" size={15} /> Reemplazando...</> : <><ImageIcon size={15} /> Reemplazar fotos</>}
                </button>
            </div>
        </section>
    );
}

function DetailField({ field, value, editable, technicians, onChange }) {
    if (!editable) {
        return <span className={`whitespace-pre-wrap break-words ${field === 'detalles_soporte' || field === 'observacion_tecnico' ? 'text-[1.05rem] text-slate-300' : 'text-sm text-slate-100'}`}>{formatDetailValue(field, value)}</span>;
    }

    if (field === 'estado_soporte') {
        return (
            <select className="input" value={value || 'pendiente'} onChange={(e) => onChange(e.target.value)}>
                {states.map((state) => <option key={state} value={state}>{stateLabel(state)}</option>)}
            </select>
        );
    }

    if (field === 'tecnico_asignado_id') {
        return (
            <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
                <option value="">Sin asignar</option>
                {technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}
            </select>
        );
    }

    if (field === 'detalles_soporte' || field === 'observacion_tecnico') {
        return <textarea className="input" rows="4" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
    }

    if (field === 'fecha') {
        return <input className="input" type="date" value={String(value || '').slice(0, 10)} onChange={(e) => onChange(e.target.value)} />;
    }

    if (field === 'hora_inicio' || field === 'hora_final') {
        return <input className="input" type="time" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
    }

    return <input className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
}

function formatDetailValue(key, value) {
    if (!value) return '-';
    if (key === 'created_at' || key === 'updated_at') return formatDateTime(value);
    if (key === 'hora_registro' || key === 'hora_inicio' || key === 'hora_final') return formatShortTime(value);
    return String(value);
}

function supportRowClass(state) {
    const classes = {
        pendiente: 'border-l-amber-400 bg-amber-500/18 hover:bg-amber-500/25',
        asignado: 'border-l-sky-400 bg-sky-500/18 hover:bg-sky-500/25',
        en_proceso: 'border-l-violet-400 bg-violet-500/18 hover:bg-violet-500/25',
        finalizado: 'border-l-emerald-400 bg-emerald-500/18 hover:bg-emerald-500/25',
        cancelado: 'border-l-rose-400 bg-rose-500/18 hover:bg-rose-500/25',
    };

    return classes[state] || 'border-l-slate-500 bg-white/5 hover:bg-white/10';
}

function supportAccentClass(state) {
    const classes = {
        pendiente: 'border-l-amber-400',
        asignado: 'border-l-sky-400',
        en_proceso: 'border-l-violet-400',
        finalizado: 'border-l-emerald-400',
        cancelado: 'border-l-rose-400',
    };

    return classes[state] || 'border-l-slate-500';
}

function EditableCell({ support, field, onUpdate, type = 'text', options = [], display, align = 'left', compact = false, solidStatus = false }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(support[field] ?? '');
    const [status, setStatus] = useState('idle');
    const [flash, setFlash] = useState(false);
    const cellKey = `${support.id}-${field}`;
    const centered = align === 'center';
    const isStatusField = field === 'estado_soporte';
    const isPhoneField = field === 'telefono';

    useEffect(() => {
        if ((support[field] ?? '') !== value && !editing) {
            setValue(support[field] ?? '');
            setFlash(true);
            setTimeout(() => setFlash(false), 1300);
        }
    }, [support[field]]);

    function moveToNextCell() {
        setTimeout(() => {
            const cells = [...document.querySelectorAll('[data-editable-cell="true"]')];
            const currentIndex = cells.findIndex((cell) => cell.dataset.cellKey === cellKey);
            const nextCell = cells[currentIndex + 1] || cells[0];

            nextCell?.focus();
            nextCell?.click();
        }, 80);
    }

    async function save(moveNext = false, nextValue = value) {
        setEditing(false);
        if ((support[field] ?? '') === nextValue) {
            if (moveNext) moveToNextCell();
            return;
        }
        setStatus('saving');
        try {
            const data = await api.patch(`/supports/${support.id}/cell`, { field, value: nextValue });
            onUpdate(data.support);
            setStatus('saved');
            setTimeout(() => setStatus('idle'), 1200);
            if (moveNext) moveToNextCell();
        } catch (error) {
            setStatus('error');
            toast.error(error.response?.data?.message || 'No se pudo guardar');
        }
    }

    if (editing) {
        const compactControlClass = compact
            ? `table-cell-editor ${centered ? 'text-center' : ''}`
            : `input pr-10 py-1.5 ${centered ? 'text-center' : ''}`;
        const control = type === 'select'
            ? <select data-editable-cell="true" data-cell-key={cellKey} autoFocus className={`${compactControlClass} ${compact ? '' : 'min-w-[150px]'}`} value={value ?? ''} onBlur={() => save()} onChange={(e) => { setValue(e.target.value); save(false, e.target.value); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(true); } if (e.key === 'Escape') { setValue(support[field] ?? ''); setEditing(false); } }}>{options.map((o) => typeof o === 'string' ? <option key={o} value={o}>{isStatusField ? stateLabel(o) : o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            : compact
                ? <input data-editable-cell="true" data-cell-key={cellKey} autoFocus className={compactControlClass} value={value ?? ''} onChange={(e) => setValue(e.target.value)} onBlur={() => save()} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(true); } if (e.key === 'Escape') { setValue(support[field] ?? ''); setEditing(false); } }} />
                : <textarea data-editable-cell="true" data-cell-key={cellKey} autoFocus rows={field.includes('detalle') || field.includes('observacion') ? 3 : 1} className={`${compactControlClass} min-w-[180px]`} value={value ?? ''} onChange={(e) => setValue(e.target.value)} onBlur={() => save()} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(true); } if (e.key === 'Escape') { setValue(support[field] ?? ''); setEditing(false); } }} />;
        return <div className="relative h-8 w-full min-w-0">{control}<CellStatus status={status} floating /></div>;
    }

    return (
        <button data-editable-cell="true" data-cell-key={cellKey} onClick={() => setEditing(true)} onDoubleClick={() => setEditing(true)} disabled={status === 'saving'} className={`editable-cell-display relative flex w-full items-center rounded-lg px-2 py-1 transition hover:bg-white/10 hover:shadow-sm disabled:cursor-wait disabled:opacity-85 ${isStatusField ? 'justify-center gap-1.5' : 'gap-2 pr-9'} ${compact ? 'min-h-8' : 'min-h-9'} ${centered ? 'justify-center text-center' : 'text-left'} ${flash ? 'table-cell-updated' : ''}`}>
            {isStatusField ? <SupportStatusBadge state={support[field]} solid={solidStatus} /> : <span className={`${isPhoneField ? 'whitespace-nowrap text-xs' : 'line-clamp-3'} font-semibold text-slate-100`}>{display ?? value ?? '-'}</span>}
            <CellStatus status={status} inline={isStatusField} />
        </button>
    );
}

function CellStatus({ status, floating = false, inline = false }) {
    const baseClass = inline
        ? 'shrink-0'
        : floating
            ? 'absolute right-2 top-1/2 -translate-y-1/2'
            : 'absolute right-2 top-1/2 -translate-y-1/2';

    if (status === 'saving') {
        return (
            <span className={`${baseClass} inline-flex ${inline ? 'h-5 w-5' : 'h-6 w-6'} items-center justify-center rounded-full bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30`} title="Guardando cambios">
                <LoaderCircle className="animate-spin" size={inline ? 12 : 14} />
            </span>
        );
    }

    if (status === 'error') {
        return (
            <span className={`${baseClass} inline-flex ${inline ? 'h-5 w-5' : 'h-6 w-6'} items-center justify-center rounded-full bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30`} title="No se pudo guardar">
                <AlertCircle size={inline ? 12 : 14} />
            </span>
        );
    }

    if (status === 'saved') {
        return (
            <span className={`${baseClass} inline-flex ${inline ? 'h-5 w-5' : 'h-6 w-6'} items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30`} title="Cambios guardados">
                <CheckCircle2 size={inline ? 12 : 14} />
            </span>
        );
    }

    return null;
}

function ReadOnlyCell({ value, align = 'left', compact = false }) {
    return <span className={`flex items-center rounded-lg px-2 py-1 font-semibold text-slate-200 ${compact ? 'min-h-8' : 'min-h-9'} ${align === 'center' ? 'justify-center text-center' : ''}`}>{value || '-'}</span>;
}

function SupportStatusBadge({ state, solid = true }) {
    const softClasses = {
        pendiente: 'bg-amber-100 text-amber-700 ring-amber-200',
        asignado: 'bg-sky-100 text-sky-700 ring-sky-200',
        en_proceso: 'bg-violet-100 text-violet-700 ring-violet-200',
        finalizado: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
        cancelado: 'bg-rose-100 text-rose-700 ring-rose-200',
    };
    const solidClasses = {
        pendiente: 'bg-amber-400 text-amber-950 ring-amber-200/45 shadow-amber-950/20',
        asignado: 'bg-sky-400 text-sky-950 ring-sky-200/45 shadow-sky-950/20',
        en_proceso: 'bg-violet-500 text-violet-950 ring-violet-200/45 shadow-violet-950/20',
        finalizado: 'bg-emerald-500 text-emerald-950 ring-emerald-200/45 shadow-emerald-950/20',
        cancelado: 'bg-rose-500 text-rose-950 ring-rose-200/45 shadow-rose-950/20',
    };
    const classes = solid ? solidClasses : softClasses;
    const shapeClass = solid
        ? 'min-w-[76px] rounded-full px-2.5 py-1 text-xs font-bold shadow-sm'
        : 'rounded-full px-2.5 py-1 text-xs font-bold';

    return <span className={`inline-flex max-w-full items-center justify-center whitespace-nowrap leading-none ring-1 ${shapeClass} ${classes[state] || classes.pendiente}`}>{stateLabel(state)}</span>;
}

function TechnicianSelect({ value, technicians, onChange }) {
    return (
        <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">Sin asignar</option>
            {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
    );
}

function WhatsAppButton({ support, target = 'client', compact = false }) {
    const targetPhone = target === 'support' ? (support.contact_phone || support.company_settings?.support_phone) : support.telefono;
    const phone = String(targetPhone || '').replace(/\D/g, '');
    const template = support.company_settings?.default_whatsapp_message || 'Hola, somos soporte tecnico. Te escribimos sobre tu solicitud #{codigo_soporte} de la empresa {empresa}.';
    const text = encodeURIComponent(target === 'support'
        ? `Hola, soy de la empresa ${support.empresa}. Necesito ayuda con mi solicitud #${support.codigo_soporte}.`
        : template.replaceAll('{codigo_soporte}', support.codigo_soporte || '').replaceAll('{empresa}', support.empresa || ''));

    if (!phone) {
        return <button className={`${compact ? 'table-icon-button' : 'btn-secondary px-3 py-2'} text-slate-400`} disabled title="Sin numero configurado"><MessageCircle size={compact ? 17 : 16} /></button>;
    }

    return <a className={`${compact ? 'table-icon-button' : 'btn-secondary px-3 py-2'} text-emerald-700`} href={`https://wa.me/${phone}?text=${text}`} target="_blank" rel="noreferrer" title={target === 'support' ? `WhatsApp con ${support.contact_name || 'soporte'}` : 'WhatsApp con cliente'}><MessageCircle size={compact ? 17 : 16} /></a>;
}

function AnyDeskButton({ support, compact = false }) {
    const [open, setOpen] = useState(false);
    const ids = anyDeskIds(support.anydesk);

    if (!ids.length) {
        return <button className={`${compact ? 'table-icon-button' : 'btn-secondary px-3 py-2'} text-slate-500`} disabled title="Sin AnyDesk"><MonitorUp size={compact ? 17 : 16} /></button>;
    }

    if (ids.length === 1) {
        return (
            <a className={`${compact ? 'table-icon-button' : 'btn-secondary px-3 py-2'} text-sky-200`} href={anyDeskUrl(ids[0])} title={`Abrir AnyDesk ${ids[0]}`}>
                <MonitorUp size={compact ? 17 : 16} />
            </a>
        );
    }

    return (
        <>
            <button type="button" className={`${compact ? 'table-icon-button' : 'btn-secondary px-3 py-2'} text-sky-200`} onClick={() => setOpen(true)} title={`${ids.length} AnyDesk registrados`}>
                <MonitorUp size={compact ? 17 : 16} />
            </button>
            {open && <AnyDeskOptionsModal support={support} ids={ids} onClose={() => setOpen(false)} />}
        </>
    );
}

function AnyDeskOptionsModal({ support, ids, onClose }) {
    useBodyScrollLock(true);

    return createPortal(
        <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                className="admin-modal-panel card w-full max-w-md overflow-hidden shadow-2xl shadow-black/40"
            >
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-green">AnyDesk</p>
                        <h2 className="truncate text-xl font-black text-white">{support.empresa || support.codigo_soporte || 'Soporte'}</h2>
                        <p className="mt-1 text-sm text-slate-300">{ids.length} accesos registrados</p>
                    </div>
                    <button type="button" onClick={onClose} className="btn-secondary px-3 py-2">
                        <X size={17} />
                    </button>
                </div>
                <div className="grid gap-2 p-5">
                    {ids.map((id, index) => (
                        <div key={`${id}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#202c33] px-3 py-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-100">{id}</p>
                                <p className="text-xs font-semibold text-slate-400">AnyDesk {index + 1}</p>
                            </div>
                            <a className="btn-primary shrink-0 px-3 py-2 text-xs" href={anyDeskUrl(id)} onClick={onClose}>
                                Abrir
                            </a>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>,
        document.body,
    );
}

function anyDeskIds(value) {
    return [...new Set(
        String(value || '')
            .split(/[,;\n\r|/]+/)
            .map((item) => item.trim().replace(/[\s-]+/g, ''))
            .filter(Boolean),
    )];
}

function anyDeskUrl(value) {
    const id = String(value || '').trim().replace(/[\s-]+/g, '');
    return id ? `anydesk:${id}` : '';
}

function mergeSupportRealtime(current, incoming) {
    if (!current) return incoming;

    return {
        ...current,
        ...incoming,
        messages: current.messages || incoming?.messages || [],
    };
}

function useSupportRealtime(support, setSupport) {
    useEffect(() => {
        if (!support?.id) return undefined;

        let active = true;
        let channel = null;

        window.ensureEcho?.().then((echo) => {
            if (!active || !echo) return;

            channel = echo.channel(`support.${support.id}`)
                .listen('.SupportUpdated', (event) => {
                setSupport((current) => mergeSupportRealtime(current, event.support));
                toast.info(`Soporte ${event.support.codigo_soporte} actualizado`);
                })
                .listen('.SupportCellUpdated', (event) => {
                setSupport((current) => {
                    if (!current) return current;
                    const next = event.support ? mergeSupportRealtime(current, event.support) : { ...current, [event.field]: event.value };

                    return {
                        ...next,
                        messages: current.messages || next.messages || [],
                    };
                });

                if (event.field === 'estado_soporte') {
                    toast.info(`Estado actualizado a ${stateLabel(event.value)}`);
                }
            });
        });

        return () => {
            active = false;
            channel
                ?.stopListening('.SupportUpdated')
                ?.stopListening('.SupportCellUpdated');
        };
    }, [support?.id, setSupport]);
}

function FiltersBar({ filters, setFilters, technicians, showTechnician, onExport }) {
    const activeDate = filters.desde || filters.hasta || localDateString(new Date());

    function setSingleDate(date) {
        setFilters({ ...filters, desde: date, hasta: date });
    }

    function moveDate(days) {
        const date = new Date(`${activeDate}T00:00:00`);
        date.setDate(date.getDate() + days);
        setSingleDate(localDateString(date));
    }

    function clearDates() {
        setFilters({ ...filters, desde: '', hasta: '' });
    }

    return (
        <div className="card mt-5 grid gap-3 p-3 sm:p-4 xl:grid-cols-[1.35fr_.9fr_.9fr_3fr_auto]">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input className="input pl-9" placeholder="Buscar NIT, empresa, teléfono, AnyDesk" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
            </div>
            <select className="input" value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })}>
                <option value="">Todos los estados</option>
                {states.map((s) => <option key={s} value={s}>{stateLabel(s)}</option>)}
            </select>
            {showTechnician ? <TechnicianSelect value={filters.tecnico_id} technicians={technicians} onChange={(value) => setFilters({ ...filters, tecnico_id: value })} /> : <span />}
            <div className="rounded-2xl border border-white/10 bg-[#202c33] p-1 shadow-sm sm:h-12">
                <div className="grid gap-1.5 sm:flex sm:h-full sm:items-center">
                    <div className="grid grid-cols-[2.5rem_1fr_2.5rem] gap-1.5 sm:contents">
                    <button type="button" className="grid h-10 w-full place-items-center rounded-xl text-brand-green transition hover:bg-white/10 sm:h-full sm:w-10" onClick={() => moveDate(-1)} title="Día anterior">
                        <ChevronLeft size={18} />
                    </button>
                    <button type="button" className="h-10 rounded-xl bg-brand-blue px-3 text-sm font-bold text-white transition hover:bg-brand-blueDark sm:h-full" onClick={() => setSingleDate(localDateString(new Date()))}>
                        Hoy
                    </button>
                    <button type="button" className="grid h-10 w-full place-items-center rounded-xl text-brand-green transition hover:bg-white/10 sm:h-full sm:w-10" onClick={() => moveDate(1)} title="Día siguiente">
                        <ChevronRight size={18} />
                    </button>
                    </div>
                    <div className="hidden h-8 w-px bg-white/10 sm:mx-1 sm:block" />
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:contents">
                    <input className="h-10 min-w-[140px] rounded-xl border border-white/10 bg-[#111b21] px-2 text-sm font-semibold text-slate-100 outline-none focus:border-brand-green focus:ring-4 focus:ring-emerald-500/10 sm:h-full sm:flex-1" type="date" value={filters.desde} onChange={(e) => setFilters({ ...filters, desde: e.target.value })} title="Desde" />
                    <span className="text-center text-xs font-bold text-slate-400">a</span>
                    <input className="h-10 min-w-[140px] rounded-xl border border-white/10 bg-[#111b21] px-2 text-sm font-semibold text-slate-100 outline-none focus:border-brand-green focus:ring-4 focus:ring-emerald-500/10 sm:h-full sm:flex-1" type="date" value={filters.hasta} onChange={(e) => setFilters({ ...filters, hasta: e.target.value })} title="Hasta" />
                    </div>
                    <button type="button" className="h-10 rounded-xl px-3 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-brand-green sm:h-full" onClick={clearDates}>
                        Limpiar
                    </button>
                </div>
            </div>
            <button className="btn-secondary" onClick={onExport}><Download size={17} /> CSV</button>
        </div>
    );
}

function localDateString(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function supportFormData(form) {
    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return;
        if (Array.isArray(value)) {
            value.forEach((item) => data.append(`${key}[]`, item));
            return;
        }
        data.append(key, value);
    });

    return data;
}

function validationMessage(error, fallback = 'No se pudo guardar') {
    const errors = error.response?.data?.errors;
    const firstError = errors && Object.values(errors).flat()[0];

    return firstError || error.response?.data?.message || fallback;
}

function useBodyScrollLock(locked) {
    useEffect(() => {
        if (!locked) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [locked]);
}

function ImageDropField({ files = [], onChange, className = '', disabled = false, maxFiles = 8, helperText = 'Hasta 8 imagenes opcionales del error' }) {
    const [dragging, setDragging] = useState(false);
    const selectedFiles = Array.isArray(files) ? files : (files ? [files] : []);
    const maxFileSize = 5 * 1024 * 1024;

    function selectFiles(nextFiles) {
        if (disabled) return;

        const incoming = [...(nextFiles || [])];
        if (!incoming.length) return;

        const validImages = incoming.filter((file) => file.type.startsWith('image/'));
        if (validImages.length !== incoming.length) {
            toast.error('Solo puedes adjuntar imagenes');
        }

        const validSizeImages = validImages.filter((file) => file.size <= maxFileSize);
        if (validSizeImages.length !== validImages.length) {
            toast.error('Cada imagen debe pesar maximo 5 MB');
        }

        if (!validSizeImages.length) {
            return;
        }

        const mergedFiles = [...selectedFiles, ...validSizeImages].slice(0, maxFiles);
        if (selectedFiles.length + validSizeImages.length > maxFiles) {
            toast.warning(`Solo se permiten ${maxFiles} imagenes`);
        }

        onChange(mergedFiles);
    }

    function handleDrop(e) {
        e.preventDefault();
        if (disabled) return;

        setDragging(false);
        selectFiles(e.dataTransfer.files);
    }

    function removeFile(index) {
        if (disabled) return;

        onChange(selectedFiles.filter((_, currentIndex) => currentIndex !== index));
    }

    return (
        <div
            className={`rounded-xl border border-dashed px-4 py-3 shadow-sm transition ${dragging ? 'border-brand-green bg-brand-green/10 ring-4 ring-emerald-500/10' : 'border-white/10 bg-[#202c33] hover:border-brand-green/50 hover:bg-[#26343d]'} ${disabled ? 'pointer-events-none opacity-60' : ''} ${className}`}
            onDragEnter={(e) => {
                e.preventDefault();
                setDragging(true);
            }}
            onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
        >
            <label className="flex min-h-16 cursor-pointer items-center gap-3 sm:gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-[#0b141a]/45 text-slate-300">
                    <ImageIcon size={20} />
                </span>
                <span className="min-w-0">
                    <span className="block break-words text-sm font-bold text-slate-100">
                        {selectedFiles.length ? `${selectedFiles.length} imagen(es) seleccionada(s)` : 'Arrastra fotos aqui o haz clic para buscar'}
                    </span>
                    <span className="mt-1 block break-words text-xs font-semibold text-slate-400">
                        {helperText}
                    </span>
                </span>
                <input type="file" accept="image/*" multiple className="hidden" disabled={disabled} onChange={(e) => selectFiles(e.target.files)} />
            </label>

            {selectedFiles.length > 0 && (
                <div className="mt-3 grid gap-2">
                    {selectedFiles.map((file, index) => (
                        <div key={`${file.name}-${file.size}-${index}`} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0b141a]/45 px-3 py-2">
                            <span className="truncate text-xs font-semibold text-slate-100">{file.name}</span>
                            <button type="button" className="text-xs font-bold text-rose-300 transition hover:text-rose-200" onClick={() => removeFile(index)}>
                                Quitar
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function CompanySuggestionsDropdown({ suggestions, loading, onSelect }) {
    return (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-white/10 bg-[#0b141a] shadow-2xl shadow-black/40">
            {loading && (
                <div className="flex items-center gap-2 px-3 py-3 text-xs font-semibold text-slate-400">
                    <LoaderCircle className="animate-spin" size={14} />
                    Buscando empresas...
                </div>
            )}

            {!loading && suggestions.length === 0 && (
                <div className="px-3 py-3 text-xs font-semibold text-slate-400">
                    Sin coincidencias
                </div>
            )}

            {!loading && suggestions.map((company) => (
                <button
                    key={`${company.nit || 'sin-nit'}-${company.empresa}`}
                    type="button"
                    className="block w-full border-b border-white/10 px-3 py-3 text-left transition last:border-b-0 hover:bg-white/10"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onSelect(company)}
                >
                    <span className="block truncate text-sm font-bold text-slate-100">{company.empresa}</span>
                    <span className="mt-1 block truncate text-xs font-semibold text-slate-400">
                        {company.nit || 'Sin NIT'} - {company.telefono || 'Sin telefono'}
                    </span>
                </button>
            ))}
        </div>
    );
}

function LoadingSpinner() {
    return <div className="grid min-h-64 place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" /></div>;
}

function CreateSupportButton({ technicians, onCreated }) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const submitLock = React.useRef(false);
    const emptyForm = { empresa: '', telefono: '', detalles_soporte: '', nit: '', anydesk: '', tecnico_asignado_id: '', error_images: [] };
    const [form, setForm] = useState(emptyForm);
    const [companySearchField, setCompanySearchField] = useState('empresa');
    const [companySuggestions, setCompanySuggestions] = useState([]);
    const [companySuggestionsOpen, setCompanySuggestionsOpen] = useState(false);
    const [loadingCompanySuggestions, setLoadingCompanySuggestions] = useState(false);
    useBodyScrollLock(open);

    useEffect(() => {
        if (!open) {
            setCompanySuggestions([]);
            setCompanySuggestionsOpen(false);
            return undefined;
        }

        const query = String(form[companySearchField] || '').trim();
        if (query.length < 2) {
            setCompanySuggestions([]);
            setCompanySuggestionsOpen(false);
            return undefined;
        }

        let cancelled = false;
        setLoadingCompanySuggestions(true);
        const timeoutId = window.setTimeout(async () => {
            try {
                const data = await api.get('/supports/company-suggestions', { params: { q: query } });
                if (cancelled) return;
                setCompanySuggestions(data.companies || []);
                setCompanySuggestionsOpen(true);
            } catch {
                if (!cancelled) {
                    setCompanySuggestions([]);
                    setCompanySuggestionsOpen(false);
                }
            } finally {
                if (!cancelled) setLoadingCompanySuggestions(false);
            }
        }, 250);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [open, form.empresa, form.nit, companySearchField]);

    async function submit(e) {
        e.preventDefault();
        if (submitLock.current) return;

        submitLock.current = true;
        setSaving(true);
        try {
            const data = await api.post('/supports', supportFormData(form));
            onCreated(data.support);
            setOpen(false);
            setForm(emptyForm);
            toast.success('Soporte creado');
        } catch (error) {
            toast.error(validationMessage(error, 'No se pudo crear el soporte'));
        } finally {
            submitLock.current = false;
            setSaving(false);
        }
    }

    function moveToNextCreateField(e) {
        if (e.key !== 'Enter' || e.shiftKey) return;

        e.preventDefault();
        const fields = [...e.currentTarget.form.querySelectorAll('[data-create-support-field="true"]')];
        const currentIndex = fields.indexOf(e.currentTarget);
        const nextField = fields[currentIndex + 1];

        if (nextField) {
            nextField.focus();
            return;
        }

        e.currentTarget.form.requestSubmit();
    }

    function updateCreateForm(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    function selectCompanySuggestion(company) {
        setForm((current) => ({
            ...current,
            empresa: company.empresa || current.empresa,
            telefono: company.telefono || current.telefono,
            nit: company.nit || current.nit,
            anydesk: company.anydesk || current.anydesk,
        }));
        setCompanySuggestionsOpen(false);
    }

    return (
        <>
            <button onClick={() => setOpen(true)} className="btn-primary"><Plus size={18} /> Nuevo soporte</button>
            {open && createPortal(
                <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/75 p-2 backdrop-blur-sm sm:p-4">
                    <motion.form initial={{ scale: .96, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} onSubmit={submit} className="admin-modal-panel card mx-auto my-3 w-full max-w-2xl p-4 shadow-2xl shadow-black/40 sm:my-8 sm:p-6">
                        <h2 className="text-xl font-bold text-white">Crear soporte</h2>
                        <div className="mt-5 grid gap-3 sm:gap-4 md:grid-cols-2">
                            <div className="relative">
                                <input
                                    data-create-support-field="true"
                                    className="input"
                                    placeholder="empresa"
                                    value={form.empresa}
                                    disabled={saving}
                                    onFocus={() => {
                                        setCompanySearchField('empresa');
                                        setCompanySuggestionsOpen(companySuggestions.length > 0);
                                    }}
                                    onBlur={() => window.setTimeout(() => setCompanySuggestionsOpen(false), 120)}
                                    onKeyDown={moveToNextCreateField}
                                    onChange={(e) => {
                                        setCompanySearchField('empresa');
                                        updateCreateForm('empresa', e.target.value);
                                    }}
                                />
                                {companySearchField === 'empresa' && companySuggestionsOpen && (
                                    <CompanySuggestionsDropdown
                                        suggestions={companySuggestions}
                                        loading={loadingCompanySuggestions}
                                        onSelect={selectCompanySuggestion}
                                    />
                                )}
                            </div>
                            <input data-create-support-field="true" className="input" placeholder="telefono" value={form.telefono} disabled={saving} onKeyDown={moveToNextCreateField} onChange={(e) => updateCreateForm('telefono', e.target.value)} />
                            <div className="relative">
                                <input
                                    data-create-support-field="true"
                                    className="input"
                                    placeholder="nit"
                                    value={form.nit}
                                    disabled={saving}
                                    onFocus={() => {
                                        setCompanySearchField('nit');
                                        setCompanySuggestionsOpen(companySuggestions.length > 0);
                                    }}
                                    onBlur={() => window.setTimeout(() => setCompanySuggestionsOpen(false), 120)}
                                    onKeyDown={moveToNextCreateField}
                                    onChange={(e) => {
                                        setCompanySearchField('nit');
                                        updateCreateForm('nit', e.target.value);
                                    }}
                                />
                                {companySearchField === 'nit' && companySuggestionsOpen && (
                                    <CompanySuggestionsDropdown
                                        suggestions={companySuggestions}
                                        loading={loadingCompanySuggestions}
                                        onSelect={selectCompanySuggestion}
                                    />
                                )}
                            </div>
                            <input data-create-support-field="true" className="input" placeholder="anydesk separados por coma" value={form.anydesk} disabled={saving} onKeyDown={moveToNextCreateField} onChange={(e) => updateCreateForm('anydesk', e.target.value)} />
                            <div className="md:col-span-2"><select data-create-support-field="true" className="input" value={form.tecnico_asignado_id || ''} disabled={saving} onKeyDown={moveToNextCreateField} onChange={(e) => setForm({ ...form, tecnico_asignado_id: e.target.value })}><option value="">Sin asignar</option>{technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                            <textarea data-create-support-field="true" className="input md:col-span-2" rows="4" placeholder="Detalles del soporte" value={form.detalles_soporte} disabled={saving} onKeyDown={moveToNextCreateField} onChange={(e) => setForm({ ...form, detalles_soporte: e.target.value })} />
                            <ImageDropField
                                className="md:col-span-2"
                                files={form.error_images}
                                disabled={saving}
                                onChange={(files) => setForm({ ...form, error_images: files })}
                            />
                        </div>
                        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
                            <button type="submit" className="btn-primary w-full sm:w-auto sm:min-w-32" disabled={saving}>
                                {saving ? <><LoaderCircle className="animate-spin" size={17} /> Guardando...</> : 'Guardar'}
                            </button>
                        </div>
                    </motion.form>
                </div>,
                document.body,
            )}
        </>
    );
}

function NotificationPermissionButton() {
    const [permission, setPermission] = useState(notificationPermissionState());

    useEffect(() => {
        setPermission(notificationPermissionState());

        if (!navigator.permissions?.query) return undefined;

        let status;
        let cancelled = false;
        navigator.permissions.query({ name: 'notifications' }).then((nextStatus) => {
            if (cancelled) return;
            status = nextStatus;
            status.onchange = () => setPermission(notificationPermissionState());
        }).catch(() => {});

        return () => {
            cancelled = true;
            if (status) status.onchange = null;
        };
    }, []);

    async function enable() {
        if (!('Notification' in window)) {
            toast.error('Este navegador no soporta notificaciones');
            return;
        }

        if (!canRequestBrowserNotifications()) {
            toast.error('Las notificaciones requieren HTTPS o abrir la app desde localhost/127.0.0.1');
            return;
        }

        if (Notification.permission === 'denied') {
            toast.error('Las notificaciones estan bloqueadas. Abre el candado del navegador y permitelas para este sitio.');
            setPermission(notificationPermissionState());
            return;
        }

        const nextPermission = await Notification.requestPermission();
        setPermission(notificationPermissionState());

        if (nextPermission === 'granted') {
            toast.success('Notificaciones activadas');
        } else {
            toast.error('No se pudieron activar. Revisa los permisos del navegador para este sitio.');
        }
    }

    const labels = {
        granted: 'Notificaciones activas',
        denied: 'Notificaciones bloqueadas',
        insecure: 'Notificaciones no disponibles',
        unsupported: 'Sin soporte de notificaciones',
        default: 'Activar notificaciones',
    };
    const warningState = ['denied', 'unsupported', 'insecure'].includes(permission);

    return (
        <button className="btn-secondary" onClick={enable} disabled={permission === 'granted'}>
            {warningState ? <AlertCircle size={17} /> : <Bell size={17} />}
            {labels[permission] || labels.default}
        </button>
    );
}

function notificationPermissionState() {
    if (!('Notification' in window)) return 'unsupported';
    if (!canRequestBrowserNotifications()) return 'insecure';
    return Notification.permission;
}

function canRequestBrowserNotifications() {
    const localHosts = ['localhost', '127.0.0.1', '::1'];
    return window.isSecureContext || localHosts.includes(window.location.hostname);
}

function SupportDetailPage() {
    const id = location.pathname.split('/').pop();
    const [support, setSupport] = useState(null);

    useEffect(() => {
        api.get(`/supports/${id}`).then((d) => setSupport(d.support));
    }, [id]);

    useSupportRealtime(support, setSupport);

    if (!support) return <Shell title="Soporte" subtitle="Detalle"><LoadingSpinner /></Shell>;

    return (
        <Shell title={support.codigo_soporte} subtitle={`${support.empresa} - ${support.telefono}`} action={<WhatsAppButton support={support} />}>
            <div className="grid gap-6">
                <div className="card p-5">
                    <div className="mb-5 flex items-center justify-between"><h2 className="font-bold text-white">Información</h2><SupportStatusBadge state={support.estado_soporte} solid /></div>
                    <SupportImagesEditor support={support} onSaved={setSupport} />
                    <dl className="grid gap-4 md:grid-cols-2">
                        {Object.entries(support).filter(([k]) => !['logs', 'technician', 'error_image_path', 'error_image_paths', 'error_image_url', 'error_image_urls'].includes(k)).map(([key, value]) => <div key={key} className="min-w-0 rounded-2xl border border-white/10 bg-[#202c33] p-4"><dt className="text-xs font-bold uppercase text-slate-400">{key}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-100">{String(value ?? '-')}</dd></div>)}
                    </dl>
                </div>
            </div>
        </Shell>
    );
}

function CompanySettingsPage() {
    const [settings, setSettings] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/company-settings').then((data) => {
            setSettings(data.settings);
        });
    }, []);

    async function saveSettings(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const data = await api.patch('/company-settings', settings);
            setSettings(data.settings);
            toast.success('Datos de empresa guardados');
        } finally {
            setSaving(false);
        }
    }

    if (!settings) {
        return <Shell title="Empresa" subtitle="Configuración de contacto"><LoadingSpinner /></Shell>;
    }

    return (
        <Shell title="Empresa" subtitle="Datos para contacto y WhatsApp">
            <form onSubmit={saveSettings} className="card mx-auto max-w-3xl p-6">
                <h2 className="text-lg font-bold text-white">Datos de soporte</h2>
                <p className="mt-1 text-sm text-slate-500">Este número se usa cuando el soporte no tiene técnico asignado o el técnico no tiene teléfono.</p>
                <label className="mt-5 block text-sm font-semibold text-slate-200">Nombre de empresa</label>
                <input className="input mt-2" value={settings.company_name || ''} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} />
                <label className="mt-4 block text-sm font-semibold text-slate-200">WhatsApp de soporte / empresa</label>
                <input className="input mt-2" placeholder="Ej: 573001112233" value={settings.support_phone || ''} onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })} />
                <label className="mt-4 block text-sm font-semibold text-slate-200">Correo de soporte</label>
                <input className="input mt-2" value={settings.support_email || ''} onChange={(e) => setSettings({ ...settings, support_email: e.target.value })} />
                <label className="mt-4 block text-sm font-semibold text-slate-200">Mensaje WhatsApp desde administración</label>
                <textarea className="input mt-2" rows="3" value={settings.default_whatsapp_message || ''} onChange={(e) => setSettings({ ...settings, default_whatsapp_message: e.target.value })} />
                <p className="mt-2 text-xs text-slate-500">Puedes usar {'{codigo_soporte}'} y {'{empresa}'}.</p>
                <label className="mt-4 block text-sm font-semibold text-slate-200">Horario o notas de atención</label>
                <textarea className="input mt-2" rows="3" value={settings.business_hours || ''} onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })} />
                <button className="btn-primary mt-6" disabled={saving}>{saving ? 'Guardando...' : 'Guardar empresa'}</button>
            </form>
        </Shell>
    );
}

function TechniciansPage() {
    const [technicians, setTechnicians] = useState(null);

    useEffect(() => {
        api.get('/company-settings').then((data) => setTechnicians(data.technicians));
    }, []);

    async function saveTechnician(technician) {
        const data = await api.patch(`/technicians/${technician.id}`, technician);
        setTechnicians((items) => items.map((item) => item.id === technician.id ? data.technician : item));
        toast.success(`Tecnico ${data.technician.name} actualizado`);
        return data.technician;
    }

    async function deleteTechnician(technician) {
        if (!confirm(`Eliminar al tecnico ${technician.name}? Los soportes asignados quedaran sin tecnico.`)) return;

        await api.delete(`/technicians/${technician.id}`);
        setTechnicians((items) => items.filter((item) => item.id !== technician.id));
        toast.success('Tecnico eliminado');
    }

    if (!technicians) {
        return <Shell title="Técnicos" subtitle="Contactos y accesos"><LoadingSpinner /></Shell>;
    }

    return (
        <Shell title="Técnicos" subtitle="Registro de técnicos y WhatsApp">
            <div className="card mx-auto max-w-4xl p-6">
                <h2 className="text-lg font-bold text-white">Técnicos</h2>
                <p className="mt-1 text-sm text-slate-500">Si un soporte tiene técnico asignado, el cliente verá el WhatsApp de ese técnico.</p>
                <CreateTechnicianForm onCreated={(technician) => setTechnicians((items) => [...items, technician].sort((a, b) => a.name.localeCompare(b.name)))} />
                <div className="mt-5 space-y-4">
                    {technicians.map((technician) => (
                        <TechnicianContactCard key={technician.id} technician={technician} onSave={saveTechnician} onDelete={deleteTechnician} />
                    ))}
                </div>
            </div>
        </Shell>
    );
}

function CreateTechnicianForm({ onCreated }) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: 'password', active: true });

    async function submit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const data = await api.post('/technicians', form);
            onCreated(data.technician);
            setForm({ name: '', email: '', phone: '', password: 'password', active: true });
            setOpen(false);
            toast.success('Técnico creado');
        } finally {
            setSaving(false);
        }
    }

    if (!open) {
        return <button className="btn-primary mt-5" onClick={() => setOpen(true)}><Plus size={18} /> Nuevo técnico</button>;
    }

    return (
        <form onSubmit={submit} className="mt-5 rounded-2xl border border-white/10 bg-[#202c33] p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre técnico" required />
                <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email login" required />
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="WhatsApp técnico" />
                <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Contraseña inicial" required />
            </div>
            <div className="mt-3 flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
                <button className="btn-primary" disabled={saving}>{saving ? 'Creando...' : 'Crear técnico'}</button>
            </div>
        </form>
    );
}

function TechnicianContactCard({ technician, onSave, onDelete }) {
    const [draft, setDraft] = useState({ ...technician, password: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setDraft({ ...technician, password: '' });
    }, [technician]);

    async function submit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await onSave(draft);
            setDraft({ ...updated, password: '' });
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-[#202c33] p-4">
            <div className="grid gap-3 md:grid-cols-2">
                <input className="input" value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nombre" />
                <input className="input" value={draft.email || ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email" />
                <input className="input" value={draft.phone || ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="WhatsApp técnico" />
                <input type="password" className="input" value={draft.password || ''} onChange={(e) => setDraft({ ...draft, password: e.target.value })} placeholder="Nueva contraseña (opcional)" minLength="6" />
                <label className="flex min-h-12 items-center gap-2 rounded-xl border border-white/10 bg-[#202c33] px-3 text-sm font-semibold text-slate-100 shadow-sm">
                    <input type="checkbox" checked={Boolean(draft.active)} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
                    Activo
                </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn-secondary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar técnico'}</button>
                <button type="button" className="btn-secondary border-rose-500/30 text-rose-200 hover:border-rose-400/60 hover:text-rose-100" onClick={() => onDelete(technician)} disabled={saving}>
                    <Trash2 size={16} /> Eliminar
                </button>
            </div>
        </form>
    );
}

function AdministratorsPage() {
    const [administrators, setAdministrators] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        api.get('/administrators').then((data) => setAdministrators(data.administrators));
    }, []);

    async function saveAdministrator(administrator) {
        const data = await api.patch(`/administrators/${administrator.id}`, administrator);
        setAdministrators((items) => items.map((item) => item.id === administrator.id ? data.administrator : item));
        toast.success(`Administrador ${data.administrator.name} actualizado`);
        return data.administrator;
    }

    async function deleteAdministrator(administrator) {
        if (!confirm(`Eliminar al administrador ${administrator.name}?`)) return;

        await api.delete(`/administrators/${administrator.id}`);
        setAdministrators((items) => items.filter((item) => item.id !== administrator.id));
        toast.success('Administrador eliminado');
    }

    if (!administrators) {
        return <Shell title="Administradores" subtitle="Cuentas de acceso"><LoadingSpinner /></Shell>;
    }

    return (
        <Shell title="Administradores" subtitle="Cuentas administrativas del sistema">
            <div className="card mx-auto max-w-4xl p-6">
                <h2 className="text-lg font-bold text-white">Administradores</h2>
                <p className="mt-1 text-sm text-slate-500">Estas cuentas pueden gestionar soportes, técnicos, empresa y otros administradores.</p>
                <CreateAdministratorForm onCreated={(administrator) => setAdministrators((items) => [...items, administrator].sort((a, b) => a.name.localeCompare(b.name)))} />
                <div className="mt-5 space-y-4">
                    {administrators.map((administrator) => (
                        <AdministratorCard
                            key={administrator.id}
                            administrator={administrator}
                            currentUserId={user?.id}
                            onSave={saveAdministrator}
                            onDelete={deleteAdministrator}
                        />
                    ))}
                </div>
            </div>
        </Shell>
    );
}

function CreateAdministratorForm({ onCreated }) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', active: true });

    async function submit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const data = await api.post('/administrators', form);
            onCreated(data.administrator);
            setForm({ name: '', email: '', phone: '', password: '', active: true });
            setOpen(false);
            toast.success('Administrador creado');
        } finally {
            setSaving(false);
        }
    }

    if (!open) {
        return <button className="btn-primary mt-5" onClick={() => setOpen(true)}><Plus size={18} /> Nuevo administrador</button>;
    }

    return (
        <form onSubmit={submit} className="mt-5 rounded-2xl border border-white/10 bg-[#202c33] p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre" required />
                <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email login" required />
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Teléfono" />
                <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Contraseña inicial" required minLength="6" />
            </div>
            <div className="mt-3 flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
                <button className="btn-primary" disabled={saving}>{saving ? 'Creando...' : 'Crear administrador'}</button>
            </div>
        </form>
    );
}

function AdministratorCard({ administrator, currentUserId, onSave, onDelete }) {
    const [draft, setDraft] = useState({ ...administrator, password: '' });
    const [saving, setSaving] = useState(false);
    const isSelf = Number(administrator.id) === Number(currentUserId);

    useEffect(() => {
        setDraft({ ...administrator, password: '' });
    }, [administrator]);

    async function submit(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await onSave(draft);
            setDraft({ ...updated, password: '' });
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-[#202c33] p-4">
            <div className="grid gap-3 md:grid-cols-2">
                <input className="input" value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nombre" required />
                <input className="input" value={draft.email || ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email" required />
                <input className="input" value={draft.phone || ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Teléfono" />
                <input type="password" className="input" value={draft.password || ''} onChange={(e) => setDraft({ ...draft, password: e.target.value })} placeholder="Nueva contraseña (opcional)" minLength="6" />
                <label className="flex min-h-12 items-center gap-2 rounded-xl border border-white/10 bg-[#202c33] px-3 text-sm font-semibold text-slate-100 shadow-sm">
                    <input type="checkbox" checked={Boolean(draft.active)} disabled={isSelf} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
                    Activo {isSelf ? '(tu cuenta)' : ''}
                </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn-secondary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar administrador'}</button>
                <button type="button" className="btn-secondary border-rose-500/30 text-rose-200 hover:border-rose-400/60 hover:text-rose-100" onClick={() => onDelete(administrator)} disabled={saving || isSelf}>
                    <Trash2 size={16} /> Eliminar
                </button>
            </div>
        </form>
    );
}

function PublicFrame({ children }) {
    return <div className="min-h-screen overflow-x-hidden bg-[#0b141a] text-slate-100">{children}</div>;
}

function PublicSupportRequestPage() {
    const [form, setForm] = useState({ empresa: '', nit: '', telefono: '', anydesk: '', detalles_soporte: '', sender_name: '', error_images: [] });
    const [created, setCreated] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    async function submit(e) {
        e.preventDefault();
        if (submitting) return;

        setSubmitting(true);
        try {
            const data = await api.post('/public/supports', supportFormData(form));
            setCreated(data.support);
            toast.success('Solicitud registrada');
        } catch (error) {
            toast.error(validationMessage(error, 'No se pudo enviar la solicitud'));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <PublicFrame>
            <div className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-4 sm:py-8">
                <PublicNav />
                <div className="grid min-w-0 items-start gap-6 py-8 sm:gap-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
                    <div className="min-w-0 pt-2 sm:pt-8">
                        <span className="inline-flex rounded-full border border-brand-green/30 bg-brand-green/10 px-4 py-2 text-sm font-bold text-brand-green shadow-sm">Soporte técnico remoto</span>
                        <h1 className="mt-6 max-w-2xl break-words text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">Solicita ayuda y sigue tu caso sin iniciar sesión.</h1>
                        <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">Registra la empresa, teléfono y detalles. Te entregamos un código para consultar estado y chatear con soporte.</p>
                    </div>
                    <form onSubmit={submit} className="card min-w-0 p-4 sm:p-6">
                        <h2 className="text-xl font-bold text-white">Nueva solicitud</h2>
                        {created ? <CreatedSupport support={created} /> : (
                            <div className="mt-5 grid gap-4">
                                <input className="input" placeholder="Empresa" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} required />
                                <div className="grid min-w-0 gap-4 sm:grid-cols-2"><input className="input" placeholder="NIT" value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} /><input className="input" placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} required /></div>
                                <input className="input" placeholder="AnyDesk separados por coma" value={form.anydesk} onChange={(e) => setForm({ ...form, anydesk: e.target.value })} />
                                <textarea className="input" rows="5" placeholder="Detalles del soporte" value={form.detalles_soporte} onChange={(e) => setForm({ ...form, detalles_soporte: e.target.value })} required />
                                <ImageDropField
                                    files={form.error_images}
                                    onChange={(files) => setForm({ ...form, error_images: files })}
                                />
                                <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Enviando...' : 'Enviar solicitud'}</button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </PublicFrame>
    );
}

function PublicSupportStatusPage() {
    const [query, setQuery] = useState({ codigo_soporte: '' });
    const [support, setSupport] = useState(null);

    useSupportRealtime(support, setSupport);

    async function submit(e) {
        e.preventDefault();
        const data = await api.get(`/public/supports/${query.codigo_soporte}`);
        setSupport(data.support);
    }

    return (
        <PublicFrame>
            <div className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-4 sm:py-8">
                <PublicNav />
                <div className="grid min-w-0 gap-6 py-8 sm:py-10 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
                    <form onSubmit={submit} className="card min-w-0 p-4 sm:p-6">
                        <h1 className="text-2xl font-black">Consultar soporte</h1>
                        <input className="input mt-5" placeholder="Código SOP-..." value={query.codigo_soporte} onChange={(e) => setQuery({ ...query, codigo_soporte: e.target.value })} required />
                        <button className="btn-primary mt-5 w-full">Consultar</button>
                    </form>
                    {support && <PublicSupportSummary support={support} />}
                </div>
            </div>
        </PublicFrame>
    );
}

function PublicNav() {
    return (
        <nav className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <Link to="/" className="flex min-w-0 items-center gap-3 font-black text-white">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-blue text-white shadow-md shadow-black/30"><Headphones size={20} /></span>
                <span className="min-w-0 whitespace-nowrap">esys<span className="text-brand-blue">POS</span></span>
            </Link>
            <div className="flex min-w-0 flex-1 flex-wrap justify-end gap-2">
                <Link className="btn-secondary flex-1 px-3 sm:flex-none sm:px-4" to="/estado">Consultar</Link>
                <Link className="btn-primary flex-1 px-3 sm:flex-none sm:px-4" to="/login">Administrar</Link>
            </div>
        </nav>
    );
}

function CreatedSupport({ support }) {
    async function copyCode() {
        try {
            await navigator.clipboard.writeText(support.codigo_soporte);
        } catch {
            const input = document.createElement('input');
            input.value = support.codigo_soporte;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            input.remove();
        }

        toast.success('Código copiado');
    }

    return (
        <div className="mt-5 rounded-2xl border border-brand-green/30 bg-brand-green/10 p-5 text-slate-50">
            <p className="font-bold text-brand-green">Solicitud creada</p>
            <p className="mt-2 break-words text-3xl font-black">{support.codigo_soporte}</p>
            <p className="mt-2 text-sm text-slate-300">Guarda este código para consultar el estado.</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button type="button" className="btn-secondary w-full sm:w-auto" onClick={copyCode}><Copy size={16} /> Copiar código</button>
                <Link className="btn-primary w-full sm:w-auto" to="/estado">Consultar estado</Link>
            </div>
        </div>
    );
}

function PublicSupportSummary({ support }) {
    const summaryItems = [
        ['Empresa', support.empresa],
        ['NIT', support.nit],
        ['Telefono', support.telefono],
        ['Fecha de solicitud', formatPublicDate(support.fecha || support.created_at)],
        ['Hora de registro', formatShortTime(support.hora_registro)],
        ['Ultima actualizacion', formatPublicDateTime(support.updated_at)],
        ['Inicio de atencion', formatShortTime(support.hora_inicio)],
        ['Finalizacion', formatShortTime(support.hora_final)],
    ].filter(([, value]) => value);

    return (
        <div className="card min-w-0 p-4 sm:p-5">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <h2 className="break-words font-bold text-white">{support.codigo_soporte}</h2>
                <SupportStatusBadge state={support.estado_soporte} solid />
            </div>

            <div className="mt-4 flex items-center gap-3">
                <WhatsAppButton support={support} target="support" />
                <span className="text-sm font-semibold text-slate-400">
                    {support.contact_name || 'Soporte'}
                    <span className="block text-xs font-medium text-slate-500">{support.tecnico_asignado_nombre ? 'Tecnico asignado' : 'Soporte'}</span>
                </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {summaryItems.map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-[#202c33]/70 px-3 py-2">
                        <p className="text-[11px] font-bold uppercase text-slate-500">{label}</p>
                        <p className="mt-1 break-words text-sm font-semibold text-slate-100">{value}</p>
                    </div>
                ))}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-[#0b141a]/45 p-3">
                <p className="text-[11px] font-bold uppercase text-slate-500">Detalle reportado</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-300">{support.detalles_soporte || 'Sin detalle registrado'}</p>
            </div>
        </div>
    );
}

function formatPublicDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatPublicDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function SupportErrorImage({ support }) {
    const imageUrls = supportImageUrls(support);
    if (!imageUrls.length) return null;

    return (
        <div className="mb-5 mt-4 grid gap-3 sm:grid-cols-2">
            {imageUrls.map((url, index) => (
                <a key={url} className="block overflow-hidden rounded-2xl border border-white/10 bg-[#0b141a]" href={url} target="_blank" rel="noreferrer">
                    <img className="max-h-80 w-full object-contain" src={url} alt={`Foto del error ${index + 1}`} />
                </a>
            ))}
        </div>
    );
}

function SupportImageLink({ support, compact = false }) {
    const [open, setOpen] = useState(false);
    useBodyScrollLock(open);
    const imageUrls = supportImageUrls(support);

    if (!imageUrls.length) return <ReadOnlyCell value="" align="center" compact={compact} />;

    return (
        <>
            <button type="button" className={compact ? 'table-icon-button' : 'btn-secondary px-3 py-2 text-xs'} onClick={() => setOpen(true)} title="Ver foto del error">
                <ImageIcon size={compact ? 17 : 16} /> {!compact && 'Ver foto'}
            </button>
            {open && createPortal(
                <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
                    <div className="admin-modal-panel card max-h-[92vh] w-full max-w-5xl overflow-hidden p-4 shadow-2xl shadow-black/50" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h2 className="text-sm font-bold text-white">{imageUrls.length > 1 ? 'Fotos del error' : 'Foto del error'}</h2>
                            <button type="button" className="btn-secondary px-3 py-2" onClick={() => setOpen(false)}>Cerrar</button>
                        </div>
                        <div className="grid max-h-[78vh] gap-3 overflow-y-auto sm:grid-cols-2">
                            {imageUrls.map((url, index) => (
                                <a key={url} className="block overflow-hidden rounded-xl border border-white/10 bg-[#0b141a]" href={url} target="_blank" rel="noreferrer">
                                    <img className="max-h-[70vh] w-full object-contain" src={url} alt={`Foto del error ${index + 1}`} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body,
            )}
        </>
    );
}

function supportImageUrls(support) {
    const urls = Array.isArray(support.error_image_urls) ? support.error_image_urls : [];
    const uniqueUrls = support.error_image_url && !urls.includes(support.error_image_url)
        ? [support.error_image_url, ...urls]
        : urls;

    return uniqueUrls.map(normalizeStorageUrl);
}

function normalizeStorageUrl(url) {
    if (!url) return url;

    try {
        const parsedUrl = new URL(url, window.location.origin);

        if (parsedUrl.pathname.startsWith('/storage/')) {
            if (usesProductionStoragePath()) {
                return `${PRODUCTION_STORAGE_BASE_URL}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
            }

            return `${API_ORIGIN}${API_PUBLIC_BASE_PATH}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
        }

        return parsedUrl.href;
    } catch {
        return url;
    }
}

function usesProductionStoragePath() {
    const hostname = window.location.hostname.toLowerCase();

    return hostname === 'esyspos.com'
        || hostname === 'www.esyspos.com'
        || API_BASE_URL.includes('www.esyspos.com/soporte/api')
        || API_BASE_URL.includes('esyspos.com/soporte/api');
}

function StatsCards({ stats = {} }) {
    const cards = [
        ['Pendientes', stats.pendiente || 0, ClipboardList, 'bg-amber-50 text-amber-700'],
        ['En proceso', stats.en_proceso || 0, Activity, 'bg-brand-soft text-brand-blue'],
        ['Total', stats.total || 0, Headphones, 'bg-emerald-50 text-brand-green'],
    ];
    return (
        <div className="grid gap-3 md:grid-cols-3">
            {cards.map(([label, value, Icon, cls]) => (
                <div key={label} className="card flex items-center gap-4 px-5 py-4">
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${cls}`}>
                        <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-500">{label}</p>
                        <p className="text-2xl font-black leading-tight text-white">{value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function MiniList({ supports }) {
    return (
        <div className="divide-y divide-white/10">
            {supports.map((s) => (
                <Link key={s.id} to={`/admin/soportes/${s.id}`} className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition hover:bg-white/10">
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-100">{s.empresa}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                            <span>{s.codigo_soporte}</span>
                            <span>{s.tecnico_asignado_nombre || 'Sin asignar'}</span>
                        </div>
                    </div>
                    <SupportStatusBadge state={s.estado_soporte} solid />
                </Link>
            ))}
        </div>
    );
}

function exportCsv(rows) {
    const columns = [
        ['id', 'ID'],
        ['fecha', 'Fecha'],
        ['nit', 'NIT'],
        ['empresa', 'Empresa'],
        ['detalles_soporte', 'Detalles soporte'],
        ['telefono', 'Telefono'],
        ['anydesk', 'AnyDesk'],
        ['hora_registro', 'Hora registro'],
        ['hora_inicio', 'Hora inicio'],
        ['hora_final', 'Hora final'],
        ['observacion_tecnico', 'Observacion tecnico'],
        ['estado_soporte', 'Estado'],
        ['tecnico_asignado_nombre', 'Tecnico asignado'],
        ['codigo_soporte', 'Codigo soporte'],
        ['created_at', 'Creado'],
        ['updated_at', 'Actualizado'],
    ];
    const separator = ';';
    const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [
        `sep=${separator}`,
        columns.map(([, label]) => escapeCell(label)).join(separator),
        ...rows.map((row) => columns.map(([key]) => escapeCell(row[key])).join(separator)),
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soportes.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function formatDate(value) {
    if (!value) return '';
    const text = String(value).trim();
    const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
        const [, year, month, day] = match;
        return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    }
    return text;
}

function formatTableCellValue(field, value) {
    if (field === 'created_at' || field === 'updated_at') return formatDateTime(value);
    if (field === 'hora_registro' || field === 'hora_inicio' || field === 'hora_final') return formatShortTime(value);
    if (field === 'fecha') return formatDate(value);

    return value;
}

function formatDateWithRegisterTime(support) {
    return (
        <span className="flex flex-col items-center gap-0.5 leading-tight">
            <span>{formatTableCellValue('fecha', support.fecha) || '-'}</span>
            <span className="text-xs font-bold text-slate-400">{formatShortTime(support.hora_registro) || '-'}</span>
        </span>
    );
}

function formatShortTime(value) {
    if (!value) return '';

    const text = String(value).trim();
    const match = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

    if (match) {
        const date = new Date();
        date.setHours(Number(match[1]), Number(match[2]), 0, 0);

        return compactMeridiem(date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true }));
    }

    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
        return compactMeridiem(date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true }));
    }

    return text;
}

function compactMeridiem(value) {
    return String(value)
        .replace(/\s*a\.\s*m\./i, ' am')
        .replace(/\s*p\.\s*m\./i, ' pm')
        .replace(/\s*AM/i, ' am')
        .replace(/\s*PM/i, ' pm');
}

function formatDateTime(value) {
    if (!value) return '';
    return new Date(value).toLocaleString();
}

createRoot(document.getElementById('root')).render(<App />);
