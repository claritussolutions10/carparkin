import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Plus, Download, Pencil, Trash2, Eye, X } from 'lucide-react'
import {
  getAdminUsers, updateAdminUserStatus, updateAdminUser, type AdminUser,
} from '../../api/admin.api'
import { signup } from '../../api/auth.api'
import SearchInput from '../../components/common/SearchInput'
import Select from '../../components/common/Select'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Pagination from '../../components/common/Pagination'

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

const ROLE_OPTIONS = [
  { value: 'user', label: 'Renter' },
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
]
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
]

const ROLE_DOT: Record<string, string> = { user: 'bg-blue-500', owner: 'bg-purple-500', admin: 'bg-amber' }
const ROLE_LABEL: Record<string, string> = { user: 'Renter', owner: 'Owner', admin: 'Admin' }

function downloadUsersCsv(rows: AdminUser[], filename: string) {
  const header = ['ID', 'Name', 'Email', 'Role', 'Status', 'Phone', 'Joined']
  const lines = rows.map((u) => [
    u.id, u.full_name, u.email, ROLE_LABEL[u.role] ?? u.role, u.is_active ? 'Active' : 'Suspended', u.phone_number || '', u.created_at,
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

interface EditFormState { fullName: string; phoneNumber: string; role: 'user' | 'owner' }

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)
  const [bulkSaving, setBulkSaving] = useState(false)

  const [viewTarget, setViewTarget] = useState<AdminUser | null>(null)
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({ fullName: '', phoneNumber: '', role: 'user' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null)
  const [statusSaving, setStatusSaving] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ fullName: '', email: '', phoneNumber: '', password: '', role: 'user' as 'user' | 'owner' })
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState('')

  const load = () => {
    setLoading(true)
    getAdminUsers({ search: search || undefined, role: role || undefined, status: status || undefined, page, limit })
      .then((d) => { setUsers(d.users); setTotal(d.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, role, status, page])
  useEffect(() => { setPage(1) }, [search, role, status])
  useEffect(() => { setSelected(new Set()) }, [users])

  const totalPages = Math.ceil(total / limit)
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1
  const rangeEnd = Math.min(page * limit, total)

  const allSelected = users.length > 0 && users.every((u) => selected.has(u.id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(users.map((u) => u.id)))
  const toggleOne = (id: string) => setSelected((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const selectedUsers = useMemo(() => users.filter((u) => selected.has(u.id)), [users, selected])

  const openEdit = (u: AdminUser) => {
    setEditTarget(u)
    setEditForm({ fullName: u.full_name, phoneNumber: u.phone_number, role: u.role === 'admin' ? 'user' : u.role })
    setEditError('')
  }

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setEditSaving(true)
    setEditError('')
    try {
      await updateAdminUser(editTarget.id, editForm)
      setEditTarget(null)
      load()
    } catch (err: any) {
      setEditError(err?.response?.data?.error || 'Could not update user')
    } finally {
      setEditSaving(false)
    }
  }

  const confirmStatusToggle = async () => {
    if (!statusTarget) return
    setStatusSaving(true)
    try {
      await updateAdminUserStatus(statusTarget.id, !statusTarget.is_active)
      setStatusTarget(null)
      load()
    } catch { /* keep dialog open on failure */ } finally {
      setStatusSaving(false)
    }
  }

  const confirmBulkSuspend = async () => {
    setBulkSaving(true)
    try {
      await Promise.all(selectedUsers.map((u) => updateAdminUserStatus(u.id, false)))
      setBulkConfirmOpen(false)
      setSelected(new Set())
      load()
    } catch { /* partial failures still reflected on refetch */ } finally {
      setBulkSaving(false)
    }
  }

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddSaving(true)
    setAddError('')
    try {
      await signup({
        full_name: addForm.fullName,
        email: addForm.email,
        password: addForm.password,
        phone_number: addForm.phoneNumber,
        role: addForm.role,
      })
      setAddOpen(false)
      setAddForm({ fullName: '', email: '', phoneNumber: '', password: '', role: 'user' })
      load()
    } catch (err: any) {
      setAddError(err?.response?.data?.error || err?.response?.data?.message || 'Could not create user')
    } finally {
      setAddSaving(false)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-ink/40 flex items-center gap-1.5 mb-4">
        <Link to="/admin/dashboard" className="hover:text-green transition-colors">Dashboard</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium">Users</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">User Management</h1>
          <p className="text-sm text-ink/50 mt-1">Manage access, view details, and update registered users.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 bg-green text-white font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-green-light transition-colors shrink-0"
        >
          <Plus size={16} /> Add New User
        </button>
      </div>

      {/* Search + filters */}
      <div className="bg-surface rounded-xl border border-line p-4 mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, or ID..." className="flex-1 min-w-[220px]" />
        <Select value={role} onChange={(e) => setRole(e.target.value)} placeholder="User Role" options={ROLE_OPTIONS} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Status" options={STATUS_OPTIONS} />
        <button
          onClick={() => downloadUsersCsv(users, `users-page-${page}-${new Date().toISOString().slice(0, 10)}.csv`)}
          className="inline-flex items-center gap-2 border border-line text-ink/70 font-medium text-sm px-4 py-2 rounded-lg hover:bg-concrete transition-colors"
        >
          <Download size={15} /> Export
        </button>
      </div>

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="bg-navy text-white rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadUsersCsv(selectedUsers, `users-selected-${new Date().toISOString().slice(0, 10)}.csv`)}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download size={14} /> Export Selected
            </button>
            <button
              onClick={() => setBulkConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-danger hover:bg-danger/90 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Trash2 size={14} /> Suspend Selected
            </button>
            <button onClick={() => setSelected(new Set())} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" aria-label="Clear selection">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface rounded-xl border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink/40 uppercase tracking-wide border-b border-line bg-concrete">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-line text-green focus:ring-green/30" />
                </th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Joined Date</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-10 bg-concrete rounded animate-pulse" /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-ink/40">No users found.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-concrete/50 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} className="h-4 w-4 rounded border-line text-green focus:ring-green/30" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-green text-white text-sm flex items-center justify-center font-medium shrink-0 overflow-hidden">
                          {u.profile_picture ? <img src={u.profile_picture} alt="" className="w-full h-full object-cover" /> : u.full_name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate">{u.full_name}</p>
                          <p className="text-xs text-ink/40 font-mono truncate">ID: {u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-ink/70">
                        <span className={`w-1.5 h-1.5 rounded-full ${ROLE_DOT[u.role] ?? 'bg-line'}`} />
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.is_active ? 'green' : 'red'} label={u.is_active ? 'Active' : 'Suspended'} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ink truncate">{u.email}</p>
                      <p className="text-xs text-ink/40 mt-0.5">{u.phone_number || '–'}</p>
                    </td>
                    <td className="px-4 py-3 text-ink/50">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewTarget(u)} className="p-1.5 rounded-lg text-ink/40 hover:text-green hover:bg-green/10 transition-colors" aria-label="View">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-ink/40 hover:text-green hover:bg-green/10 transition-colors" aria-label="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setStatusTarget(u)} className="p-1.5 rounded-lg text-ink/40 hover:text-danger hover:bg-danger/10 transition-colors" aria-label={u.is_active ? 'Suspend' : 'Reactivate'}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4 flex-wrap mt-4">
        <p className="text-sm text-ink/40">
          {total === 0 ? 'No users' : `Showing ${rangeStart} to ${rangeEnd} of ${total} users`}
        </p>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} className="mt-0" />
      </div>

      {/* View modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="User Details">
        {viewTarget && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-green text-white flex items-center justify-center font-semibold overflow-hidden">
                {viewTarget.profile_picture ? <img src={viewTarget.profile_picture} alt="" className="w-full h-full object-cover" /> : viewTarget.full_name[0]}
              </div>
              <div>
                <p className="font-display font-semibold text-ink">{viewTarget.full_name}</p>
                <p className="text-xs text-ink/40 font-mono">ID: {viewTarget.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line">
              <div><p className="text-xs text-ink/40">Email</p><p className="text-ink">{viewTarget.email}</p></div>
              <div><p className="text-xs text-ink/40">Phone</p><p className="text-ink">{viewTarget.phone_number || '–'}</p></div>
              <div><p className="text-xs text-ink/40">Role</p><p className="text-ink">{ROLE_LABEL[viewTarget.role] ?? viewTarget.role}</p></div>
              <div><p className="text-xs text-ink/40">Status</p><Badge variant={viewTarget.is_active ? 'green' : 'red'} label={viewTarget.is_active ? 'Active' : 'Suspended'} /></div>
              <div><p className="text-xs text-ink/40">Joined</p><p className="text-ink">{fmtDate(viewTarget.created_at)}</p></div>
              <div><p className="text-xs text-ink/40">Email Verified</p><p className="text-ink">{viewTarget.is_email_verified ? 'Yes' : 'No'}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit User">
        <form onSubmit={submitEdit} className="space-y-4">
          <Input label="Full Name" value={editForm.fullName} onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))} required />
          <Input label="Phone Number" value={editForm.phoneNumber} onChange={(e) => setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))} required />
          {editTarget?.role !== 'admin' && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink">Role</label>
              <Select
                value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as 'user' | 'owner' }))}
                options={[{ value: 'user', label: 'Renter' }, { value: 'owner', label: 'Owner' }]}
                className="w-full"
              />
            </div>
          )}
          {editError && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{editError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditTarget(null)} disabled={editSaving}>Cancel</Button>
            <Button type="submit" loading={editSaving}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Add user modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New User">
        <form onSubmit={submitAdd} className="space-y-4">
          <Input label="Full Name" value={addForm.fullName} onChange={(e) => setAddForm((f) => ({ ...f, fullName: e.target.value }))} required />
          <Input label="Email" type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} required />
          <Input label="Phone Number" value={addForm.phoneNumber} onChange={(e) => setAddForm((f) => ({ ...f, phoneNumber: e.target.value }))} placeholder="+91 98765 43210" required />
          <Input label="Password" type="password" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} minLength={6} required />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink">Role</label>
            <Select
              value={addForm.role}
              onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value as 'user' | 'owner' }))}
              options={[{ value: 'user', label: 'Renter' }, { value: 'owner', label: 'Owner' }]}
              className="w-full"
            />
          </div>
          {addError && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{addError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)} disabled={addSaving}>Cancel</Button>
            <Button type="submit" loading={addSaving}>Create User</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!statusTarget}
        title={statusTarget?.is_active ? 'Suspend User' : 'Reactivate User'}
        message={
          statusTarget?.is_active
            ? `Suspend ${statusTarget?.full_name}? They will lose access until reactivated.`
            : `Reactivate ${statusTarget?.full_name}? They will regain access immediately.`
        }
        confirmLabel={statusTarget?.is_active ? 'Suspend' : 'Reactivate'}
        onConfirm={confirmStatusToggle}
        onCancel={() => setStatusTarget(null)}
        loading={statusSaving}
      />

      <ConfirmDialog
        open={bulkConfirmOpen}
        title="Suspend Selected Users"
        message={`Suspend ${selected.size} selected user${selected.size === 1 ? '' : 's'}? They will lose access until reactivated individually.`}
        confirmLabel="Suspend"
        onConfirm={confirmBulkSuspend}
        onCancel={() => setBulkConfirmOpen(false)}
        loading={bulkSaving}
      />
    </div>
  )
}
