import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Package,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  X,
  ShieldOff,
  Settings,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import useAdminSession from '@/sessions/adminSession'
import { getSessionCookie } from '@/lib/sessionCookie'
import {
  fetchAddonFeatures,
  fetchOrganizationsWithFeatures,
  toggleOrgFeature,
  toggleAllOrgsFeature,
  createFeature,
  updateFeature,
  deleteFeature,
} from './service'

const PAGE_SIZE = 20

/**
 * Read the operator org id from env. Kept as a function so that bundlers
 * resolve the import.meta.env at build time but the parse stays explicit.
 */
const getOperatorOrgId = () => {
  const raw = import.meta.env.VITE_ADDON_SUPERADMIN_ORG_ID
  if (raw === undefined || raw === null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/**
 * Access rule mirrors the backend middleware:
 *   is_admin === true  OR  organization_id === VITE_ADDON_SUPERADMIN_ORG_ID.
 * Session shape comes from /auth login: { data: token, is_admin, organization_id, ... }.
 */
const hasAccess = (session) => {
  if (!session) return false
  if (session.is_admin === true) return true
  const operatorOrgId = getOperatorOrgId()
  if (operatorOrgId === null) return false
  return Number(session.organization_id) === operatorOrgId
}

const AccessDenied = () => (
  <div className="min-h-[60vh] flex items-center justify-center p-6">
    <div className="max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <ShieldOff className="h-7 w-7 text-red-600" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Access denied</h2>
      <p className="text-sm text-gray-500">
        Addon feature management is restricted to the platform super admin and
        the configured operator organization.
      </p>
    </div>
  </div>
)

const AddonFeaturesPage = () => {
  const { admin } = useAdminSession()
  // Cookie fallback for the first paint before the store hydrates from the
  // AdminProtectedRoute effect.
  const session = admin || getSessionCookie()

  const [features, setFeatures] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'enabled:<key>' | 'disabled:<key>'
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [alert, setAlert] = useState(null) // { type, message }
  const [confirm, setConfirm] = useState(null) // single-cell disable confirm
  const [confirmAll, setConfirmAll] = useState(null) // bulk enable/disable confirm
  const [showManager, setShowManager] = useState(false)
  // form === null  → hidden
  // form === { mode: 'create', values: {...} }  → new feature
  // form === { mode: 'edit',   feature, values: {...} }  → editing existing
  const [form, setForm] = useState(null)
  const [formError, setFormError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // feature row to delete

  const access = hasAccess(session)

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [f, o] = await Promise.all([
        fetchAddonFeatures(),
        fetchOrganizationsWithFeatures(),
      ])
      setFeatures(f)
      setOrganizations(o)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load addon features')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!access) return
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access])

  const flashAlert = (type, message, ms = 5000) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), ms)
  }

  const isOrgFeatureEnabled = (org, featureId) => {
    const row = org.features?.find((f) => f.feature_id === featureId)
    return !!(row && row.enabled)
  }

  const handleToggle = (org, feature, currentlyEnabled) => {
    if (currentlyEnabled) {
      setConfirm({ org, feature })
    } else {
      doToggle(org.id, feature.feature_key, true)
    }
  }

  const doToggle = async (organization_id, feature_key, enabled) => {
    setBusy(true)
    try {
      await toggleOrgFeature({ organization_id, feature_key, enabled })
      await loadAll()
      flashAlert('success', enabled ? 'Feature enabled.' : 'Feature disabled.')
      setConfirm(null)
    } catch (err) {
      flashAlert('error', err?.response?.data?.message || 'Update failed.')
    } finally {
      setBusy(false)
    }
  }

  const doToggleAll = async (feature_key, enabled) => {
    setBusy(true)
    try {
      const result = await toggleAllOrgsFeature({ feature_key, enabled })
      await loadAll()
      const verb = enabled ? 'Enabled' : 'Disabled'
      const affected = result?.affected != null ? ` (${result.affected} affected)` : ''
      flashAlert('success', `${verb} for all organizations${affected}.`)
      setConfirmAll(null)
    } catch (err) {
      flashAlert('error', err?.response?.data?.message || 'Bulk update failed.')
    } finally {
      setBusy(false)
    }
  }

  const openCreateForm = () => {
    setFormError(null)
    setForm({
      mode: 'create',
      values: { feature_key: '', name: '', description: '', default_enabled: false, sort_order: 0 },
    })
  }

  const openEditForm = (feature) => {
    setFormError(null)
    setForm({
      mode: 'edit',
      feature,
      values: {
        feature_key: feature.feature_key,
        name: feature.name || '',
        description: feature.description || '',
        default_enabled: !!feature.default_enabled,
        sort_order: Number(feature.sort_order) || 0,
      },
    })
  }

  const submitForm = async () => {
    if (!form) return
    setFormError(null)
    setBusy(true)
    try {
      if (form.mode === 'create') {
        const { feature_key, name } = form.values
        if (!feature_key.trim() || !name.trim()) {
          setFormError('feature_key and name are required.')
          setBusy(false)
          return
        }
        const res = await createFeature(form.values)
        if (res?.code && res.code >= 400) {
          setFormError(res.message || 'Create failed.')
          setBusy(false)
          return
        }
        flashAlert('success', 'Feature created.')
      } else {
        // Edit: feature_key is locked, don't send it
        const { name, description, default_enabled, sort_order } = form.values
        if (!name.trim()) {
          setFormError('name cannot be empty.')
          setBusy(false)
          return
        }
        const res = await updateFeature(form.feature.id, { name, description, default_enabled, sort_order })
        if (res?.code && res.code >= 400) {
          setFormError(res.message || 'Update failed.')
          setBusy(false)
          return
        }
        flashAlert('success', 'Feature updated.')
      }
      setForm(null)
      await loadAll()
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Request failed.')
    } finally {
      setBusy(false)
    }
  }

  const doDeleteFeature = async (feature) => {
    setBusy(true)
    try {
      const res = await deleteFeature(feature.id)
      if (res?.code && res.code >= 400) {
        flashAlert('error', res.message || 'Delete failed.')
        return
      }
      flashAlert('success', `Archived "${feature.name}". Existing toggles are preserved.`)
      setConfirmDelete(null)
      await loadAll()
    } catch (err) {
      flashAlert('error', err?.response?.data?.message || 'Delete failed.')
    } finally {
      setBusy(false)
    }
  }

  // Derived: filter + paginate orgs
  const filteredOrgs = useMemo(() => {
    let list = organizations
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((o) => {
        const hay = `${o.id} ${o.owner_name || ''} ${o.owner_email || ''}`.toLowerCase()
        return hay.includes(q)
      })
    }
    if (filter.startsWith('enabled:')) {
      const key = filter.slice('enabled:'.length)
      const feat = features.find((f) => f.feature_key === key)
      if (feat) list = list.filter((o) => isOrgFeatureEnabled(o, feat.id))
    } else if (filter.startsWith('disabled:')) {
      const key = filter.slice('disabled:'.length)
      const feat = features.find((f) => f.feature_key === key)
      if (feat) list = list.filter((o) => !isOrgFeatureEnabled(o, feat.id))
    }
    return list
  }, [organizations, features, search, filter])

  const totalOrgs = filteredOrgs.length
  const totalPages = Math.max(1, Math.ceil(totalOrgs / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedOrgs = filteredOrgs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Per-feature count of orgs that have it enabled (for the summary cards)
  const enabledCountsByFeature = useMemo(() => {
    const map = new Map()
    for (const f of features) map.set(f.id, 0)
    for (const o of organizations) {
      for (const row of o.features || []) {
        if (row.enabled && map.has(row.feature_id)) {
          map.set(row.feature_id, map.get(row.feature_id) + 1)
        }
      }
    }
    return map
  }, [features, organizations])

  if (!access) return <AccessDenied />

  return (
    <div className="bg-slate-200 w-full min-h-screen p-5">
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Addon Features</h1>
            <p className="text-gray-500 mt-1">
              Enable or disable Monitor addon features per organization.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Package className="h-4 w-4" /> {features.length} feature{features.length === 1 ? '' : 's'}
            </span>
            <span>{organizations.length} organization{organizations.length === 1 ? '' : 's'}</span>
            <button
              onClick={() => setShowManager(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Settings className="h-4 w-4" />
              Manage Features
            </button>
          </div>
        </div>

        {/* Feature summary cards */}
        {features.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {features.map((f) => {
              const enabledCount = enabledCountsByFeature.get(f.id) || 0
              const isFilteredOnThis = filter === `enabled:${f.feature_key}`
              const pct = organizations.length > 0
                ? Math.min(100, (enabledCount / organizations.length) * 100)
                : 0
              return (
                <div
                  key={f.id}
                  className={`bg-white rounded-xl border p-3 ${
                    isFilteredOnThis ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setFilter(isFilteredOnThis ? 'all' : `enabled:${f.feature_key}`)
                      setPage(1)
                    }}
                    className="w-full text-left rounded-md -m-1 p-1 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${enabledCount > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-xs font-medium text-gray-700 truncate">{f.name}</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {enabledCount}
                      <span className="text-sm font-normal text-gray-400">/{organizations.length}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    {f.description && (
                      <p className="text-[11px] text-gray-400 mt-2 line-clamp-2">{f.description}</p>
                    )}
                  </button>
                  <div className="flex gap-1 mt-3">
                    <button
                      onClick={() => setConfirmAll({ feature: f, action: 'enable' })}
                      disabled={busy}
                      className="flex-1 text-xs py-1.5 px-2 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium disabled:opacity-50 transition-colors"
                    >
                      Enable All
                    </button>
                    <button
                      onClick={() => setConfirmAll({ feature: f, action: 'disable' })}
                      disabled={busy}
                      className="flex-1 text-xs py-1.5 px-2 rounded bg-red-50 text-red-600 hover:bg-red-100 font-medium disabled:opacity-50 transition-colors"
                    >
                      Disable All
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Inline alert */}
        {alert && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
              alert.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : alert.type === 'warning'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {alert.type === 'success' ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {alert.message}
            <button onClick={() => setAlert(null)} className="ml-auto">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by org id, owner name, or email"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All organizations</option>
              <optgroup label="Enabled for">
                {features.map((f) => (
                  <option key={`e-${f.id}`} value={`enabled:${f.feature_key}`}>{f.name} — enabled</option>
                ))}
              </optgroup>
              <optgroup label="Not enabled for">
                {features.map((f) => (
                  <option key={`d-${f.id}`} value={`disabled:${f.feature_key}`}>{f.name} — not enabled</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Manage Features modal — list with add / edit / delete */}
        {showManager && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Manage Features</h3>
                  <p className="text-xs text-gray-400">
                    Add, rename, or archive Monitor addon features. feature_key is permanent.
                  </p>
                </div>
                <button onClick={() => setShowManager(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-3 border-b border-gray-200 flex justify-end">
                <button
                  onClick={openCreateForm}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                  Add Feature
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {features.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-400 text-sm">
                    No features yet. Click "Add Feature" to create one.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {features.map((f) => (
                      <li key={f.id} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                            <code className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">
                              {f.feature_key}
                            </code>
                            {f.default_enabled ? (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                                default on
                              </span>
                            ) : null}
                          </div>
                          {f.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{f.description}</p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-1">sort #{f.sort_order ?? 0}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => openEditForm(f)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDelete(f)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowManager(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit form modal (layered above the manager) */}
        {form && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {form.mode === 'create' ? 'Add Feature' : 'Edit Feature'}
                </h3>
                <button onClick={() => setForm(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    feature_key
                    {form.mode === 'edit' && (
                      <span className="ml-2 text-[11px] text-gray-400">(immutable)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={form.values.feature_key}
                    disabled={form.mode === 'edit'}
                    onChange={(e) =>
                      setForm({ ...form, values: { ...form.values, feature_key: e.target.value } })
                    }
                    placeholder="snake_case_key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono disabled:bg-gray-50 disabled:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    1–64 chars: lowercase letter first, then a–z / 0–9 / _.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Display name</label>
                  <input
                    type="text"
                    value={form.values.name}
                    onChange={(e) => setForm({ ...form, values: { ...form.values, name: e.target.value } })}
                    placeholder="e.g. Live Monitoring"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea
                    value={form.values.description || ''}
                    onChange={(e) =>
                      setForm({ ...form, values: { ...form.values, description: e.target.value } })
                    }
                    rows={2}
                    placeholder="Short description shown on the feature card"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Sort order</label>
                    <input
                      type="number"
                      value={form.values.sort_order ?? 0}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          values: { ...form.values, sort_order: Number(e.target.value) || 0 },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <label className="flex items-center gap-2 mt-5 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.values.default_enabled}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          values: { ...form.values, default_enabled: e.target.checked },
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Default on
                  </label>
                </div>

                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                    {formError}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setForm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={submitForm}
                  disabled={busy}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {busy ? 'Saving…' : form.mode === 'create' ? 'Create' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete feature confirm */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Archive feature</h3>
                  <p className="text-xs text-gray-400">
                    Existing org toggles are preserved and will reactivate if you restore the key later.
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Archive <strong>{confirmDelete.name}</strong> (<code className="font-mono text-xs">{confirmDelete.feature_key}</code>)?
                It will disappear from this page.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => doDeleteFeature(confirmDelete)}
                  disabled={busy}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {busy ? 'Archiving…' : 'Archive'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Single-cell disable confirm */}
        {confirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Disable feature</h3>
                  <p className="text-xs text-gray-400">This affects only the selected organization.</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Disable <strong>{confirm.feature.name}</strong> for organization{' '}
                <strong>#{confirm.org.id}{confirm.org.owner_name ? ` (${confirm.org.owner_name})` : ''}</strong>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => doToggle(confirm.org.id, confirm.feature.feature_key, false)}
                  disabled={busy}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {busy ? 'Disabling…' : 'Disable'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk confirm */}
        {confirmAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    confirmAll.action === 'enable' ? 'bg-blue-50' : 'bg-red-50'
                  }`}
                >
                  <AlertTriangle
                    className={`h-5 w-5 ${
                      confirmAll.action === 'enable' ? 'text-blue-600' : 'text-red-600'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {confirmAll.action === 'enable' ? 'Enable for all organizations' : 'Disable for all organizations'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    This applies to every organization, including any added later until you change it.
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to <strong>{confirmAll.action}</strong>{' '}
                <strong>{confirmAll.feature.name}</strong> for <strong>all organizations</strong>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmAll(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => doToggleAll(confirmAll.feature.feature_key, confirmAll.action === 'enable')}
                  disabled={busy}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
                    confirmAll.action === 'enable' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {busy
                    ? confirmAll.action === 'enable'
                      ? 'Enabling…'
                      : 'Disabling…'
                    : confirmAll.action === 'enable'
                    ? 'Enable for all'
                    : 'Disable for all'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3 sticky left-0 z-20 bg-gray-50 min-w-[260px] shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                  Organization
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3 min-w-[120px]">
                  Seats
                </th>
                {features.map((f) => (
                  <th
                    key={f.id}
                    className="text-center text-xs font-medium text-gray-500 uppercase px-3 py-3 min-w-[110px]"
                    title={f.description || undefined}
                  >
                    {f.name}
                  </th>
                ))}
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">Enabled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={3 + features.length} className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3 + features.length} className="px-6 py-12 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : pagedOrgs.length === 0 ? (
                <tr>
                  <td colSpan={3 + features.length} className="px-6 py-12 text-center text-gray-400">
                    No organizations match the current filters.
                  </td>
                </tr>
              ) : (
                pagedOrgs.map((org) => {
                  const enabledCount = (org.features || []).filter((x) => x.enabled).length
                  return (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 sticky left-0 z-10 bg-white shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 flex-shrink-0">
                            {String(org.id).slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {org.owner_name || `Org #${org.id}`}
                              <span className="ml-2 text-xs text-gray-400">#{org.id}</span>
                            </p>
                            <p className="text-xs text-gray-400 truncate">{org.owner_email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {org.current_user_count || 0}/{org.total_allowed_user_count || 0}
                      </td>
                      {features.map((f) => {
                        const enabled = isOrgFeatureEnabled(org, f.id)
                        return (
                          <td key={f.id} className="px-3 py-3 text-center">
                            <button
                              onClick={() => handleToggle(org, f, enabled)}
                              disabled={busy}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                                enabled ? 'bg-blue-600' : 'bg-gray-200 hover:bg-gray-300'
                              }`}
                              aria-pressed={enabled}
                              aria-label={`${f.name} for organization ${org.id}`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                                  enabled ? 'translate-x-4' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </td>
                        )
                      })}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            enabledCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {enabledCount}/{features.length}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, totalOrgs)} of {totalOrgs}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-white"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddonFeaturesPage
