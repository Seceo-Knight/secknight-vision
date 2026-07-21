'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const AddonFeaturesModel = require('./addonFeatures.model');
const { sendResponse } = require('../../../utils/myService');

class AddonFeaturesController {
    async listFeatures(req, res) {
        try {
            const rows = await AddonFeaturesModel.listFeatures();
            return sendResponse(res, 200, rows, 'Fetched', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Failed to fetch addon features', err.message || err);
        }
    }

    /**
     * Returns one row per organization, each carrying a `features` array
     * with `{ feature_id, enabled }` entries. Orgs that have never been
     * toggled still appear, just with an empty features array — the UI
     * treats missing rows as "disabled" (falls back to feature default).
     */
    async listOrganizations(req, res) {
        try {
            const rows = await AddonFeaturesModel.listOrganizationsWithFeatures();
            const byOrg = new Map();

            for (const row of rows) {
                let org = byOrg.get(row.organization_id);
                if (!org) {
                    const firstName = row.owner_first_name || '';
                    const lastName = row.owner_last_name || '';
                    org = {
                        id: row.organization_id,
                        owner_user_id: row.owner_user_id,
                        owner_name: `${firstName} ${lastName}`.trim(),
                        owner_email: row.owner_email || row.owner_a_email || null,
                        current_user_count: row.current_user_count,
                        total_allowed_user_count: row.total_allowed_user_count,
                        features: [],
                    };
                    byOrg.set(row.organization_id, org);
                }
                if (row.feature_id != null) {
                    org.features.push({
                        feature_id: row.feature_id,
                        enabled: row.enabled === 1 || row.enabled === true,
                    });
                }
            }

            return sendResponse(res, 200, Array.from(byOrg.values()), 'Fetched', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Failed to fetch organizations', err.message || err);
        }
    }

    async toggle(req, res) {
        try {
            const { organization_id, feature_key, enabled } = req.body || {};
            if (!organization_id || !feature_key || typeof enabled !== 'boolean') {
                return sendResponse(res, 400, null, 'organization_id, feature_key and enabled are required', null);
            }

            const [feature] = await AddonFeaturesModel.findFeatureByKey(feature_key);
            if (!feature) {
                return sendResponse(res, 404, null, `Unknown feature_key: ${feature_key}`, null);
            }

            await AddonFeaturesModel.upsertOrgFeature({
                organization_id: Number(organization_id),
                feature_id: feature.id,
                enabled,
                updated_by_user_id: req.decoded && req.decoded.user_id,
            });

            return sendResponse(res, 200, {
                organization_id: Number(organization_id),
                feature_id: feature.id,
                feature_key,
                enabled,
            }, 'Updated', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Failed to update addon feature', err.message || err);
        }
    }

    async createFeature(req, res) {
        try {
            const { feature_key, name, description, default_enabled, sort_order } = req.body || {};
            const key = typeof feature_key === 'string' ? feature_key.trim() : '';
            const displayName = typeof name === 'string' ? name.trim() : '';

            if (!key || !displayName) {
                return sendResponse(res, 400, null, 'feature_key and name are required', null);
            }
            if (!/^[a-z][a-z0-9_]{0,63}$/.test(key)) {
                return sendResponse(res, 400, null,
                    'feature_key must be snake_case, start with a letter, and be 1–64 chars (a-z, 0-9, _)', null);
            }

            // Reject duplicates AND surface archived rows with the same key so the
            // operator knows to restore instead of creating a parallel entry.
            const [existing] = await AddonFeaturesModel.findAnyByKey(key);
            if (existing) {
                if (existing.status === 0) {
                    return sendResponse(res, 409, { archived_feature_id: existing.id },
                        `A feature with key "${key}" already exists but is archived. Restore it instead of creating a new one.`,
                        null);
                }
                return sendResponse(res, 409, null, `Feature key "${key}" already exists`, null);
            }

            const result = await AddonFeaturesModel.createFeature({
                feature_key: key,
                name: displayName,
                description,
                default_enabled,
                sort_order,
            });

            return sendResponse(res, 201, {
                id: result && result.insertId,
                feature_key: key,
                name: displayName,
            }, 'Feature created', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Failed to create feature', err.message || err);
        }
    }

    async updateFeature(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isFinite(id) || id <= 0) {
                return sendResponse(res, 400, null, 'Invalid feature id', null);
            }
            const [feature] = await AddonFeaturesModel.findFeatureById(id);
            if (!feature) return sendResponse(res, 404, null, 'Feature not found', null);

            const { name, description, default_enabled, sort_order, status } = req.body || {};
            const patch = {};
            if (name !== undefined) {
                const trimmed = typeof name === 'string' ? name.trim() : '';
                if (!trimmed) return sendResponse(res, 400, null, 'name cannot be empty', null);
                patch.name = trimmed;
            }
            if (description !== undefined) patch.description = description;
            if (default_enabled !== undefined) patch.default_enabled = !!default_enabled;
            if (sort_order !== undefined) patch.sort_order = sort_order;
            if (status !== undefined) patch.status = !!status;

            await AddonFeaturesModel.updateFeature(id, patch);
            const [updated] = await AddonFeaturesModel.findFeatureById(id);
            return sendResponse(res, 200, updated, 'Feature updated', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Failed to update feature', err.message || err);
        }
    }

    async deleteFeature(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isFinite(id) || id <= 0) {
                return sendResponse(res, 400, null, 'Invalid feature id', null);
            }
            const [feature] = await AddonFeaturesModel.findFeatureById(id);
            if (!feature) return sendResponse(res, 404, null, 'Feature not found', null);

            await AddonFeaturesModel.softDeleteFeature(id);
            return sendResponse(res, 200, { id, archived: true }, 'Feature archived', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Failed to delete feature', err.message || err);
        }
    }

    async toggleAll(req, res) {
        try {
            const { feature_key, enabled } = req.body || {};
            if (!feature_key || typeof enabled !== 'boolean') {
                return sendResponse(res, 400, null, 'feature_key and enabled are required', null);
            }

            const [feature] = await AddonFeaturesModel.findFeatureByKey(feature_key);
            if (!feature) {
                return sendResponse(res, 404, null, `Unknown feature_key: ${feature_key}`, null);
            }

            const result = await AddonFeaturesModel.upsertFeatureForAllOrgs({
                feature_id: feature.id,
                enabled,
                updated_by_user_id: req.decoded && req.decoded.user_id,
            });

            return sendResponse(res, 200, {
                feature_id: feature.id,
                feature_key,
                enabled,
                affected: result && (result.affectedRows != null ? result.affectedRows : null),
            }, 'Updated for all organizations', null);
        } catch (err) {
            return sendResponse(res, 400, null, 'Failed to bulk update addon feature', err.message || err);
        }
    }
}

module.exports = new AddonFeaturesController();
