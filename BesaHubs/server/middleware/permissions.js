const { checkPermission } = require('../services/permissionService');
const { UnauthorizedError, ForbiddenError } = require('../utils/AppError');

const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const hasPermission = await checkPermission(req.user.id, resource, action);
      
      if (hasPermission) {
        return next();
      }

      const roleBasedPermissions = {
        admin: () => true,
        manager: () => {
          const restrictedActions = [
            'settings:update',
            'settings:delete',
            'users:delete'
          ];
          const currentAction = `${resource}:${action}`;
          return !restrictedActions.includes(currentAction);
        },
        agent: () => {
          const allowedActions = [
            'properties:create', 'properties:read', 'properties:update', 'properties:list',
            'contacts:create', 'contacts:read', 'contacts:update', 'contacts:list',
            'deals:create', 'deals:read', 'deals:update', 'deals:list',
            'tasks:create', 'tasks:read', 'tasks:update', 'tasks:list',
            'documents:create', 'documents:read', 'documents:list',
            'communications:create', 'communications:read', 'communications:list',
            'reports:read', 'reports:list',
            'analytics:read'
          ];
          const currentAction = `${resource}:${action}`;
          return allowedActions.includes(currentAction);
        },
        assistant: () => {
          return ['read', 'list'].includes(action);
        }
      };

      if (req.user.role && roleBasedPermissions[req.user.role]) {
        const hasRoleBasedPermission = roleBasedPermissions[req.user.role]();
        if (hasRoleBasedPermission) {
          return next();
        }
      }

      throw new ForbiddenError(`Insufficient permissions for ${action} on ${resource}`);
    } catch (error) {
      next(error);
    }
  };
};

const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      for (const permission of permissions) {
        const [resource, action] = permission.split(':');
        const hasPermission = await checkPermission(req.user.id, resource, action);
        
        if (hasPermission) {
          return next();
        }
      }

      if (req.user.role === 'admin') {
        return next();
      }

      throw new ForbiddenError('Insufficient permissions for this action');
    } catch (error) {
      next(error);
    }
  };
};

const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      for (const permission of permissions) {
        const [resource, action] = permission.split(':');
        const hasPermission = await checkPermission(req.user.id, resource, action);
        
        if (!hasPermission && req.user.role !== 'admin') {
          throw new ForbiddenError(`Insufficient permissions for this action (missing ${permission})`);
        }
      }

      return next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions
};
