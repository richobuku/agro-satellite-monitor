import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Mail,
  MoreVertical,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  X,
  Lock,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'matrix'

  // Modals
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form State for Invite / Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Senior Field Auditor',
    district: 'Gulu Northern Hub',
    status: 'active',
    permissions: ['map_garden', 'approve_audits', 'view_telemetry']
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const loadUsersList = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersList();
  }, []);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const handleOpenInvite = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Senior Field Auditor',
      district: 'Gulu Northern Hub',
      status: 'active',
      permissions: ['map_garden', 'approve_audits', 'view_telemetry']
    });
    setErrorMsg('');
    setInviteModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      district: user.district || 'Gulu Northern Hub',
      status: user.status || 'active',
      permissions: user.permissions || ['view_telemetry']
    });
    setErrorMsg('');
    setEditModalOpen(true);
  };

  const togglePermission = (perm) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== perm)
          : [...prev.permissions, perm]
      };
    });
  };

  const handleSaveInvite = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMsg('Name and email are required');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      await api.createUser(formData);
      showToast(`Invited ${formData.name} successfully!`);
      setInviteModalOpen(false);
      loadUsersList();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to invite user');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    setErrorMsg('');
    try {
      await api.updateUser(selectedUser.id, formData);
      showToast(`Updated ${formData.name}'s account`);
      setEditModalOpen(false);
      loadUsersList();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateUser(user.id, { status: newStatus });
      showToast(`${user.name} is now ${newStatus}`);
      loadUsersList();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to remove ${user.name} from AgroPulse?`)) return;
    try {
      await api.deleteUser(user.id);
      showToast(`User removed`);
      loadUsersList();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.district && u.district.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const allRoles = [
    'Super Admin',
    'Chief Agronomist',
    'Senior Field Auditor',
    'Farm Enterprise Manager',
    'ESG & Compliance Reviewer',
    'GPS Field Surveyor'
  ];

  const permissionsList = [
    { key: 'map_garden', label: 'Map Gardens & Micro-Plots', desc: 'Can use drawing tools to digitize boundaries & submit GPS coordinates' },
    { key: 'approve_audits', label: 'Approve & Sign Field Audits', desc: 'Can inspect polygon compliance and seal verification dossiers' },
    { key: 'view_telemetry', label: 'Access Sentinel-2 Telemetry', desc: 'Can inspect raw spectral bands, NDVI curves, and soil moisture' },
    { key: 'export_gis', label: 'Export GIS & Shapefiles', desc: 'Can download bulk GeoJSON, KML, and administrative yield projections' },
    { key: 'manage_users', label: 'Manage Team & Permissions', desc: 'Can invite members, adjust roles, and revoke platform access' },
    { key: 'manage_api_keys', label: 'Manage Agromonitoring API Keys', desc: 'Can configure OpenWeather and AgroMonitoring enterprise tokens' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '24px 32px 64px 32px',
        minWidth: 0,
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Toast Notification */}
      {successToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--ink)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
            fontSize: '13px',
            fontWeight: 600,
            borderLeft: '4px solid var(--g)',
          }}
        >
          <CheckCircle2 size={16} color="var(--g)" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header & Primary Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px 0' }}>
            Team & User Access Management
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--sub)' }}>
            Oversee field agronomists, assign regional plot audit quotas, and calibrate GPS surveyor permissions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-o"
            onClick={() => setActiveTab(activeTab === 'directory' ? 'matrix' : 'directory')}
            style={{ height: '36px', fontSize: '13px' }}
          >
            <Shield size={15} style={{ color: 'var(--g)' }} />
            <span>{activeTab === 'directory' ? 'View Role Matrix' : 'Back to Directory'}</span>
          </button>
          <button
            type="button"
            className="btn-o primary"
            onClick={handleOpenInvite}
            style={{ height: '36px', fontSize: '13px' }}
          >
            <UserPlus size={15} />
            <span>+ Invite Team Member</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats">
        <div className="stat">
          <small>TOTAL TEAM MEMBERS</small>
          <b>{users.length}</b>
          <span style={{ fontSize: '11px', color: 'var(--g)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <Users size={12} /> Across 4 Field Hubs
          </span>
        </div>

        <div className="stat">
          <small>ACTIVE FIELD AUDITORS</small>
          <b>{users.filter(u => u.status === 'active' && u.role.includes('Auditor') || u.role.includes('Surveyor')).length}</b>
          <span style={{ fontSize: '11px', color: 'var(--g)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <MapPin size={12} /> Ground-Truthing Active
          </span>
        </div>

        <div className="stat">
          <small>TOTAL PLOT AUDITS SEALED</small>
          <b>{users.reduce((acc, u) => acc + (u.audits_completed || 0), 0)}</b>
          <span style={{ fontSize: '11px', color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <CheckCircle2 size={12} /> 98.8% GPS Accuracy
          </span>
        </div>

        <div className="stat">
          <small>PENDING INVITATIONS</small>
          <b>{users.filter(u => u.status === 'pending').length}</b>
          <span style={{ fontSize: '11px', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <Clock size={12} /> Awaiting Verification
          </span>
        </div>
      </div>

      {activeTab === 'directory' ? (
        <>
          {/* Filters & Search Row */}
          <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--muted)' }} />
                <input
                  type="text"
                  placeholder="Search by agronomist name, email, district..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    paddingLeft: '34px',
                    paddingRight: '12px',
                    border: '1px solid var(--bd)',
                    borderRadius: '6px',
                    background: '#fff',
                    fontSize: '13px',
                    color: 'var(--ink)'
                  }}
                />
              </div>

              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  height: '36px',
                  padding: '0 12px',
                  border: '1px solid var(--bd)',
                  borderRadius: '6px',
                  background: '#fff',
                  fontSize: '13px',
                  color: 'var(--ink)'
                }}
              >
                <option value="ALL">All Roles</option>
                {allRoles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  height: '36px',
                  padding: '0 12px',
                  border: '1px solid var(--bd)',
                  borderRadius: '6px',
                  background: '#fff',
                  fontSize: '13px',
                  color: 'var(--ink)'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="pending">Pending Invitations</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--sub)', fontWeight: 500 }}>
              Showing <b>{filteredUsers.length}</b> of {users.length} members
            </div>
          </div>

          {/* User Roster Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>MEMBER & CONTACT</th>
                  <th>ASSIGNED ROLE</th>
                  <th>PRIMARY HUB & GARDENS</th>
                  <th>AUDITS COMPLETED</th>
                  <th>STATUS</th>
                  <th>LAST ACTIVITY</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isSuspended = user.status === 'suspended';
                  const isPending = user.status === 'pending';

                  return (
                    <tr key={user.id} style={{ opacity: isSuspended ? 0.65 : 1 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: user.role === 'Super Admin'
                                ? 'linear-gradient(135deg, #143a2a, #15803d)'
                                : user.role === 'Chief Agronomist'
                                ? 'linear-gradient(135deg, #15803d, #22c55e)'
                                : 'linear-gradient(135deg, #0284c7, #38bdf8)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '13px',
                              flexShrink: 0
                            }}
                          >
                            {user.avatar || user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 650, color: 'var(--ink)', fontSize: '13px' }}>
                              {user.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--sub)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Mail size={11} /> {user.email}
                              </span>
                              {user.phone && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Phone size={11} /> {user.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 650,
                            background:
                              user.role === 'Super Admin'
                                ? '#f3e8ff'
                                : user.role === 'Chief Agronomist'
                                ? 'var(--gt)'
                                : user.role.includes('Auditor')
                                ? '#e0f2fe'
                                : user.role.includes('ESG')
                                ? '#fef3c7'
                                : '#eef3ef',
                            color:
                              user.role === 'Super Admin'
                                ? '#7e22ce'
                                : user.role === 'Chief Agronomist'
                                ? 'var(--g)'
                                : user.role.includes('Auditor')
                                ? '#0284c7'
                                : user.role.includes('ESG')
                                ? '#b45309'
                                : 'var(--ink)'
                          }}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                          {user.district || 'Unassigned'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          {user.assigned_gardens_count || 0} registered plots
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                            {user.audits_completed || 0}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--sub)' }}>surveys</span>
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: isPending ? '#fef3c7' : isSuspended ? '#fee2e2' : 'var(--gt)',
                            color: isPending ? 'var(--amber)' : isSuspended ? 'var(--red)' : 'var(--g)'
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: isPending ? 'var(--amber)' : isSuspended ? 'var(--red)' : 'var(--g)'
                            }}
                          />
                          {isPending ? 'Pending' : isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--sub)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} color="var(--muted)" />
                          <span>{user.last_active || 'Recent'}</span>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn-o"
                            onClick={() => handleOpenEdit(user)}
                            title="Edit Permissions & Role"
                            style={{ padding: '5px 8px', height: '28px' }}
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            type="button"
                            className="btn-o"
                            onClick={() => handleToggleStatus(user)}
                            title={isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                            style={{
                              padding: '5px 8px',
                              height: '28px',
                              color: isSuspended ? 'var(--g)' : 'var(--amber)'
                            }}
                          >
                            {isSuspended ? <UserCheck size={13} /> : <UserX size={13} />}
                          </button>

                          {user.role !== 'Super Admin' && (
                            <button
                              type="button"
                              className="btn-o"
                              onClick={() => handleDeleteUser(user)}
                              title="Delete Member"
                              style={{ padding: '5px 8px', height: '28px', color: 'var(--red)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Role & Permissions Matrix Tab */
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px 0' }}>
              Enterprise Governance & Role Matrix
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--sub)' }}>
              AgroPulse provides fine-grained role-based access control (RBAC) to ensure telemetry integrity and audit readiness.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '280px' }}>CAPABILITY / PERMISSION</th>
                  <th style={{ textAlign: 'center' }}>SUPER ADMIN</th>
                  <th style={{ textAlign: 'center' }}>CHIEF AGRONOMIST</th>
                  <th style={{ textAlign: 'center' }}>SENIOR AUDITOR</th>
                  <th style={{ textAlign: 'center' }}>FARM MANAGER</th>
                  <th style={{ textAlign: 'center' }}>ESG REVIEWER</th>
                </tr>
              </thead>
              <tbody>
                {permissionsList.map((perm) => (
                  <tr key={perm.key}>
                    <td>
                      <div style={{ fontWeight: 650, color: 'var(--ink)', fontSize: '13px' }}>
                        {perm.label}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--sub)', marginTop: '2px' }}>
                        {perm.desc}
                      </div>
                    </td>

                    {/* Super Admin */}
                    <td style={{ textAlign: 'center' }}>
                      <CheckCircle2 size={18} color="var(--g)" style={{ margin: '0 auto' }} />
                    </td>

                    {/* Chief Agronomist */}
                    <td style={{ textAlign: 'center' }}>
                      {['map_garden', 'approve_audits', 'view_telemetry', 'export_gis'].includes(perm.key) ? (
                        <CheckCircle2 size={18} color="var(--g)" style={{ margin: '0 auto' }} />
                      ) : (
                        <span style={{ color: 'var(--bd)', fontSize: '16px' }}>—</span>
                      )}
                    </td>

                    {/* Senior Auditor */}
                    <td style={{ textAlign: 'center' }}>
                      {['map_garden', 'approve_audits', 'view_telemetry'].includes(perm.key) ? (
                        <CheckCircle2 size={18} color="var(--g)" style={{ margin: '0 auto' }} />
                      ) : (
                        <span style={{ color: 'var(--bd)', fontSize: '16px' }}>—</span>
                      )}
                    </td>

                    {/* Farm Manager */}
                    <td style={{ textAlign: 'center' }}>
                      {['view_telemetry', 'export_gis', 'map_garden'].includes(perm.key) ? (
                        <CheckCircle2 size={18} color="var(--g)" style={{ margin: '0 auto' }} />
                      ) : (
                        <span style={{ color: 'var(--bd)', fontSize: '16px' }}>—</span>
                      )}
                    </td>

                    {/* ESG Reviewer */}
                    <td style={{ textAlign: 'center' }}>
                      {['approve_audits', 'view_telemetry', 'export_gis'].includes(perm.key) ? (
                        <CheckCircle2 size={18} color="var(--g)" style={{ margin: '0 auto' }} />
                      ) : (
                        <span style={{ color: 'var(--bd)', fontSize: '16px' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ink)' }}>
                  Invite New Team Member
                </h3>
                <small style={{ color: 'var(--sub)' }}>
                  Send an activation invite and configure field permissions.
                </small>
              </div>
              <button
                type="button"
                className="btn-o"
                onClick={() => setInviteModalOpen(false)}
                style={{ padding: '4px 8px', height: '28px' }}
              >
                <X size={14} />
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: '#fee2e2',
                  color: 'var(--red)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertTriangle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveInvite} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '5px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Okot"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 12px',
                    border: '1px solid var(--bd)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: '#fff'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '5px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="samuel@agropulse.io"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 12px',
                      border: '1px solid var(--bd)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: '#fff'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '5px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+256 701 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 12px',
                      border: '1px solid var(--bd)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: '#fff'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '5px' }}>
                    Assigned Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 10px',
                      border: '1px solid var(--bd)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: '#fff'
                    }}
                  >
                    {allRoles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '5px' }}>
                    District / Operating Hub
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gulu Northern Hub"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 12px',
                      border: '1px solid var(--bd)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: '#fff'
                    }}
                  />
                </div>
              </div>

              {/* Granular Permissions */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>
                  Granular Permissions
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--soft)', padding: '10px', borderRadius: '6px' }}>
                  {permissionsList.map((perm) => (
                    <label
                      key={perm.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: 'var(--ink)',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key)}
                      />
                      <span style={{ fontWeight: 550 }}>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-o"
                  onClick={() => setInviteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-o primary"
                  disabled={saving}
                >
                  {saving ? 'Sending...' : 'Send Activation Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editModalOpen && selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ink)' }}>
                  Edit Member Account: {selectedUser.name}
                </h3>
                <small style={{ color: 'var(--sub)' }}>
                  Update role, assigned coverage districts, and operational security settings.
                </small>
              </div>
              <button
                type="button"
                className="btn-o"
                onClick={() => setEditModalOpen(false)}
                style={{ padding: '4px 8px', height: '28px' }}
              >
                <X size={14} />
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: '#fee2e2',
                  color: 'var(--red)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertTriangle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '5px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 12px',
                      border: '1px solid var(--bd)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: '#fff'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '5px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 12px',
                      border: '1px solid var(--bd)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: '#fff'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '5px' }}>
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 10px',
                      border: '1px solid var(--bd)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: '#fff'
                    }}
                  >
                    {allRoles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '5px' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 10px',
                      border: '1px solid var(--bd)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      background: '#fff'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '5px' }}>
                  District / Operating Region
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 12px',
                    border: '1px solid var(--bd)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: '#fff'
                  }}
                />
              </div>

              {/* Permissions */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>
                  Granular Permissions
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--soft)', padding: '10px', borderRadius: '6px' }}>
                  {permissionsList.map((perm) => (
                    <label
                      key={perm.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: 'var(--ink)',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key)}
                      />
                      <span style={{ fontWeight: 550 }}>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-o"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-o primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
