import apiService from '@/services/api.service'

const api = apiService.apiInstance

export const fetchAddonFeatures = () =>
  api.get('/addon-features').then(r => r.data?.data || [])

export const fetchOrganizationsWithFeatures = () =>
  api.get('/addon-features/organizations').then(r => r.data?.data || [])

export const toggleOrgFeature = ({ organization_id, feature_key, enabled }) =>
  api.post('/addon-features/toggle', { organization_id, feature_key, enabled })
     .then(r => r.data?.data)

export const toggleAllOrgsFeature = ({ feature_key, enabled }) =>
  api.post('/addon-features/toggle-all', { feature_key, enabled })
     .then(r => r.data?.data)

// Feature CRUD (super-admin-only is enforced server-side by the route middleware)
export const createFeature = (data) =>
  api.post('/addon-features', data).then(r => r.data)

export const updateFeature = (id, data) =>
  api.put(`/addon-features/${id}`, data).then(r => r.data)

export const deleteFeature = (id) =>
  api.delete(`/addon-features/${id}`).then(r => r.data)
