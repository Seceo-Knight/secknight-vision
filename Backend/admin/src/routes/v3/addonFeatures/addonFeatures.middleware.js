'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

/**
 * Access gate for addon feature management:
 *   - any platform super admin (req.decoded.is_admin === true), OR
 *   - any user whose organization_id matches ADDON_SUPERADMIN_ORG_ID in env.
 *
 * The env value is read at request time (not module load) so it can be
 * rotated without a process restart.
 */
function requireSuperOrOperator(req, res, next) {
    const decoded = req.decoded || {};
    const operatorOrgIdRaw = process.env.ADDON_SUPERADMIN_ORG_ID;
    const operatorOrgId = operatorOrgIdRaw != null && operatorOrgIdRaw !== ''
        ? Number(operatorOrgIdRaw)
        : null;

    const isSuper = decoded.is_admin === true;
    const isOperator =
        operatorOrgId !== null &&
        Number.isFinite(operatorOrgId) &&
        Number(decoded.organization_id) === operatorOrgId;

    if (isSuper || isOperator) return next();

    return res.status(403).json({
        code: 403,
        error: 'Forbidden',
        message: 'You are not allowed to manage addon features.',
        data: null,
    });
}

module.exports = { requireSuperOrOperator };
