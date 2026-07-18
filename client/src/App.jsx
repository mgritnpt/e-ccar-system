import React, { useState, useEffect } from 'react';

const API_BASE = window.location.port === '5173' || window.location.port === '5174'
  ? 'http://localhost:8000/api'
  : '/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, ccar-new, ncr-new, ccar-detail, ncr-detail
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // login, register
  
  // Forms state
  const [authForm, setAuthForm] = useState({
    username: '', password: '', name: '', email: '', position: '', department: '', bu: 'AOEM', role: 'SALES'
  });
  const [ccarList, setCcarList] = useState([]);
  const [ncrList, setNcrList] = useState([]);
  const [activeTab, setActiveTab] = useState('ccar'); // ccar, ncr
  
  // API header helper
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // Fetch current user details
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetch(`${API_BASE}/auth/me`, { headers: getHeaders() })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Unauthorized');
        })
        .then(data => setUser(data))
        .catch(() => {
          logout();
        });
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  // Fetch record lists
  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user, currentView]);

  const fetchRecords = () => {
    fetch(`${API_BASE}/ccar`, { headers: getHeaders() })
      .then(res => res.json())
      .then(data => setCcarList(data || []))
      .catch(err => console.error(err));

    fetch(`${API_BASE}/ncr`, { headers: getHeaders() })
      .then(res => res.json())
      .then(data => setNcrList(data || []))
      .catch(err => console.error(err));
  };

  const logout = () => {
    setToken('');
    setUser(null);
    setCurrentView('dashboard');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: authForm.username, password: authForm.password })
    })
      .then(res => {
        if (res.ok) return res.json();
        return res.json().then(d => { throw new Error(d.message || 'Login failed'); });
      })
      .then(data => {
        setToken(data.token);
      })
      .catch(err => alert(err.message));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authForm)
    })
      .then(res => {
        if (res.ok) return res.json();
        return res.json().then(d => { throw new Error(d.message || 'Register failed'); });
      })
      .then(data => {
        setToken(data.token);
      })
      .catch(err => alert(err.message));
  };

  const viewRecordDetails = (type, id) => {
    setSelectedRecordId(id);
    setCurrentView(type === 'CCAR' ? 'ccar-detail' : 'ncr-detail');
  };

  // RENDER SECTIONS
  if (!user) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '40px', position: 'relative' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', textAlign: 'center', background: 'var(--ccar-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            E-CCAR & E-NCR System
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '14px' }}>
            {authMode === 'login' ? 'เข้าสู่ระบบเพื่อใช้งานระบบใบร้องเรียนและรายงานปัญหา' : 'สร้างบัญชีผู้ใช้งานใหม่'}
          </p>

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
            {authMode === 'register' && (
              <>
                <div className="form-group">
                  <label>ชื่อ-นามสกุล (Full Name) *</label>
                  <input type="text" required value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} placeholder="เช่น K. Wisa Saetang" />
                </div>
                <div className="form-group">
                  <label>อีเมล (Email) *</label>
                  <input type="email" required value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="example@paintco.com" />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>ตำแหน่ง (Position)</label>
                    <input type="text" value={authForm.position} onChange={e => setAuthForm({ ...authForm, position: e.target.value })} placeholder="เช่น Group Leader" />
                  </div>
                  <div className="form-group">
                    <label>แผนก (Department)</label>
                    <input type="text" value={authForm.department} onChange={e => setAuthForm({ ...authForm, department: e.target.value })} placeholder="เช่น Sales" />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>หน่วยธุรกิจ (BU)</label>
                    <select value={authForm.bu} onChange={e => setAuthForm({ ...authForm, bu: e.target.value })}>
                      <option value="AOEM">AOEM</option>
                      <option value="AMAP">AMAP</option>
                      <option value="AMPC">AMPC</option>
                      <option value="MO">MO</option>
                      <option value="GEN">GEN</option>
                      <option value="PTC">PTC</option>
                      <option value="CED">CED</option>
                      <option value="PDP">PDP</option>
                      <option value="OSSC">OSSC</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>บทบาท (System Role) *</label>
                    <select value={authForm.role} onChange={e => setAuthForm({ ...authForm, role: e.target.value })}>
                      <option value="SALES">Sales / TS / Purchase (ผู้แจ้งเรื่อง)</option>
                      <option value="QEM">QEM Staff (ผู้ประเมินและคัดกรอง)</option>
                      <option value="QMR">QMR (ผู้อนุมัติรับเรื่อง / อนุมัติแผน)</option>
                      <option value="QC">QC Department (ผู้ตรวจสอบ/ผู้วิเคราะห์)</option>
                      <option value="PRODUCTION">Production (ฝ่ายผลิต/ผู้รับมอบหมาย)</option>
                      <option value="INVENTORY">Inventory (ผู้โอนย้าย stock)</option>
                      <option value="DEPT_HEAD">Department Head (หัวหน้าแผนกอนุมัติ)</option>
                      <option value="DIV_MANAGER">Division Manager (ผู้จัดการฝ่าย)</option>
                      <option value="TN">Technic / Service (ฝ่ายเทคนิคพิจารณา)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label>ชื่อผู้ใช้งาน (Username) *</label>
              <input type="text" required value={authForm.username} onChange={e => setAuthForm({ ...authForm, username: e.target.value })} placeholder="username" />
            </div>

            <div className="form-group">
              <label>รหัสผ่าน (Password) *</label>
              <input type="password" required value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="••••••••" />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              {authMode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกและเข้าสู่ระบบ'}
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            {authMode === 'login' ? 'ยังไม่มีบัญชีใช่หรือไม่?' : 'มีบัญชีอยู่แล้ว?'} {' '}
            <span style={{ color: 'var(--ccar-primary)', cursor: 'pointer', fontWeight: '600' }} onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
              {authMode === 'login' ? 'สมัครสมาชิกที่นี่' : 'เข้าสู่ระบบที่นี่'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }} onClick={() => setCurrentView('dashboard')}>
          <div style={{ padding: '8px', background: 'var(--ccar-gradient)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <span style={{ fontSize: '20px', fontWeight: '700', cursor: 'pointer' }}>E-CCAR / E-NCR Portal</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '600', fontSize: '15px' }}>{user.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.role} | {user.department || user.bu}</div>
          </div>
          <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={logout}>ออกจากระบบ</button>
        </div>
      </div>

      {/* Main Content Area */}
      {currentView === 'dashboard' && (
        <DashboardView
          ccarList={ccarList}
          ncrList={ncrList}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setCurrentView={setCurrentView}
          viewRecordDetails={viewRecordDetails}
        />
      )}

      {currentView === 'ccar-new' && (
        <CcarNewFormView setCurrentView={setCurrentView} getHeaders={getHeaders} fetchRecords={fetchRecords} />
      )}

      {currentView === 'ncr-new' && (
        <NcrNewFormView setCurrentView={setCurrentView} getHeaders={getHeaders} fetchRecords={fetchRecords} />
      )}

      {currentView === 'ccar-detail' && (
        <CcarDetailView recordId={selectedRecordId} setCurrentView={setCurrentView} getHeaders={getHeaders} token={token} user={user} />
      )}

      {currentView === 'ncr-detail' && (
        <NcrDetailView recordId={selectedRecordId} setCurrentView={setCurrentView} getHeaders={getHeaders} token={token} user={user} />
      )}
    </div>
  );
}

// DASHBOARD COMPONENT
function DashboardView({ ccarList, ncrList, activeTab, setActiveTab, setCurrentView, viewRecordDetails }) {
  // Statistics calculate
  const totalCcar = ccarList.length;
  const pendingCcar = ccarList.filter(c => c.status === 'Pending' || c.status === 'In Progress').length;
  const closedCcar = ccarList.filter(c => c.status === 'Closed').length;

  const totalNcr = ncrList.length;
  const pendingNcr = ncrList.filter(n => n.status === 'Pending' || n.status === 'In Progress').length;
  const closedNcr = ncrList.filter(n => n.status === 'Closed').length;

  return (
    <div>
      {/* Stats row */}
      <div className="grid-3" style={{ marginBottom: '30px' }}>
        <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1, color: 'var(--ccar-primary)' }}>
            <svg width="120" height="120" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
          </div>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>Customer Complaints (E-CCAR)</span>
          <div style={{ fontSize: '32px', fontWeight: '700', margin: '8px 0', background: 'var(--ccar-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {totalCcar} เคส
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            กำลังดำเนินการ: <span style={{ color: 'var(--warning)', fontWeight: '600' }}>{pendingCcar}</span> | ปิดแล้ว: <span style={{ color: 'var(--success)', fontWeight: '600' }}>{closedCcar}</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1, color: 'var(--ncr-primary)' }}>
            <svg width="120" height="120" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          </div>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>Internal Non-Conformance (E-NCR)</span>
          <div style={{ fontSize: '32px', fontWeight: '700', margin: '8px 0', background: 'var(--ncr-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {totalNcr} รายงาน
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            กำลังดำเนินการ: <span style={{ color: 'var(--warning)', fontWeight: '600' }}>{pendingNcr}</span> | ปิดแล้ว: <span style={{ color: 'var(--success)', fontWeight: '600' }}>{closedNcr}</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => setCurrentView('ccar-new')}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            สร้างใบคำร้อง CCAR ใหม่
          </button>
          <button className="btn btn-ncr" onClick={() => setCurrentView('ncr-new')}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            สร้างใบรายงาน NCR ใหม่
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div className={`tab ${activeTab === 'ccar' ? 'active' : ''}`} onClick={() => setActiveTab('ccar')}>
          ใบคำร้อง CCAR
        </div>
        <div className={`tab ${activeTab === 'ncr' ? 'active-ncr' : ''}`} onClick={() => setActiveTab('ncr')}>
          รายงานของเสีย NCR
        </div>
      </div>

      {/* Tables container */}
      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        {activeTab === 'ccar' ? (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>รายการ CCAR ทั้งหมด</h3>
            {ccarList.length === 0 ? (
              <p style={{ padding: '40px', textLight: 'center', color: 'var(--text-secondary)' }}>ไม่พบข้อมูลใบคำร้อง CCAR</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>เลขที่เอกสาร</th>
                    <th>หน่วยธุรกิจ (BU)</th>
                    <th>ชื่อลูกค้า</th>
                    <th>ชื่อผลิตภัณฑ์</th>
                    <th>ผู้ร้องขอ</th>
                    <th>ขั้นตอนปัจจุบัน</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {ccarList.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '600' }}>{item.ccar_no}</td>
                      <td>{item.bu}</td>
                      <td>{item.customer_name}</td>
                      <td>{item.product_name}</td>
                      <td>{item.requester_name}</td>
                      <td>
                        <span style={{ fontSize: '13px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                          Step {item.current_step}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${item.status.toLowerCase().replace(' ', '')}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => viewRecordDetails('CCAR', item.id)}>
                          รายละเอียด / อนุมัติ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>รายการ NCR ทั้งหมด</h3>
            {ncrList.length === 0 ? (
              <p style={{ padding: '40px', textLight: 'center', color: 'var(--text-secondary)' }}>ไม่พบข้อมูลรายงาน NCR</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>เลขที่เอกสาร</th>
                    <th>โรงงาน (Plant)</th>
                    <th>หน่วยธุรกิจ (BU)</th>
                    <th>ชื่อผลิตภัณฑ์</th>
                    <th>แผนกที่รายงาน</th>
                    <th>ขั้นตอนปัจจุบัน</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {ncrList.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '600' }}>{item.ncr_no}</td>
                      <td>{item.plant}</td>
                      <td>{item.bu}</td>
                      <td>{item.product_name}</td>
                      <td>{item.issued_by_dept}</td>
                      <td>
                        <span style={{ fontSize: '13px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                          Step {item.current_step}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${item.status.toLowerCase().replace(' ', '')}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => viewRecordDetails('NCR', item.id)}>
                          รายละเอียด / อนุมัติ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// CCAR CREATE COMPONENT
function CcarNewFormView({ setCurrentView, getHeaders, fetchRecords }) {
  const [form, setForm] = useState({
    bu: 'AOEM', requested_by: 'Sales', subject: 'Product Quality', subject_other: '',
    product_termination: 'No', product_termination_ref: '', ccr_no: '', customer_written_doc: '',
    customer_code: '', customer_name: '', product_code: '', product_name: '',
    batch_no: '', lot_no: '', do_no: '', item: '', quantity: '', quantity_unit: 'kg',
    found_problem: [], containment_action: 'Adjust in Customer Line', containment_action_detail: '',
    compensation: '', problem_detail: ''
  });

  const subjects = ['Product Quality', 'Shade', 'Packaging', 'Delivery', 'Other'];
  const problemCheckboxes = {
    'Product Quality': ['Seeding', 'Gel', 'Crater', 'Sedimentation', 'Skinning', 'Hardness', 'Gloss', 'Sagging', 'Viscosity', 'Color Difference', 'Soft Blocking/Blocking', 'Contamination', 'Container Problem'],
    'Delivery': ['Shortage Weight', 'Delivery Mistake', 'Delay Delivery', 'No. COA', 'Other']
  };

  const handleCheckboxChange = (val) => {
    const list = [...form.found_problem];
    const idx = list.indexOf(val);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(val);
    }
    setForm({ ...form, found_problem: list });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      found_problem: JSON.stringify(form.found_problem)
    };

    fetch(`${API_BASE}/ccar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to create CCAR');
      })
      .then(() => {
        alert('สร้างเอกสาร CCAR สำเร็จ!');
        fetchRecords();
        setCurrentView('dashboard');
      })
      .catch(err => alert(err.message));
  };

  return (
    <div className="glass-panel" style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700' }}>ออกใบคำร้องขอมาตรการแก้ไขปัญหาของลูกค้า (New CCAR)</h2>
        <button className="btn btn-secondary" onClick={() => setCurrentView('dashboard')}>ย้อนกลับ</button>
      </div>

      <form onSubmit={handleSubmit}>
        <h3 style={{ fontSize: '16px', color: 'var(--ccar-primary)', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>1. ข้อมูลผู้ร้องขอและระบบ (Requester & BU)</h3>
        
        <div className="grid-3">
          <div className="form-group">
            <label>Requested by (ประเภทผู้ขอ) *</label>
            <select value={form.requested_by} onChange={e => setForm({ ...form, requested_by: e.target.value })}>
              <option value="Sales">Sales</option>
              <option value="TS">Technical Service (TS)</option>
              <option value="Purchase">Purchase</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Business Unit (BU) *</label>
            <select value={form.bu} onChange={e => setForm({ ...form, bu: e.target.value })}>
              <option value="AOEM">AOEM</option>
              <option value="AMAP">AMAP</option>
              <option value="AMPC">AMPC</option>
              <option value="MO">MO</option>
              <option value="GEN">GEN</option>
              <option value="PTC">PTC</option>
              <option value="CED">CED</option>
              <option value="PDP">PDP</option>
              <option value="OSSC">OSSC</option>
            </select>
          </div>

          <div className="form-group">
            <label>Subject (ประเภทเรื่องร้องเรียน) *</label>
            <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
              {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>
        </div>

        {form.subject === 'Other' && (
          <div className="form-group">
            <label>ระบุเรื่องอื่นๆ *</label>
            <input type="text" required value={form.subject_other} onChange={e => setForm({ ...form, subject_other: e.target.value })} placeholder="เช่น ปัญหาเรื่องการตอบรับบริการ" />
          </div>
        )}

        <div className="grid-2">
          <div className="form-group">
            <label>Product termination (สิ้นสุดรุ่นผลิตหรือไม่)</label>
            <select value={form.product_termination} onChange={e => setForm({ ...form, product_termination: e.target.value })}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          {form.product_termination === 'Yes' && (
            <div className="form-group">
              <label>Ref. No. สำหรับการยกเลิก</label>
              <input type="text" value={form.product_termination_ref} onChange={e => setForm({ ...form, product_termination_ref: e.target.value })} placeholder="เลขอ้างอิง" />
            </div>
          )}
        </div>

        <h3 style={{ fontSize: '16px', color: 'var(--ccar-primary)', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginTop: '15px' }}>2. ข้อมูลสินค้าและเอกสารอ้างอิง</h3>

        <div className="grid-2">
          <div className="form-group">
            <label>เลขที่ CCR (CCR No.) *</label>
            <input type="text" required value={form.ccr_no} onChange={e => setForm({ ...form, ccr_no: e.target.value })} placeholder="จำเป็นต้องอ้างอิงจาก Quality Case" />
          </div>
          <div className="form-group">
            <label>เอกสารลายลักษณ์อักษรของลูกค้า (Customer Written Document)</label>
            <input type="text" value={form.customer_written_doc} onChange={e => setForm({ ...form, customer_written_doc: e.target.value })} placeholder="เอกสารอ้างอิงจากลูกค้า" />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>รหัสลูกค้า (Customer Code)</label>
            <input type="text" value={form.customer_code} onChange={e => setForm({ ...form, customer_code: e.target.value })} placeholder="เช่น C001" />
          </div>
          <div className="form-group">
            <label>ชื่อลูกค้า (Customer Name) *</label>
            <input type="text" required value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} placeholder="ชื่อบริษัทลูกค้า" />
          </div>
        </div>

        <div className="grid-3">
          <div className="form-group">
            <label>รหัสสินค้า (Product Code)</label>
            <input type="text" value={form.product_code} onChange={e => setForm({ ...form, product_code: e.target.value })} placeholder="เช่น P-999" />
          </div>
          <div className="form-group">
            <label>ชื่อสินค้า (Product Name) *</label>
            <input type="text" required value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} placeholder="ชื่อรุ่นผลิตภัณฑ์" />
          </div>
          <div className="form-group">
            <label>หมายเลข Batch / Lot *</label>
            <input type="text" required value={form.lot_no} onChange={e => setForm({ ...form, lot_no: e.target.value })} placeholder="ระบุ Batch No / Lot No" />
          </div>
        </div>

        <div className="grid-4">
          <div className="form-group">
            <label>เลขที่ใบส่งของ (DO. No.) *</label>
            <input type="text" required value={form.do_no} onChange={e => setForm({ ...form, do_no: e.target.value })} placeholder="DO Number" />
          </div>
          <div className="form-group">
            <label>รายการสินค้า (Item)</label>
            <input type="text" value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} placeholder="เช่น สีเคลือบเงา" />
          </div>
          <div className="form-group">
            <label>จำนวนที่พบปัญหา *</label>
            <input type="number" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="ปริมาณ" />
          </div>
          <div className="form-group">
            <label>หน่วยนับ</label>
            <input type="text" value={form.quantity_unit} onChange={e => setForm({ ...form, quantity_unit: e.target.value })} placeholder="เช่น L, kg, can" />
          </div>
        </div>

        <h3 style={{ fontSize: '16px', color: 'var(--ccar-primary)', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginTop: '15px' }}>3. รายละเอียดและอาการปัญหา</h3>

        <div className="form-group">
          <label style={{ marginBottom: '12px' }}>ลักษณะความผิดปกติที่พบ (Found Problem) *</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {/* Display relevant checkboxes based on subject */}
            {(form.subject === 'Delivery' ? problemCheckboxes['Delivery'] : problemCheckboxes['Product Quality']).map(problem => (
              <label key={problem} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '180px', margin: 0, fontWeight: 'normal', color: '#fff' }}>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', accentColor: 'var(--ccar-primary)' }}
                  checked={form.found_problem.includes(problem)}
                  onChange={() => handleCheckboxChange(problem)}
                />
                {problem}
              </label>
            ))}
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>มาตรการแก้ไขเบื้องต้น (Containment Action) *</label>
            <select value={form.containment_action} onChange={e => setForm({ ...form, containment_action: e.target.value })}>
              <option value="Adjust in Customer Line">Adjust in Customer Line (แก้ไขในไลน์พ่นลูกค้า)</option>
              <option value="Return back with GRF No.">Return back with GRF (รับสินค้าคืน)</option>
              <option value="Other">Other (อื่นๆ)</option>
            </select>
          </div>
          <div className="form-group">
            <label>การชดเชยแก่ลูกค้า (Compensation)</label>
            <input type="text" value={form.compensation} onChange={e => setForm({ ...form, compensation: e.target.value })} placeholder="เช่น แลกเปลี่ยนสินค้า, ให้ส่วนลด" />
          </div>
        </div>

        <div className="form-group">
          <label>รายละเอียดมาตรการแก้ไขเบื้องต้น / รายละเอียดอื่นๆ</label>
          <input type="text" value={form.containment_action_detail} onChange={e => setForm({ ...form, containment_action_detail: e.target.value })} placeholder="ระบุเลขอ้างอิงใบ GRF หรือวิธีปรับแต่งสูตรสีในไลน์" />
        </div>

        <div className="form-group">
          <label>รายละเอียดปัญหาแบบละเอียด (Problem Detail) *</label>
          <textarea rows="4" required value={form.problem_detail} onChange={e => setForm({ ...form, problem_detail: e.target.value })} placeholder="บรรยายรายละเอียดปัญหาและเงื่อนไขการทดสอบที่ไลน์ของลูกค้า..."></textarea>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setCurrentView('dashboard')}>ยกเลิก</button>
          <button type="submit" className="btn btn-primary">ส่งใบแจ้งคำร้อง CCAR (Submit)</button>
        </div>
      </form>
    </div>
  );
}

// NCR CREATE COMPONENT
function NcrNewFormView({ setCurrentView, getHeaders, fetchRecords }) {
  const [form, setForm] = useState({
    plant: 'EN', bu: 'AM', issued_by_dept: 'QC', product_code: '', product_name: '',
    batch_no: '', lot_no: '', defect_qty: '', defect_unit: 'kg', defect_detail: '', transfer_qi: 'No'
  });

  const plants = ['EN', 'TH', 'DR', 'AR', 'WT', 'WB/RM', 'ED', 'PP/RM', 'PT/RM'];
  const depts = ['QC', 'PD', 'INV', 'MRP', 'Sale', 'TS'];

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE}/ncr`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(form)
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to create NCR');
      })
      .then(() => {
        alert('สร้างรายงาน NCR สำเร็จ!');
        fetchRecords();
        setCurrentView('dashboard');
      })
      .catch(err => alert(err.message));
  };

  return (
    <div className="glass-panel" style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700' }}>ออกใบแจ้งรายงานของเสียภายใน (New NCR)</h2>
        <button className="btn btn-secondary" onClick={() => setCurrentView('dashboard')}>ย้อนกลับ</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid-3">
          <div className="form-group">
            <label>โรงงาน (Plant) *</label>
            <select value={form.plant} onChange={e => setForm({ ...form, plant: e.target.value })}>
              {plants.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Business Unit (BU) *</label>
            <select value={form.bu} onChange={e => setForm({ ...form, bu: e.target.value })}>
              <option value="AM">AM</option>
              <option value="MO">MO</option>
              <option value="GN">GN</option>
            </select>
          </div>

          <div className="form-group">
            <label>แผนกที่ออกเอกสาร (Issued by Dept) *</label>
            <select value={form.issued_by_dept} onChange={e => setForm({ ...form, issued_by_dept: e.target.value })}>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="grid-3">
          <div className="form-group">
            <label>รหัสผลิตภัณฑ์ (Product Code)</label>
            <input type="text" value={form.product_code} onChange={e => setForm({ ...form, product_code: e.target.value })} placeholder="รหัสสินค้า" />
          </div>
          <div className="form-group">
            <label>ชื่อผลิตภัณฑ์ (Product Name) *</label>
            <input type="text" required value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} placeholder="ชื่อสินค้า" />
          </div>
          <div className="form-group">
            <label>Batch / Lot No</label>
            <input type="text" value={form.lot_no} onChange={e => setForm({ ...form, lot_no: e.target.value })} placeholder="หมายเลข Lot" />
          </div>
        </div>

        <div className="grid-3">
          <div className="form-group">
            <label>จำนวนของเสีย *</label>
            <input type="number" required value={form.defect_qty} onChange={e => setForm({ ...form, defect_qty: e.target.value })} placeholder="จำนวน" />
          </div>
          <div className="form-group">
            <label>หน่วยนับ</label>
            <input type="text" value={form.defect_unit} onChange={e => setForm({ ...form, defect_unit: e.target.value })} placeholder="เช่น แกลลอน, ถัง" />
          </div>
          <div className="form-group">
            <label>โอนย้ายสถานะสินค้าในระบบ SAP (QI Transfer)</label>
            <select value={form.transfer_qi} onChange={e => setForm({ ...form, transfer_qi: e.target.value })}>
              <option value="No">No (ไม่โอนย้าย)</option>
              <option value="Yes">Yes (ต้องการตรวจสอบและโอนย้าย)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>รายละเอียดปัญหา / ลักษณะชิ้นงานเสีย (Defect Detail) *</label>
          <textarea rows="4" required value={form.defect_detail} onChange={e => setForm({ ...form, defect_detail: e.target.value })} placeholder="บรรยายสาเหตุการกักหรือปัญหาคุณภาพที่พบ..."></textarea>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setCurrentView('dashboard')}>ยกเลิก</button>
          <button type="submit" className="btn btn-ncr">ออกเอกสาร NCR (Submit)</button>
        </div>
      </form>
    </div>
  );
}

// CCAR WORKFLOW & DETAIL VIEW
function CcarDetailView({ recordId, setCurrentView, getHeaders, token, user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Action form state
  const [actionResult, setActionResult] = useState('Approve');
  const [actionReason, setActionReason] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  
  // Custom action inputs based on step
  const [stepData, setStepData] = useState({});

  useEffect(() => {
    fetchData();
  }, [recordId]);

  const fetchData = () => {
    setLoading(true);
    fetch(`${API_BASE}/ccar/${recordId}`, { headers: getHeaders() })
      .then(res => res.json())
      .then(d => {
        setData(d);
        // Pre-configure action result defaults depending on step
        if (d.current_step === '1.1') setActionResult('Correct');
        else if (d.current_step === '1.2') setActionResult('Approve');
        else if (d.current_step === '1.3') setActionResult('No problem');
        else if (d.current_step === '2') setActionResult('Correct');
        else if (d.current_step === '2.1') setActionResult('Approve');
        else if (d.current_step === '2.2') {
          setActionResult('Call meeting');
          setStepData({ departments: [] });
        }
        else if (d.current_step === '2.3') {
          setActionResult('Submit');
          setStepData({ assignDept: 'QC' });
        }
        else if (d.current_step === '3.1') {
          setActionResult('Submit');
          setStepData({
            rootCauseMethod: '5 Why',
            rootCauseDetail: '',
            causeOfProblem: '',
            reasonCode: 'Valid',
            correctiveAction: '',
            correctiveDueDate: '',
            holdStock: 'No',
            holdStockQty: '',
            preventiveAction: '',
            preventiveDueDate: '',
            needExpandedPrevention: 'No',
            needExpandedDetail: '',
            needExpandedDueDate: '',
            needReviewFmea: 'No'
          });
        }
        else if (d.current_step === '3.2') setActionResult('Approve');
        else if (d.current_step === '3.3') {
          setActionResult('Submit');
          setStepData({ dueFollowUpDate: '' });
        }
        else if (d.current_step === '3.4') setActionResult('Approve');
        else if (d.current_step === '4') setActionResult('Satisfaction');
        else if (d.current_step === '5') setActionResult('Approve');
        else if (d.current_step === '7.1') setActionResult('Approve');
        else if (d.current_step === '7.2') {
          setActionResult('Submit');
          setStepData({ followUpResult: 'Finish and not found problem', followUpDetail: '' });
        }
        else if (d.current_step === '7.3') setActionResult('Approve');
        
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleStepSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('step', data.current_step);
    formData.append('result', actionResult);
    formData.append('reason', actionReason);
    formData.append('data_json', JSON.stringify(stepData));
    if (attachedFile) {
      formData.append('file', attachedFile);
    }

    fetch(`${API_BASE}/ccar/${recordId}/step`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}` // Multer handles content-type boundary
      },
      body: formData
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to update step');
      })
      .then(() => {
        alert('อัปเดตขั้นตอนเวิร์กโฟลว์เรียบร้อยแล้ว!');
        setAttachedFile(null);
        setActionReason('');
        fetchData();
      })
      .catch(err => alert(err.message));
  };

  const ccarStepsSequence = ['1.1', '1.2', '1.3', '2', '2.1', '2.2', '2.3', '3.1', '3.2', '3.3', '3.4', '4', '5', '7.1', '7.2', '7.3', 'Closed'];

  // Check if current logged-in user is authorized to perform current step
  const checkAuth = () => {
    if (!data) return false;
    const r = user.role;
    const s = data.current_step;
    
    if (s === '1.1') return r === 'SALES' || r === 'TS' || r === 'DEPT_HEAD'; // GL/Mgr
    if (s === '1.2') return r === 'DEPT_HEAD';
    if (s === '1.3') return r === 'QC' || r === 'PRODUCTION';
    if (s === '2' || s === '2.2' || s === '3.3' || s === '7.2') return r === 'QEM';
    if (s === '2.1' || s === '2.3' || s === '3.4' || s === '7.1' || s === '7.3') return r === 'QMR';
    if (s === '3.1') {
      // Find assigned department from step 2.3
      const step23 = data.steps.find(x => x.step === '2.3');
      if (step23) {
        try {
          const sObj = JSON.parse(step23.data_json);
          const assigned = sObj.assignDept || '';
          return r === assigned || r === 'QC' || r === 'PRODUCTION'; // Assigned dept or QC/PD
        } catch (e) {}
      }
      return r === 'QC' || r === 'PRODUCTION';
    }
    if (s === '3.2') return r === 'DEPT_HEAD';
    if (s === '4') return r === 'SALES' || r === 'TS';
    if (s === '5') return r === 'DEPT_HEAD' || r === 'DIV_MANAGER';
    return false;
  };

  if (loading) return <p style={{ padding: '50px', textAlign: 'center', color: '#fff' }}>กำลังโหลดข้อมูลใบคำร้อง...</p>;
  if (!data) return <p style={{ padding: '50px', textAlign: 'center', color: '#fff' }}>ไม่พบเคสที่ต้องการ</p>;

  const currentStepLabel = {
    '1.1': 'ตรวจสอบความถูกต้อง (Sales/TS GL)',
    '1.2': 'อนุมัติการออกเอกสาร (Dept Head)',
    '1.3': 'ยืนยัน Retain Sample (QC/PD)',
    '2': 'ตรวจสอบและแยกหมวดหมู่ (QEM Staff)',
    '2.1': 'อนุมัติการรับคำร้อง (QMR)',
    '2.2': 'เลือกผู้เข้าร่วมประชุม (QEM Staff)',
    '2.3': 'มอบหมายแผนกแก้ไขปัญหา (QMR)',
    '3.1': 'กรอกสาเหตุและแผนปฏิบัติการ (Assigned Dept)',
    '3.2': 'อนุมัติแผนแก้ไข (Dept Head)',
    '3.3': 'ตรวจสอบและกำหนดวันติดตาม (QEM)',
    '3.4': 'อนุมัติแผนแก้ไขป้องกันสูงสุด (QMR)',
    '4': 'ขอความคิดเห็นลูกค้า (Sales/TS)',
    '5': 'ตรวจสอบผลตอบรับลูกค้า (Dept Head)',
    '7.1': 'อนุมัติปิด CCAR (QMR)',
    '7.2': 'ติดตามผลขยายผลข้ามหน่วย (QEM)',
    '7.3': 'อนุมัติปิดเคสขยายผล (QMR)',
    'Closed': 'ปิดโครงการเสร็จสมบูรณ์'
  }[data.current_step];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', alignItems: 'start' }}>
      
      {/* LEFT COLUMN: DETAILS & TIMELINE */}
      <div>
        {/* Case Card */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span className={`badge badge-${data.status.toLowerCase().replace(' ', '')}`} style={{ marginBottom: '6px' }}>{data.status}</span>
              <h2 style={{ fontSize: '24px', fontWeight: '700' }}>{data.ccar_no}</h2>
            </div>
            <button className="btn btn-secondary" onClick={() => setCurrentView('dashboard')}>ย้อนกลับ</button>
          </div>

          <div className="grid-3" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '15px' }}>
            <div>
              <label>ผู้ร้องขอ (Requester)</label>
              <div style={{ fontWeight: '500' }}>{data.requester_name} ({data.requested_by})</div>
            </div>
            <div>
              <label>Business Unit</label>
              <div style={{ fontWeight: '500' }}>{data.bu}</div>
            </div>
            <div>
              <label>ประเภทข้อร้องเรียน</label>
              <div style={{ fontWeight: '500' }}>{data.subject === 'Other' ? data.subject_other : data.subject}</div>
            </div>
          </div>

          <div className="grid-3" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '15px' }}>
            <div>
              <label>ชื่อลูกค้า</label>
              <div style={{ fontWeight: '500' }}>{data.customer_name} ({data.customer_code || 'N/A'})</div>
            </div>
            <div>
              <label>ชื่อผลิตภัณฑ์</label>
              <div style={{ fontWeight: '500' }}>{data.product_name} ({data.product_code || 'N/A'})</div>
            </div>
            <div>
              <label>Batch / Lot No.</label>
              <div style={{ fontWeight: '500' }}>{data.lot_no}</div>
            </div>
          </div>

          <div className="grid-4" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '15px' }}>
            <div>
              <label>DO. No.</label>
              <div style={{ fontWeight: '500' }}>{data.do_no}</div>
            </div>
            <div>
              <label>รายการสินค้า</label>
              <div style={{ fontWeight: '500' }}>{data.item || 'N/A'}</div>
            </div>
            <div>
              <label>ปริมาณปัญหา</label>
              <div style={{ fontWeight: '500' }}>{data.quantity} {data.quantity_unit}</div>
            </div>
            <div>
              <label>สิ้นสุดการผลิต (Termination)</label>
              <div style={{ fontWeight: '500' }}>{data.product_termination} {data.product_termination === 'Yes' && `(Ref: ${data.product_termination_ref})`}</div>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>มาตรการแก้ไขเบื้องต้น (Containment Action)</label>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }}>
              <strong>{data.containment_action}</strong> {data.containment_action_detail && `| รายละเอียด: ${data.containment_action_detail}`} {data.compensation && `| การชดเชย: ${data.compensation}`}
            </div>
          </div>

          <div>
            <label>รายละเอียดปัญหาโดยละเอียด</label>
            <p style={{ fontSize: '15px', whiteSpace: 'pre-wrap', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {data.problem_detail}
            </p>
          </div>
        </div>

        {/* Action / Stepper History */}
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>บันทึกประวัติการทำงาน (Approval & Action Log)</h3>
        <div className="glass-panel" style={{ padding: '24px' }}>
          {data.steps.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>ไม่มีประวัติการอนุมัติในขณะนี้</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {data.steps.map((st, idx) => (
                <div key={st.id} style={{ display: 'flex', gap: '15px', borderLeft: '3px solid var(--ccar-primary)', paddingLeft: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '15px', color: '#fff' }}>Step {st.step} - ทำรายการโดย: {st.actor_name} ({st.actor_role})</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(st.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                      ผลลัพธ์: <span style={{ color: 'var(--success)', fontWeight: '600' }}>{st.result}</span>
                    </div>
                    {st.reason && (
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '8px 12px', borderRadius: '4px', margin: '4px 0' }}>
                        เหตุผล: {st.reason}
                      </div>
                    )}
                    {/* Render step specific data JSON */}
                    {st.data_json && st.data_json !== '{}' && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px', marginTop: '6px' }}>
                        รายละเอียดเพิ่มเติม: {st.data_json}
                      </div>
                    )}
                    {/* Render step files attached */}
                    {data.attachments.filter(a => a.step === st.step).map(att => (
                      <div key={att.id} style={{ marginTop: '8px', fontSize: '13px' }}>
                        📎 ไฟล์แนบ: <a href={`http://localhost:8000${att.file_path}`} target="_blank" rel="noreferrer" style={{ color: 'var(--ccar-primary)', textDecoration: 'underline' }}>{att.file_name}</a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: WORKFLOW STEPPING FORM */}
      <div>
        <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '30px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>สถานะขั้นตอนปัจจุบัน</h3>
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid var(--border-focus)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--ccar-primary)', fontWeight: '600' }}>Step {data.current_step}</div>
            <div style={{ fontWeight: '600', color: '#fff', fontSize: '15px' }}>{currentStepLabel}</div>
          </div>

          {data.current_step === 'Closed' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ color: 'var(--success)', marginBottom: '10px' }}>
                <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <strong style={{ fontSize: '16px' }}>ปิดเคสนี้เรียบร้อยแล้ว</strong>
            </div>
          ) : checkAuth() ? (
            <form onSubmit={handleStepSubmit}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>ดำเนินการตามขั้นตอน</h4>
              
              {/* Dynamic results options based on step */}
              <div className="form-group">
                <label>การตัดสินใจ (Action/Result) *</label>
                <select value={actionResult} onChange={e => setActionResult(e.target.value)}>
                  {data.current_step === '1.1' && (
                    <>
                      <option value="Correct">ข้อมูลถูกต้อง (Correct)</option>
                      <option value="Incorrect">ข้อมูลไม่ถูกต้อง (Incorrect)</option>
                    </>
                  )}
                  {data.current_step === '1.2' && (
                    <>
                      <option value="Approve">อนุมัติให้ออก CCAR</option>
                      <option value="Reject">ไม่อนุมัติ / ยกเลิก</option>
                    </>
                  )}
                  {data.current_step === '1.3' && (
                    <>
                      <option value="No problem">ตัวอย่างปกติ (No problem)</option>
                      <option value="Have problem same as customer">ตัวอย่างพบปัญหาเช่นเดียวกับลูกค้า</option>
                    </>
                  )}
                  {data.current_step === '2' && (
                    <>
                      <option value="Correct">จัดหมวดหมู่ผ่าน (Correct)</option>
                      <option value="Incorrect">ข้อมูลไม่สมบูรณ์ (Incorrect)</option>
                    </>
                  )}
                  {data.current_step === '2.1' && (
                    <>
                      <option value="Approve">รับเรื่องเข้าระบบ (Approve)</option>
                      <option value="Reject">ไม่รับคำร้อง (Reject)</option>
                    </>
                  )}
                  {data.current_step === '2.2' && (
                    <>
                      <option value="Call meeting">เรียกประชุมผู้เกี่ยวข้อง (Call meeting)</option>
                      <option value="Not call meeting">ไม่ต้องจัดประชุม</option>
                    </>
                  )}
                  {data.current_step === '2.3' && <option value="Submit">ส่งข้อมูลและมอบหมาย</option>}
                  {data.current_step === '3.1' && <option value="Submit">ส่งแผนแก้ไข (Submit Action)</option>}
                  {data.current_step === '3.2' && (
                    <>
                      <option value="Approve">อนุมัติแผนแก้ไข (Approve)</option>
                      <option value="Reject">ตีกลับเพื่อแก้ไขแผน (Reject)</option>
                    </>
                  )}
                  {data.current_step === '3.3' && <option value="Submit">บันทึกวันนัดติดตามผล (Submit)</option>}
                  {data.current_step === '3.4' && (
                    <>
                      <option value="Approve">อนุมัติแผนงานภาพรวม (Approve)</option>
                      <option value="Reject">ตีกลับเพื่อแก้ไขแผน (Reject)</option>
                    </>
                  )}
                  {data.current_step === '4' && (
                    <>
                      <option value="Satisfaction">ลูกค้าพึงพอใจ (Satisfaction)</option>
                      <option value="Unsatisfaction">ลูกค้าไม่พึงพอใจ (Unsatisfaction)</option>
                    </>
                  )}
                  {data.current_step === '5' && (
                    <>
                      <option value="Approve">ผ่านการประเมิน (Approve)</option>
                      <option value="Reject">ตีกลับเนื่องจากลูกค้าไม่พึงพอใจ</option>
                    </>
                  )}
                  {data.current_step === '7.1' && (
                    <>
                      <option value="Approve">ปิดคำร้อง CCAR (Close Case)</option>
                      <option value="Reject">ตีกลับทบทวนแผนแก้ไข (Reject)</option>
                    </>
                  )}
                  {data.current_step === '7.2' && <option value="Submit">ส่งรายงานประเมินผลขยายผล</option>}
                  {data.current_step === '7.3' && (
                    <>
                      <option value="Approve">อนุมัติปิดเคสขยายผล (Close Case)</option>
                      <option value="Reject">ตีกลับให้แก้ไขใหม่</option>
                    </>
                  )}
                </select>
              </div>

              {/* Custom Input controls for specific steps */}
              {data.current_step === '2.2' && (
                <div className="form-group">
                  <label>แผนกที่ต้องร่วมประชุม (เลือกได้หลายแผนก)</label>
                  {['QC', 'PD', 'Sales', 'TS', 'Warehouse', 'R&D'].map(d => (
                    <label key={d} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', margin: '4px 0' }}>
                      <input
                        type="checkbox"
                        checked={stepData.departments?.includes(d)}
                        onChange={(e) => {
                          const list = stepData.departments ? [...stepData.departments] : [];
                          if (e.target.checked) list.push(d);
                          else list.splice(list.indexOf(d), 1);
                          setStepData({ ...stepData, departments: list });
                        }}
                      />
                      {d}
                    </label>
                  ))}
                </div>
              )}

              {data.current_step === '2.3' && (
                <div className="form-group">
                  <label>มอบหมายแผนกวิเคราะห์แผนงาน (Assign Dept) *</label>
                  <select value={stepData.assignDept} onChange={e => setStepData({ ...stepData, assignDept: e.target.value })}>
                    <option value="QC">แผนกควบคุมคุณภาพ (QC)</option>
                    <option value="PRODUCTION">ฝ่ายผลิต (Production / PD)</option>
                    <option value="TS">ฝ่ายบริการเทคนิค (TS)</option>
                    <option value="INVENTORY">ฝ่ายคลังสินค้า (Inventory)</option>
                  </select>
                </div>
              )}

              {data.current_step === '3.1' && (
                <>
                  <div className="form-group">
                    <label>วิธีการสืบหาสาเหตุ *</label>
                    <select value={stepData.rootCauseMethod} onChange={e => setStepData({ ...stepData, rootCauseMethod: e.target.value })}>
                      <option value="5 Why">5 Why Analysis</option>
                      <option value="Fish Bone">Fishbone Diagram (ก้างปลา)</option>
                      <option value="Other">แนวทางอื่นๆ</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ผลการวิเคราะห์สาเหตุ (Root Cause) *</label>
                    <textarea rows="3" required value={stepData.rootCauseDetail} onChange={e => setStepData({ ...stepData, rootCauseDetail: e.target.value })} placeholder="อธิบายสาเหตุหลักที่แท้จริง"></textarea>
                  </div>
                  <div className="form-group">
                    <label>กลุ่มสาเหตุ (Reason Code) *</label>
                    <select value={stepData.reasonCode} onChange={e => setStepData({ ...stepData, reasonCode: e.target.value })}>
                      <option value="Valid">ตรวจสอบแล้วมีปัญหาจริง (Valid)</option>
                      <option value="Not Valid">ตรวจสอบแล้วไม่พบความเสียหาย (Not Valid)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>มาตรการแก้ไขปัญหา (Corrective Action) *</label>
                    <textarea rows="2" required value={stepData.correctiveAction} onChange={e => setStepData({ ...stepData, correctiveAction: e.target.value })} placeholder="รายละเอียดการแก้ไข"></textarea>
                  </div>
                  <div className="form-group">
                    <label>กำหนดเสร็จแก้ไข (Due Date) *</label>
                    <input type="date" required value={stepData.correctiveDueDate} onChange={e => setStepData({ ...stepData, correctiveDueDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>มีสินค้ากักแยก/ต้องชดเชย (Hold Stock)</label>
                    <select value={stepData.holdStock} onChange={e => setStepData({ ...stepData, holdStock: e.target.value })}>
                      <option value="No">ไม่มีสินค้าตกค้าง (No)</option>
                      <option value="Yes">มีสินค้าตกค้าง (Yes)</option>
                    </select>
                  </div>
                  {stepData.holdStock === 'Yes' && (
                    <div className="form-group">
                      <label>จำนวนกักกัน / ส่งคืน</label>
                      <input type="text" value={stepData.holdStockQty} onChange={e => setStepData({ ...stepData, holdStockQty: e.target.value })} placeholder="ระบุจำนวนหน่วย" />
                    </div>
                  )}
                  <div className="form-group">
                    <label>มาตรการป้องกันสูงสุด (Preventive Action) *</label>
                    <textarea rows="2" required value={stepData.preventiveAction} onChange={e => setStepData({ ...stepData, preventiveAction: e.target.value })} placeholder="รายละเอียดการป้องกันพ่นซ้ำ"></textarea>
                  </div>
                  <div className="form-group">
                    <label>กำหนดเสร็จป้องกัน (Due Date) *</label>
                    <input type="date" required value={stepData.preventiveDueDate} onChange={e => setStepData({ ...stepData, preventiveDueDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>ต้องขยายผลป้องกันข้ามหน่วยผลิต?</label>
                    <select value={stepData.needExpandedPrevention} onChange={e => setStepData({ ...stepData, needExpandedPrevention: e.target.value })}>
                      <option value="No">ไม่ต้องขยายผล (No)</option>
                      <option value="Need">ต้องการขยายผล (Need)</option>
                    </select>
                  </div>
                  {stepData.needExpandedPrevention === 'Need' && (
                    <>
                      <div className="form-group">
                        <label>รายละเอียดการขยายผล</label>
                        <textarea rows="2" value={stepData.needExpandedDetail} onChange={e => setStepData({ ...stepData, needExpandedDetail: e.target.value })} placeholder="จุดที่ต้องไปขยายผลป้องกัน"></textarea>
                      </div>
                      <div className="form-group">
                        <label>กำหนดวันเสร็จการขยายผล</label>
                        <input type="date" value={stepData.needExpandedDueDate} onChange={e => setStepData({ ...stepData, needExpandedDueDate: e.target.value })} />
                      </div>
                    </>
                  )}
                  <div className="form-group">
                    <label>ต้องทบทวนเอกสาร FMEA หรือไม่</label>
                    <select value={stepData.needReviewFmea} onChange={e => setStepData({ ...stepData, needReviewFmea: e.target.value })}>
                      <option value="No">No (ไม่จำเป็น)</option>
                      <option value="PFMEA">ทบทวน PFMEA</option>
                      <option value="DFMEA">ทบทวน DFMEA</option>
                    </select>
                  </div>
                </>
              )}

              {data.current_step === '3.3' && (
                <div className="form-group">
                  <label>กำหนดนัดตรวจความก้าวหน้า (Due Follow up Date) *</label>
                  <input type="date" required value={stepData.dueFollowUpDate} onChange={e => setStepData({ ...stepData, dueFollowUpDate: e.target.value })} />
                </div>
              )}

              {data.current_step === '7.2' && (
                <>
                  <div className="form-group">
                    <label>ผลการติดตามขยายผล *</label>
                    <select value={stepData.followUpResult} onChange={e => setStepData({ ...stepData, followUpResult: e.target.value })}>
                      <option value="Finish and not found problem">สำเร็จเรียบร้อยและไม่พบปัญหาซ้ำ</option>
                      <option value="Not finish">การแก้ไขยังไม่เรียบร้อยสมบูรณ์</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>รายละเอียดการติดตามผล *</label>
                    <textarea rows="2" required value={stepData.followUpDetail} onChange={e => setStepData({ ...stepData, followUpDetail: e.target.value })} placeholder="ระบุผลตรวจวัด"></textarea>
                  </div>
                </>
              )}

              {/* Attachment File upload control */}
              {['1.3', '3.1', '7.2'].includes(data.current_step) && (
                <div className="form-group">
                  <label>แนบเอกสารผลการวิเคราะห์/ผลทดสอบ (.jpg, .png, .pdf, .docx)</label>
                  <input type="file" onChange={e => setAttachedFile(e.target.files[0])} style={{ background: 'transparent', padding: '4px 0', border: 'none' }} />
                </div>
              )}

              <div className="form-group">
                <label>เหตุผล / ความเห็น (Reason / Comment)</label>
                <textarea rows="2" value={actionReason} onChange={e => setActionReason(e.target.value)} placeholder="คำแนะนำ หรือสาเหตุของการตัดสินใจ"></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>ส่งข้อมูลเวิร์กโฟลว์ (Submit Step)</button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '15px 0', color: 'var(--text-secondary)' }}>
              <p>คุณไม่มีสิทธิ์อนุมัติขั้นตอนนี</p>
              <p style={{ fontSize: '12px', marginTop: '6px' }}>เฉพาะบทบาทที่ได้รับมอบหมายจึงจะสามารถอนุมัติได้</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// NCR WORKFLOW & DETAIL VIEW
function NcrDetailView({ recordId, setCurrentView, getHeaders, token, user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Action form state
  const [actionResult, setActionResult] = useState('Approve');
  const [actionReason, setActionReason] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [stepData, setStepData] = useState({});

  useEffect(() => {
    fetchData();
  }, [recordId]);

  const fetchData = () => {
    setLoading(true);
    fetch(`${API_BASE}/ncr/${recordId}`, { headers: getHeaders() })
      .then(res => res.json())
      .then(d => {
        setData(d);
        if (d.current_step === '1') setActionResult('Approve');
        else if (d.current_step === '2') setActionResult('Transfer Stock');
        else if (d.current_step === '3') setActionResult('Verify');
        else if (d.current_step === '4') setActionResult('Approve');
        else if (d.current_step === '5') {
          setActionResult('Disposition');
          setStepData({ dispositionProposal: 'Scrap' });
        }
        else if (d.current_step === '6') setActionResult('Approve');
        else if (d.current_step === '7') setActionResult('Approve');
        else if (d.current_step === '8') setActionResult('Submit');
        else if (d.current_step === '9') {
          setActionResult('Submit');
          setStepData({ reprocessDetail: '' });
        }
        else if (d.current_step === '10') setActionResult('Approve');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleStepSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('step', data.current_step);
    formData.append('result', actionResult);
    formData.append('reason', actionReason);
    formData.append('data_json', JSON.stringify(stepData));
    if (attachedFile) {
      formData.append('file', attachedFile);
    }

    fetch(`${API_BASE}/ncr/${recordId}/step`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to update NCR step');
      })
      .then(() => {
        alert('อัปเดตขั้นตอน NCR เรียบร้อยแล้ว!');
        setAttachedFile(null);
        setActionReason('');
        fetchData();
      })
      .catch(err => alert(err.message));
  };

  const checkAuth = () => {
    if (!data) return false;
    const r = user.role;
    const s = data.current_step;

    if (s === '1') return true; // Anyone can submit issue verification
    if (s === '2') return r === 'INVENTORY';
    if (s === '3' || s === '4' || s === '5' || s === '7' || s === '10') return r === 'QC';
    if (s === '6') return r === 'TN';
    if (s === '8' || s === '9') return r === 'PRODUCTION' || r === 'TN';
    return false;
  };

  if (loading) return <p style={{ padding: '50px', textAlign: 'center', color: '#fff' }}>กำลังโหลดข้อมูลรายงาน NCR...</p>;
  if (!data) return <p style={{ padding: '50px', textAlign: 'center', color: '#fff' }}>ไม่พบเคสที่ต้องการ</p>;

  const currentStepLabel = {
    '1': 'อนุมัติการแจ้งเอกสาร NCR',
    '2': 'ตรวจสอบพัสดุใน SAP (Inventory Transfer QI)',
    '3': 'QC คัดเกรดคุณภาพ (Additional NC by QC)',
    '4': 'วิเคราะห์หาสาเหตุเสีย (Investigate)',
    '5': 'ข้อเสนอแนะจัดจำหน่ายของเสีย (Disposition/Proposal)',
    '6': 'พิจารณาตัดสินใจขั้นเทคนิค (Judgement by Technic/TN)',
    '7': 'QC อนุมัติโอนย้าย stock ใน SAP',
    '8': 'ตอบรับมาตรการป้องกันและประเมินผล',
    '9': 'บันทึกกระบวนการแก้เสีย (Reprocess Record)',
    '10': 'QC ตรวจสอบหลังแก้งานเสีย (QC Disposition from Reprocess)',
    'Closed': 'ปิดรายงาน NCR เสร็จสมบูรณ์'
  }[data.current_step];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', alignItems: 'start' }}>
      
      {/* LEFT COLUMN: NCR DETAILS */}
      <div>
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span className={`badge badge-${data.status.toLowerCase().replace(' ', '')}`} style={{ marginBottom: '6px' }}>{data.status}</span>
              <h2 style={{ fontSize: '24px', fontWeight: '700' }}>{data.ncr_no}</h2>
            </div>
            <button className="btn btn-secondary" onClick={() => setCurrentView('dashboard')}>ย้อนกลับ</button>
          </div>

          <div className="grid-3" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '15px' }}>
            <div>
              <label>โรงงานผู้พบ (Plant)</label>
              <div style={{ fontWeight: '600', color: 'var(--ncr-primary)' }}>{data.plant}</div>
            </div>
            <div>
              <label>Business Unit (BU)</label>
              <div style={{ fontWeight: '500' }}>{data.bu}</div>
            </div>
            <div>
              <label>แผนกที่รายงาน</label>
              <div style={{ fontWeight: '500' }}>{data.issued_by_dept}</div>
            </div>
          </div>

          <div className="grid-3" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '15px' }}>
            <div>
              <label>ชื่อผลิตภัณฑ์</label>
              <div style={{ fontWeight: '500' }}>{data.product_name} ({data.product_code || 'N/A'})</div>
            </div>
            <div>
              <label>Batch / Lot No.</label>
              <div style={{ fontWeight: '500' }}>{data.lot_no || 'N/A'}</div>
            </div>
            <div>
              <label>ปริมาณความเสียหาย</label>
              <div style={{ fontWeight: '600', color: 'var(--danger)' }}>{data.defect_qty} {data.defect_unit}</div>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>ต้องการโอนย้าย QI ในระบบ SAP?</label>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>{data.transfer_qi === 'Yes' ? 'ต้องการโอนย้ายสถานะ QI' : 'ไม่ต้องโอนย้ายสถานะ QI'}</div>
          </div>

          <div>
            <label>ลักษณะของเสียและรายละเอียด</label>
            <p style={{ fontSize: '15px', whiteSpace: 'pre-wrap', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {data.defect_detail}
            </p>
          </div>
        </div>

        {/* Action history log for NCR */}
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>ประวัติการอนุมัติใบรายงาน NCR</h3>
        <div className="glass-panel" style={{ padding: '24px' }}>
          {data.steps.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>ไม่มีประวัติการอนุมัติในขณะนี้</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {data.steps.map((st) => (
                <div key={st.id} style={{ display: 'flex', gap: '15px', borderLeft: '3px solid var(--ncr-primary)', paddingLeft: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '15px', color: '#fff' }}>Step {st.step} - ผู้ดำเนินการ: {st.actor_name} ({st.actor_role})</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(st.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                      ผลลัพธ์: <span style={{ color: 'var(--ncr-primary)', fontWeight: '600' }}>{st.result}</span>
                    </div>
                    {st.reason && (
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '8px 12px', borderRadius: '4px', margin: '4px 0' }}>
                        รายละเอียด: {st.reason}
                      </div>
                    )}
                    {st.data_json && st.data_json !== '{}' && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px', marginTop: '6px' }}>
                        ข้อมูลดิบ: {st.data_json}
                      </div>
                    )}
                    {data.attachments.filter(a => a.step === st.step).map(att => (
                      <div key={att.id} style={{ marginTop: '8px', fontSize: '13px' }}>
                        📎 ไฟล์แนบ: <a href={`http://localhost:8000${att.file_path}`} target="_blank" rel="noreferrer" style={{ color: 'var(--ncr-primary)', textDecoration: 'underline' }}>{att.file_name}</a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: WORKFLOW STEPPING FORM */}
      <div>
        <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '30px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>สถานะขั้นตอน NCR</h3>
          <div style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.3)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--ncr-primary)', fontWeight: '600' }}>Step {data.current_step}</div>
            <div style={{ fontWeight: '600', color: '#fff', fontSize: '15px' }}>{currentStepLabel}</div>
          </div>

          {data.current_step === 'Closed' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ color: 'var(--success)', marginBottom: '10px' }}>
                <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <strong style={{ fontSize: '16px' }}>ปิดรายงาน NCR เรียบร้อย</strong>
            </div>
          ) : checkAuth() ? (
            <form onSubmit={handleStepSubmit}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>ดำเนินการตามขั้นตอน NCR</h4>
              
              <div className="form-group">
                <label>การตัดสินใจ (Action/Result) *</label>
                <select value={actionResult} onChange={e => setActionResult(e.target.value)}>
                  {data.current_step === '1' && (
                    <>
                      <option value="Approve">อนุมัติการแจ้ง NCR</option>
                      <option value="Reject">ไม่อนุมัติ / ยกเลิก</option>
                    </>
                  )}
                  {data.current_step === '2' && <option value="Transfer Stock">ยืนยันโอนย้ายสถานะ QI สำเร็จ</option>}
                  {data.current_step === '3' && <option value="Verify">ผ่านการคัดแยกเกรดสินค้า</option>}
                  {data.current_step === '4' && (
                    <>
                      <option value="Approve">วิเคราะห์วิจัยสาเหตุเรียบร้อย</option>
                      <option value="Reject">สาเหตุไม่เด่นชัด / ตีกลับแก้ไข</option>
                    </>
                  )}
                  {data.current_step === '5' && <option value="Disposition">ยืนยันการทำข้อเสนอจำหน่าย</option>}
                  {data.current_step === '6' && (
                    <>
                      <option value="Approve">อนุมัติข้อเสนอปล่อยผ่าน (Approve)</option>
                      <option value="Reprocess">ต้องนำไปประมวลผลซ้ำ (Reprocess)</option>
                      <option value="Reject">ไม่อนุมัติคำร้อง (Reject)</option>
                    </>
                  )}
                  {data.current_step === '7' && <option value="Approve">อนุมัติโอนย้ายคลังสินค้าจริงใน SAP</option>}
                  {data.current_step === '8' && <option value="Submit">รับทราบความเห็นและสิ้นสุดแผนป้องกัน</option>}
                  {data.current_step === '9' && <option value="Submit">ส่งรายงานผลแก้งานเสีย</option>}
                  {data.current_step === '10' && (
                    <>
                      <option value="Approve">อนุมัติปิดเคสแก้งานเสียผ่านการตรวจสอบ</option>
                      <option value="Reject">ผลแก้งานไม่ได้มาตรฐาน / ปรับแผน</option>
                    </>
                  )}
                </select>
              </div>

              {/* Custom inputs */}
              {data.current_step === '5' && (
                <div className="form-group">
                  <label>ข้อเสนอแนะการจำหน่ายของเสีย (Disposition) *</label>
                  <select value={stepData.dispositionProposal} onChange={e => setStepData({ ...stepData, dispositionProposal: e.target.value })}>
                    <option value="Scrap">ทำลายทิ้ง (Scrap)</option>
                    <option value="Rework / Reprocess">แก้งานใหม่ (Reprocess / Rework)</option>
                    <option value="Accept as is">ยอมรับตามสภาพใช้งานพิเศษ (Accept as is)</option>
                    <option value="Return to vendor">ส่งคืนผู้ผลิตสารตั้งต้น (Return to Vendor)</option>
                  </select>
                </div>
              )}

              {data.current_step === '9' && (
                <div className="form-group">
                  <label>บันทึกขั้นตอนและผลลัพธ์การแก้งาน *</label>
                  <textarea rows="3" required value={stepData.reprocessDetail} onChange={e => setStepData({ ...stepData, reprocessDetail: e.target.value })} placeholder="อธิบายขั้นตอนการแก้งานเสียอย่างละเอียด เช่น เติมสารทำละลาย อุ่นอุณหภูมิใหม่..."></textarea>
                </div>
              )}

              {['4', '9'].includes(data.current_step) && (
                <div className="form-group">
                  <label>แนบไฟล์ประกอบรายงานความเสียหาย</label>
                  <input type="file" onChange={e => setAttachedFile(e.target.files[0])} style={{ background: 'transparent', padding: '4px 0', border: 'none' }} />
                </div>
              )}

              <div className="form-group">
                <label>รายละเอียดความคิดเห็นเพิ่มเติม</label>
                <textarea rows="2" value={actionReason} onChange={e => setActionReason(e.target.value)} placeholder="ความคิดเห็นเพิ่มเติม..."></textarea>
              </div>

              <button type="submit" className="btn btn-ncr" style={{ width: '100%' }}>ส่งอนุมัติขั้นตอน NCR (Submit Step)</button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '15px 0', color: 'var(--text-secondary)' }}>
              <p>คุณไม่มีสิทธิ์อนุมัติขั้นตอน NCR นี้</p>
              <p style={{ fontSize: '12px', marginTop: '6px' }}>กรุณาตรวจสอบตารางสิทธิ์การดำเนินการ</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
