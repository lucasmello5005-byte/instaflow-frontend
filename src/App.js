import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

// ── API Setup ─────────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://instaflow-backend-production.up.railway.app/api',
  timeout: 15000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('instaflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('instaflow_token');
    window.location.reload();
  }
  return Promise.reject(err);
});

// ── Auth Context ──────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('instaflow_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me').then(r => setUser(r.data.user)).catch(() => localStorage.removeItem('instaflow_token')).finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    localStorage.setItem('instaflow_token', r.data.token);
    setUser(r.data.user);
  };
  const register = async (name, email, password) => {
    const r = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('instaflow_token', r.data.token);
    setUser(r.data.user);
  };
  const logout = () => { localStorage.removeItem('instaflow_token'); setUser(null); };

  return <AuthCtx.Provider value={{ user, loading, login, register, logout }}>{children}</AuthCtx.Provider>;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  app: { display:'flex', minHeight:'100vh', background:'#08090d', color:'#f1f2f7', fontFamily:"'Segoe UI',sans-serif" },
  sidebar: { width:220, background:'#0f1018', borderRight:'1px solid #252838', display:'flex', flexDirection:'column', position:'fixed', height:'100vh', zIndex:50 },
  logo: { padding:'24px 20px', borderBottom:'1px solid #252838' },
  logoText: { fontSize:20, fontWeight:800, letterSpacing:'-0.5px' },
  logoSpan: { color:'#f97316' },
  nav: { padding:'12px 10px', flex:1 },
  navLabel: { fontSize:10, color:'#6b7280', letterSpacing:'1.5px', textTransform:'uppercase', padding:'12px 10px 6px' },
  navItem: (active) => ({ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, cursor:'pointer', fontSize:13.5, color: active ? '#f97316' : '#9ca3af', marginBottom:1, background: active ? 'rgba(249,115,22,0.1)' : 'transparent', border: active ? '1px solid rgba(249,115,22,0.2)' : '1px solid transparent', transition:'all .15s' }),
  main: { marginLeft:220, flex:1, display:'flex', flexDirection:'column' },
  topbar: { background:'#0f1018', borderBottom:'1px solid #252838', padding:'0 32px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:40 },
  content: { padding:32 },
  card: { background:'#0f1018', border:'1px solid #252838', borderRadius:14, overflow:'hidden', marginBottom:20 },
  cardHeader: { padding:'18px 22px', borderBottom:'1px solid #252838', display:'flex', alignItems:'center', justifyContent:'space-between' },
  cardTitle: { fontSize:14, fontWeight:700 },
  cardBody: { padding:22 },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 },
  statCard: { background:'#0f1018', border:'1px solid #252838', borderRadius:14, padding:20 },
  btn: (variant) => ({
    display:'inline-flex', alignItems:'center', gap:7, padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, transition:'all .2s',
    background: variant==='primary' ? '#f97316' : variant==='danger' ? 'rgba(239,68,68,0.1)' : '#1e2130',
    color: variant==='primary' ? 'white' : variant==='danger' ? '#ef4444' : '#f1f2f7',
    borderColor: variant==='ghost' ? '#2e3347' : 'transparent',
    borderWidth:1, borderStyle:'solid',
  }),
  input: { width:'100%', background:'#171923', border:'1px solid #2e3347', borderRadius:9, padding:'10px 14px', color:'#f1f2f7', fontSize:13.5, outline:'none', fontFamily:"'Segoe UI',sans-serif", boxSizing:'border-box' },
  label: { display:'block', fontSize:11, color:'#9ca3af', letterSpacing:'.5px', textTransform:'uppercase', marginBottom:7, fontWeight:600 },
  badge: (status) => ({
    display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600,
    background: status==='published' ? 'rgba(16,185,129,0.12)' : status==='failed' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
    color: status==='published' ? '#10b981' : status==='failed' ? '#ef4444' : '#3b82f6',
    border: `1px solid ${status==='published' ? 'rgba(16,185,129,0.2)' : status==='failed' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
  }),
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  modal: { background:'#0f1018', border:'1px solid #252838', borderRadius:18, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' },
  modalHeader: { padding:'20px 24px', borderBottom:'1px solid #252838', display:'flex', alignItems:'center', justifyContent:'space-between' },
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position:'fixed', bottom:24, right:24, background:'#1e2130', border:`1px solid ${type==='error'?'rgba(239,68,68,0.3)':'rgba(16,185,129,0.3)'}`, borderRadius:12, padding:'13px 18px', fontSize:13, zIndex:999, display:'flex', alignItems:'center', gap:10 }}>
      {msg}
    </div>
  );
}

// ── Login Page ────────────────────────────────────────────────────────────────
function LoginPage({ onSwitch }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true); setError('');
    try { await login(email, pass); }
    catch(e) { setError(e.response?.data?.error || 'Erro ao fazer login'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#08090d' }}>
      <div style={{ background:'#0f1018', border:'1px solid #252838', borderRadius:20, padding:40, width:'100%', maxWidth:400 }}>
        <div style={{ fontSize:26, fontWeight:800, textAlign:'center', marginBottom:8, color:'#f1f2f7' }}>Insta<span style={{ color:'#f97316' }}>Flow</span></div>
        <div style={{ textAlign:'center', color:'#6b7280', fontSize:14, marginBottom:32 }}>Faça login na sua conta</div>
        {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#ef4444', marginBottom:16 }}>{error}</div>}
        <div style={{ marginBottom:16 }}>
          <label style={S.label}>Email</label>
          <input style={S.input} type="email" placeholder="voce@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={S.label}>Senha</label>
          <input style={S.input} type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} />
        </div>
        <button style={{ ...S.btn('primary'), width:'100%', justifyContent:'center', padding:'12px' }} onClick={submit} disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p style={{ textAlign:'center', fontSize:13, color:'#6b7280', marginTop:20 }}>
          Não tem conta? <span style={{ color:'#f97316', cursor:'pointer' }} onClick={onSwitch}>Criar conta grátis</span>
        </p>
      </div>
    </div>
  );
}

// ── Register Page ─────────────────────────────────────────────────────────────
function RegisterPage({ onSwitch }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true); setError('');
    try { await register(form.name, form.email, form.password); }
    catch(e) { setError(e.response?.data?.error || 'Erro ao criar conta'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#08090d' }}>
      <div style={{ background:'#0f1018', border:'1px solid #252838', borderRadius:20, padding:40, width:'100%', maxWidth:400 }}>
        <div style={{ fontSize:26, fontWeight:800, textAlign:'center', marginBottom:8, color:'#f1f2f7' }}>Insta<span style={{ color:'#f97316' }}>Flow</span></div>
        <div style={{ textAlign:'center', color:'#6b7280', fontSize:14, marginBottom:32 }}>Crie sua conta grátis</div>
        {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#ef4444', marginBottom:16 }}>{error}</div>}
        {['name','email','password'].map(f => (
          <div key={f} style={{ marginBottom:16 }}>
            <label style={S.label}>{f==='name'?'Nome':f==='email'?'Email':'Senha'}</label>
            <input style={S.input} type={f==='password'?'password':f==='email'?'email':'text'} placeholder={f==='name'?'Seu nome':f==='email'?'voce@email.com':'Mínimo 6 caracteres'} value={form[f]} onChange={e=>setForm({...form,[f]:e.target.value})} />
          </div>
        ))}
        <button style={{ ...S.btn('primary'), width:'100%', justifyContent:'center', padding:'12px', marginTop:4 }} onClick={submit} disabled={loading}>
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
        <p style={{ textAlign:'center', fontSize:13, color:'#6b7280', marginTop:20 }}>
          Já tem conta? <span style={{ color:'#f97316', cursor:'pointer' }} onClick={onSwitch}>Entrar</span>
        </p>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ showToast }) {
  const [posts, setPosts] = useState([]);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    api.get('/posts?limit=5').then(r => setPosts(r.data.posts || [])).catch(()=>{});
    api.get('/accounts').then(r => setAccounts(r.data.accounts || [])).catch(()=>{});
  }, []);

  const stats = [
    { icon:'📸', value: posts.filter(p=>p.status==='published').length || 0, label:'Posts Publicados', color:'#f97316' },
    { icon:'📅', value: posts.filter(p=>p.status==='scheduled').length || 0, label:'Agendados', color:'#3b82f6' },
    { icon:'📱', value: accounts.length, label:'Contas Conectadas', color:'#10b981' },
    { icon:'⚡', value: '99%', label:'Uptime', color:'#8b5cf6' },
  ];

  return (
    <div>
      <div style={S.statsGrid}>
        {stats.map((s,i) => (
          <div key={i} style={S.statCard}>
            <div style={{ fontSize:20, marginBottom:12 }}>{s.icon}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#6b7280', marginTop:4, textTransform:'uppercase', letterSpacing:'.5px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={S.cardHeader}>
          <div style={S.cardTitle}>📋 Últimos Posts</div>
        </div>
        <div style={S.cardBody}>
          {posts.length === 0 && <div style={{ textAlign:'center', padding:32, color:'#6b7280' }}>Nenhum post ainda. Crie seu primeiro post!</div>}
          {posts.map(p => (
            <div key={p._id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom:'1px solid #252838' }}>
              <div style={{ width:44, height:44, borderRadius:9, background:'linear-gradient(135deg,#1e2130,#252838)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📸</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.caption}</div>
                <div style={{ fontSize:11, color:'#6b7280', marginTop:3 }}>🕐 {new Date(p.scheduledAt).toLocaleString('pt-BR')}</div>
              </div>
              <span style={S.badge(p.status)}>{p.status==='published'?'✅ Publicado':p.status==='failed'?'❌ Falhou':'📅 Agendado'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Posts Page ────────────────────────────────────────────────────────────────
function PostsPage({ showToast }) {
  const [posts, setPosts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ accountId:'', caption:'', mediaUrl:'', scheduledAt:'', postType:'feed', recurrence:'once' });
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.get('/posts').then(r => setPosts(r.data.posts || [])).catch(()=>{});
    api.get('/accounts').then(r => setAccounts(r.data.accounts || [])).catch(()=>{});
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.accountId || !form.caption || !form.mediaUrl || !form.scheduledAt) {
      showToast('Preencha todos os campos!', 'error'); return;
    }
    setLoading(true);
    try {
      await api.post('/posts', form);
      showToast('✅ Post agendado!', 'success');
      setModal(false); setForm({ accountId:'', caption:'', mediaUrl:'', scheduledAt:'', postType:'feed', recurrence:'once' });
      load();
    } catch(e) { showToast(e.response?.data?.error || 'Erro ao agendar', 'error'); }
    finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Remover este post?')) return;
    await api.delete(`/posts/${id}`); showToast('Post removido', 'success'); load();
  };

  const publishNow = async (id) => {
    try { await api.post(`/posts/${id}/publish-now`); showToast('✅ Publicado!', 'success'); load(); }
    catch(e) { showToast(e.response?.data?.error || 'Erro ao publicar', 'error'); }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:20 }}>
        <button style={S.btn('primary')} onClick={()=>setModal(true)}>✚ Novo Post</button>
      </div>

      <div style={S.card}>
        <div style={S.cardBody}>
          {posts.length === 0 && <div style={{ textAlign:'center', padding:32, color:'#6b7280' }}>Nenhum post agendado ainda.</div>}
          {posts.map(p => (
            <div key={p._id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom:'1px solid #252838' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.caption}</div>
                <div style={{ fontSize:11, color:'#6b7280', marginTop:3, display:'flex', gap:12 }}>
                  <span>🕐 {new Date(p.scheduledAt).toLocaleString('pt-BR')}</span>
                  <span>{p.postType}</span>
                  {p.recurrence !== 'once' && <span>🔁 {p.recurrence}</span>}
                </div>
              </div>
              <span style={S.badge(p.status)}>{p.status==='published'?'✅ Publicado':p.status==='failed'?'❌ Falhou':'📅 Agendado'}</span>
              <div style={{ display:'flex', gap:6 }}>
                {p.status==='scheduled' && <button style={{ ...S.btn('ghost'), fontSize:12, padding:'6px 10px' }} onClick={()=>publishNow(p._id)}>▶ Agora</button>}
                <button style={{ ...S.btn('danger'), fontSize:12, padding:'6px 10px' }} onClick={()=>del(p._id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={S.modal}>
            <div style={S.modalHeader}>
              <div style={{ fontSize:16, fontWeight:700 }}>✚ Novo Post Agendado</div>
              <button style={{ background:'none', border:'none', color:'#6b7280', fontSize:20, cursor:'pointer' }} onClick={()=>setModal(false)}>×</button>
            </div>
            <div style={{ padding:24 }}>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Conta Instagram</label>
                <select style={S.input} value={form.accountId} onChange={e=>setForm({...form,accountId:e.target.value})}>
                  <option value="">Selecione uma conta...</option>
                  {accounts.map(a => <option key={a._id} value={a._id}>@{a.username}</option>)}
                </select>
                {accounts.length===0 && <div style={{ fontSize:12, color:'#f59e0b', marginTop:6 }}>⚠️ Conecte uma conta Instagram primeiro na aba "Contas"</div>}
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Legenda</label>
                <textarea style={{ ...S.input, resize:'vertical', minHeight:80, lineHeight:1.6 }} placeholder="Escreva sua legenda..." value={form.caption} onChange={e=>setForm({...form,caption:e.target.value})} />
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>URL da Imagem (Cloudinary, etc.)</label>
                <input style={S.input} placeholder="https://res.cloudinary.com/..." value={form.mediaUrl} onChange={e=>setForm({...form,mediaUrl:e.target.value})} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <div>
                  <label style={S.label}>Data e Hora</label>
                  <input style={S.input} type="datetime-local" value={form.scheduledAt} onChange={e=>setForm({...form,scheduledAt:e.target.value})} />
                </div>
                <div>
                  <label style={S.label}>Tipo</label>
                  <select style={S.input} value={form.postType} onChange={e=>setForm({...form,postType:e.target.value})}>
                    <option value="feed">📷 Feed</option>
                    <option value="reel">🎬 Reel</option>
                    <option value="story">📱 Story</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={S.label}>Recorrência</label>
                <select style={S.input} value={form.recurrence} onChange={e=>setForm({...form,recurrence:e.target.value})}>
                  <option value="once">Uma vez</option>
                  <option value="daily">Diariamente</option>
                  <option value="weekly">Semanalmente</option>
                  <option value="weekdays">Dias úteis</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button style={S.btn('ghost')} onClick={()=>setModal(false)}>Cancelar</button>
                <button style={S.btn('primary')} onClick={save} disabled={loading}>{loading?'Agendando...':'📅 Agendar Post'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Accounts Page ─────────────────────────────────────────────────────────────
function AccountsPage({ showToast }) {
  const [accounts, setAccounts] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ igBusinessId:'', accessToken:'', username:'' });
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/accounts').then(r => setAccounts(r.data.accounts || [])).catch(()=>{});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.igBusinessId || !form.accessToken || !form.username) { showToast('Preencha todos os campos!', 'error'); return; }
    setLoading(true);
    try {
      await api.post('/accounts', form);
      showToast('✅ Conta conectada!', 'success');
      setModal(false); setForm({ igBusinessId:'', accessToken:'', username:'' }); load();
    } catch(e) { showToast(e.response?.data?.error || 'Erro ao conectar', 'error'); }
    finally { setLoading(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Desconectar esta conta?')) return;
    await api.delete(`/accounts/${id}`); showToast('Conta desconectada', 'success'); load();
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:20 }}>
        <button style={S.btn('primary')} onClick={()=>setModal(true)}>＋ Conectar Conta</button>
      </div>

      {accounts.length === 0 && (
        <div style={{ ...S.card, textAlign:'center', padding:48 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📱</div>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>Nenhuma conta conectada</div>
          <div style={{ fontSize:12, color:'#6b7280', marginBottom:20 }}>Conecte sua conta Instagram Business para começar</div>
          <button style={S.btn('primary')} onClick={()=>setModal(true)}>Conectar agora</button>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {accounts.map(a => (
          <div key={a._id} style={S.card}>
            <div style={S.cardBody}>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#f97316,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>@</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700 }}>@{a.username}</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>{a.accountType} · {a.followersCount?.toLocaleString()} seguidores</div>
                </div>
                <div style={{ marginLeft:'auto', width:8, height:8, borderRadius:'50%', background: a.isActive ? '#10b981' : '#ef4444', boxShadow:`0 0 6px ${a.isActive?'#10b981':'#ef4444'}` }}></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                <div style={{ background:'#171923', border:'1px solid #252838', borderRadius:8, padding:'10px', textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:700 }}>{Math.ceil((new Date(a.tokenExpiresAt) - Date.now()) / 86400000)}d</div>
                  <div style={{ fontSize:10, color:'#6b7280', marginTop:2 }}>Token expira</div>
                </div>
                <div style={{ background:'#171923', border:'1px solid #252838', borderRadius:8, padding:'10px', textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:700 }}>{a.accountType}</div>
                  <div style={{ fontSize:10, color:'#6b7280', marginTop:2 }}>Tipo</div>
                </div>
              </div>
              <button style={{ ...S.btn('danger'), width:'100%', justifyContent:'center' }} onClick={()=>remove(a._id)}>Desconectar</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={S.modal}>
            <div style={S.modalHeader}>
              <div style={{ fontSize:16, fontWeight:700 }}>📱 Conectar Conta Instagram</div>
              <button style={{ background:'none', border:'none', color:'#6b7280', fontSize:20, cursor:'pointer' }} onClick={()=>setModal(false)}>×</button>
            </div>
            <div style={{ padding:24 }}>
              {[['username','Username (sem @)','joaosilva.shop'],['igBusinessId','Instagram Business Account ID','17841400008460056'],['accessToken','Access Token','EAABsbCS...']].map(([f,l,p]) => (
                <div key={f} style={{ marginBottom:16 }}>
                  <label style={S.label}>{l}</label>
                  <input style={S.input} type={f==='accessToken'?'password':'text'} placeholder={p} value={form[f]} onChange={e=>setForm({...form,[f]:e.target.value})} />
                </div>
              ))}
              <div style={{ background:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:10, padding:14, fontSize:12, color:'#9ca3af', marginBottom:20, lineHeight:1.7 }}>
                💡 Obtenha seu Business ID e Access Token em <strong style={{color:'#f97316'}}>developers.facebook.com/tools/explorer</strong>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button style={S.btn('ghost')} onClick={()=>setModal(false)}>Cancelar</button>
                <button style={S.btn('primary')} onClick={save} disabled={loading}>{loading?'Conectando...':'Conectar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Products Page ─────────────────────────────────────────────────────────────
function ProductsPage({ showToast }) {
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:'', description:'', price:'', category:'Geral', link:'' });
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/products').then(r => setProducts(r.data.products || [])).catch(()=>{});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name) { showToast('Nome é obrigatório!', 'error'); return; }
    setLoading(true);
    try {
      await api.post('/products', { ...form, price: parseFloat(form.price) || 0 });
      showToast('✅ Produto adicionado!', 'success');
      setModal(false); setForm({ name:'', description:'', price:'', category:'Geral', link:'' }); load();
    } catch(e) { showToast('Erro ao salvar produto', 'error'); }
    finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Remover produto?')) return;
    await api.delete(`/products/${id}`); showToast('Produto removido', 'success'); load();
  };

  const emojis = { 'Roupas':'👕', 'Calçados':'👟', 'Serviços':'💡', 'Digital':'📘', 'Geral':'🛍️' };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:20 }}>
        <button style={S.btn('primary')} onClick={()=>setModal(true)}>＋ Novo Produto</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {products.map(p => (
          <div key={p._id} style={{ ...S.card, cursor:'pointer' }}>
            <div style={{ width:'100%', aspectRatio:'1', background:'linear-gradient(135deg,#171923,#1e2130)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 }}>
              {emojis[p.category] || '🛍️'}
            </div>
            <div style={{ padding:14 }}>
              <div style={{ fontSize:13, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
              <div style={{ fontSize:16, fontWeight:800, color:'#f97316', margin:'4px 0 2px' }}>R$ {p.price?.toFixed(2).replace('.',',')}</div>
              <div style={{ fontSize:11, color:'#6b7280', marginBottom:12 }}>{p.category}</div>
              <button style={{ ...S.btn('danger'), fontSize:11, padding:'5px 10px' }} onClick={()=>del(p._id)}>🗑 Remover</button>
            </div>
          </div>
        ))}

        <div style={{ ...S.card, display:'flex', alignItems:'center', justifyContent:'center', minHeight:220, cursor:'pointer', borderStyle:'dashed' }} onClick={()=>setModal(true)}>
          <div style={{ textAlign:'center', color:'#6b7280' }}>
            <div style={{ fontSize:32, marginBottom:6 }}>＋</div>
            <div style={{ fontSize:12 }}>Adicionar produto</div>
          </div>
        </div>
      </div>

      {modal && (
        <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={S.modal}>
            <div style={S.modalHeader}>
              <div style={{ fontSize:16, fontWeight:700 }}>🛍️ Novo Produto</div>
              <button style={{ background:'none', border:'none', color:'#6b7280', fontSize:20, cursor:'pointer' }} onClick={()=>setModal(false)}>×</button>
            </div>
            <div style={{ padding:24 }}>
              {[['name','Nome do Produto','Camiseta Premium'],['description','Descrição','Algodão 100%...'],['price','Preço (R$)','89.90'],['link','Link do produto','https://sualoja.com/produto']].map(([f,l,p]) => (
                <div key={f} style={{ marginBottom:16 }}>
                  <label style={S.label}>{l}</label>
                  <input style={S.input} placeholder={p} value={form[f]} onChange={e=>setForm({...form,[f]:e.target.value})} />
                </div>
              ))}
              <div style={{ marginBottom:20 }}>
                <label style={S.label}>Categoria</label>
                <select style={S.input} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  {['Roupas','Calçados','Acessórios','Serviços','Digital','Geral'].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button style={S.btn('ghost')} onClick={()=>setModal(false)}>Cancelar</button>
                <button style={S.btn('primary')} onClick={save} disabled={loading}>{loading?'Salvando...':'Salvar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Billing Page ──────────────────────────────────────────────────────────────
function BillingPage({ showToast }) {
  const { user } = useAuth();
  const plans = [
    { id:'starter', name:'Starter', price:'R$47', features:['2 contas Instagram','60 posts/mês','Suporte por email'] },
    { id:'pro', name:'Pro', price:'R$97', featured:true, features:['5 contas Instagram','Posts ilimitados','IA para legendas','Analytics avançado'] },
    { id:'agency', name:'Agency', price:'R$197', features:['20 contas Instagram','Posts ilimitados','Tudo do Pro','API access'] },
  ];

  const subscribe = async (plan) => {
    try {
      const r = await api.post('/billing/create-checkout', { plan });
      if (r.data.url) window.location.href = r.data.url;
    } catch(e) { showToast(e.response?.data?.error || 'Erro ao processar pagamento', 'error'); }
  };

  return (
    <div>
      <div style={{ textAlign:'center', marginBottom:40 }}>
        <div style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>Escolha seu Plano</div>
        <div style={{ fontSize:14, color:'#6b7280' }}>Sem fidelidade. Cancele quando quiser.</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, maxWidth:800, margin:'0 auto' }}>
        {plans.map(p => (
          <div key={p.id} style={{ background:'#0f1018', border:`1px solid ${p.featured?'#f97316':'#252838'}`, borderRadius:16, padding:28, textAlign:'center', position:'relative', overflow:'hidden' }}>
            {p.featured && <div style={{ position:'absolute', top:12, right:-28, background:'#f97316', color:'white', fontSize:9, fontWeight:800, padding:'4px 36px', transform:'rotate(45deg)', letterSpacing:1 }}>POPULAR</div>}
            <div style={{ fontSize:12, fontWeight:700, color:'#6b7280', letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>{p.name}</div>
            <div style={{ fontSize:38, fontWeight:800, letterSpacing:-2, color: p.featured?'#f97316':'#f1f2f7', marginBottom:4 }}>{p.price}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginBottom:20 }}>/mês</div>
            <ul style={{ listStyle:'none', textAlign:'left', marginBottom:24, padding:0 }}>
              {p.features.map(f => <li key={f} style={{ fontSize:13, color:'#9ca3af', padding:'5px 0', borderBottom:'1px solid #252838', display:'flex', alignItems:'center', gap:8 }}><span style={{color:'#10b981',fontWeight:700}}>✓</span>{f}</li>)}
            </ul>
            <button style={{ ...S.btn(p.featured?'primary':'ghost'), width:'100%', justifyContent:'center', padding:12 }} onClick={()=>subscribe(p.id)}>
              {user?.plan===p.id ? '✓ Plano Atual' : `Assinar ${p.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
function AppContent() {
  const { user, loading, logout } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [authPage, setAuthPage] = useState('login');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type='success') => { setToast({msg,type}); };

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#08090d', color:'#f1f2f7' }}>Carregando...</div>;

  if (!user) {
    return authPage === 'login'
      ? <LoginPage onSwitch={()=>setAuthPage('register')} />
      : <RegisterPage onSwitch={()=>setAuthPage('login')} />;
  }

  const pages = { dashboard:'Dashboard', posts:'Posts', accounts:'Contas', products:'Catálogo', billing:'Planos' };
  const nav = [
    {id:'dashboard',icon:'📊',label:'Dashboard'},
    {id:'posts',icon:'📅',label:'Posts'},
    {id:'accounts',icon:'📱',label:'Contas IG'},
    {id:'products',icon:'🛍️',label:'Catálogo'},
    {id:'billing',icon:'💳',label:'Planos'},
  ];

  return (
    <div style={S.app}>
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoText}>Insta<span style={S.logoSpan}>Flow</span></div>
          <div style={{ fontSize:10, color:'#6b7280', letterSpacing:'2px', textTransform:'uppercase', marginTop:2 }}>SaaS Dashboard</div>
        </div>
        <nav style={S.nav}>
          {nav.map(n => (
            <div key={n.id} style={S.navItem(page===n.id)} onClick={()=>setPage(n.id)}>
              <span style={{ width:16, textAlign:'center', fontSize:15 }}>{n.icon}</span>
              <span>{n.label}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding:12, borderTop:'1px solid #252838' }}>
          <div style={{ background:'linear-gradient(135deg,rgba(249,115,22,0.1),rgba(249,115,22,0.05))', border:'1px solid rgba(249,115,22,0.2)', borderRadius:10, padding:12, marginBottom:10 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#f97316' }}>✦ Plano {user.plan}</div>
            <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>{user.name}</div>
          </div>
          <button style={{ ...S.btn('ghost'), width:'100%', justifyContent:'center', fontSize:12 }} onClick={logout}>Sair</button>
        </div>
      </aside>

      <main style={S.main}>
        <div style={S.topbar}>
          <div>
            <div style={{ fontSize:17, fontWeight:700 }}>{pages[page]}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:1 }}>InstaFlow SaaS</div>
          </div>
          <button style={S.btn('primary')} onClick={()=>setPage('posts')}>✚ Novo Post</button>
        </div>

        <div style={S.content}>
          {page==='dashboard' && <Dashboard showToast={showToast} />}
          {page==='posts'     && <PostsPage showToast={showToast} />}
          {page==='accounts'  && <AccountsPage showToast={showToast} />}
          {page==='products'  && <ProductsPage showToast={showToast} />}
          {page==='billing'   && <BillingPage showToast={showToast} />}
        </div>
      </main>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
