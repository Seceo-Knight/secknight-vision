'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const { BaseModel } = require('../../../models/BaseModel');

class AddonFeaturesModel extends BaseModel {
    static get TABLE_NAME() {
        return 'addon_features';
    }

    /**
     * Active features, ordered for stable column ordering in the UI.
     */
    static listFeatures() {
        const query = `
            SELECT id, feature_key, name, description, default_enabled, sort_order
            FROM addon_features
            WHERE status = 1
            ORDER BY sort_order ASC, id ASC
        `;
        return this.query(query);
    }

    static findFeatureByKey(featureKey) {
        const query = `
            SELECT id, feature_key, name, default_enabled
            FROM addon_features
            WHERE feature_key = ? AND status = 1
            LIMIT 1
        `;
        return this.query(query, [featureKey]);
    }

    static findFeatureById(id) {
        const query = `
            SELECT id, feature_key, name, description, default_enabled, sort_order, status
            FROM addon_features
            WHERE id = ?
            LIMIT 1
        `;
        return this.query(query, [id]);
    }

    /**
     * Look up any feature row (including soft-deleted) sharing this key,
     * so we can either reject the create or restore the archived row.
     */
    static findAnyByKey(featureKey) {
        const query = `
            SELECT id, feature_key, name, status
            FROM addon_features
            WHERE feature_key = ?
            LIMIT 1
        `;
        return this.query(query, [featureKey]);
    }

    static createFeature({ feature_key, name, description, default_enabled, sort_order }) {
        const query = `
            INSERT INTO addon_features
                (feature_key, name, description, default_enabled, sort_order, status)
            VALUES (?, ?, ?, ?, ?, 1)
        `;
        return this.query(query, [
            feature_key,
            name,
            description || null,
            default_enabled ? 1 : 0,
            Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0,
        ]);
    }

    /**
     * Partial update — only fields present in `fields` are touched.
     * Note: feature_key is intentionally NOT updatable (downstream code
     * may reference it). To rename, create a new feature and archive the
     * old one.
     */
    static updateFeature(id, fields) {
        const allowed = ['name', 'description', 'default_enabled', 'sort_order', 'status'];
        const sets = [];
        const params = [];
        for (const key of allowed) {
            if (fields[key] === undefined) continue;
            let value = fields[key];
            if (key === 'default_enabled' || key === 'status') value = value ? 1 : 0;
            if (key === 'sort_order') value = Number.isFinite(Number(value)) ? Number(value) : 0;
            sets.push(`${key} = ?`);
            params.push(value);
        }
        if (sets.length === 0) return Promise.resolve({ affectedRows: 0 });
        params.push(id);
        const query = `UPDATE addon_features SET ${sets.join(', ')} WHERE id = ?`;
        return this.query(query, params);
    }

    static softDeleteFeature(id) {
        const query = `UPDATE addon_features SET status = 0 WHERE id = ?`;
        return this.query(query, [id]);
    }

    /**
     * Organizations enriched with the owner's name/email (for display) and
     * the full set of feature toggles. Left joins so an org without any
     * row in organization_addon_features still appears.
     */
    static listOrganizationsWithFeatures() {
        const query = `
            SELECT
                o.id                       AS organization_id,
                o.user_id                  AS owner_user_id,
                o.current_user_count       AS current_user_count,
                o.total_allowed_user_count AS total_allowed_user_count,
                u.first_name               AS owner_first_name,
                u.last_name                AS owner_last_name,
                u.email                    AS owner_email,
                u.a_email                  AS owner_a_email,
                oaf.feature_id             AS feature_id,
                oaf.enabled                AS enabled
            FROM organizations o
            LEFT JOIN users u
              ON u.id = o.user_id
            LEFT JOIN organization_addon_features oaf
              ON oaf.organization_id = o.id
            ORDER BY o.id ASC
        `;
        return this.query(query);
    }

    /**
     * Upsert a single (org, feature) toggle. Uses ON DUPLICATE KEY UPDATE
     * against the org_feature_unique index.
     */
    static upsertOrgFeature({ organization_id, feature_id, enabled, updated_by_user_id }) {
        const query = `
            INSERT INTO organization_addon_features
                (organization_id, feature_id, enabled, updated_by_user_id)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                enabled = VALUES(enabled),
                updated_by_user_id = VALUES(updated_by_user_id)
        `;
        return this.query(query, [organization_id, feature_id, enabled ? 1 : 0, updated_by_user_id || null]);
    }

    /**
     * Bulk upsert one feature across every organization. We pick the org
     * list from `organizations` so newly created orgs are covered too.
     */
    static async upsertFeatureForAllOrgs({ feature_id, enabled, updated_by_user_id }) {
        const query = `
            INSERT INTO organization_addon_features
                (organization_id, feature_id, enabled, updated_by_user_id)
            SELECT o.id, ?, ?, ?
            FROM organizations o
            ON DUPLICATE KEY UPDATE
                enabled = VALUES(enabled),
                updated_by_user_id = VALUES(updated_by_user_id)
        `;
        return this.query(query, [feature_id, enabled ? 1 : 0, updated_by_user_id || null]);
    }
}

module.exports = AddonFeaturesModel;
