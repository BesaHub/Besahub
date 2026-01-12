const { User, Role, Permission, RolePermission, UserRole, Team, TeamMembership } = require('../models');

const permissionCache = new Map();
const CACHE_TTL = 300000;

async function getUserPermissions(userId) {
  const cacheKey = `user_permissions_${userId}`;
  const cached = permissionCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }

  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'roles',
          include: [
            {
              model: Permission,
              as: 'permissions',
              through: { attributes: [] }
            }
          ],
          through: { attributes: [] }
        }
      ]
    });

    if (!user) {
      return [];
    }

    const permissionsSet = new Set();
    
    if (user.roles && user.roles.length > 0) {
      user.roles.forEach(role => {
        if (role.permissions) {
          role.permissions.forEach(permission => {
            permissionsSet.add(`${permission.resource}:${permission.action}`);
          });
        }
      });
    }

    const permissions = Array.from(permissionsSet);
    
    permissionCache.set(cacheKey, {
      permissions,
      timestamp: Date.now()
    });

    return permissions;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

async function checkPermission(userId, resource, action) {
  try {
    const permissions = await getUserPermissions(userId);
    const requiredPermission = `${resource}:${action}`;
    return permissions.includes(requiredPermission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

async function assignRoleToUser(userId, roleId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    const [userRole, created] = await UserRole.findOrCreate({
      where: { userId, roleId }
    });

    clearUserPermissionCache(userId);

    return { userRole, created };
  } catch (error) {
    console.error('Error assigning role to user:', error);
    throw error;
  }
}

async function removeRoleFromUser(userId, roleId) {
  try {
    const deleted = await UserRole.destroy({
      where: { userId, roleId }
    });

    clearUserPermissionCache(userId);

    return deleted > 0;
  } catch (error) {
    console.error('Error removing role from user:', error);
    throw error;
  }
}

async function assignUserToTeam(userId, teamId, isLead = false) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const [membership, created] = await TeamMembership.findOrCreate({
      where: { userId, teamId },
      defaults: { isLead }
    });

    if (!created && membership.isLead !== isLead) {
      membership.isLead = isLead;
      await membership.save();
    }

    return { membership, created };
  } catch (error) {
    console.error('Error assigning user to team:', error);
    throw error;
  }
}

async function removeUserFromTeam(userId, teamId) {
  try {
    const deleted = await TeamMembership.destroy({
      where: { userId, teamId }
    });

    return deleted > 0;
  } catch (error) {
    console.error('Error removing user from team:', error);
    throw error;
  }
}

async function getUserRoles(userId) {
  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] }
        }
      ]
    });

    return user ? user.roles : [];
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
}

async function getUserTeams(userId) {
  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Team,
          as: 'teams',
          through: { attributes: ['isLead', 'joinedAt'] }
        }
      ]
    });

    return user ? user.teams : [];
  } catch (error) {
    console.error('Error getting user teams:', error);
    return [];
  }
}

async function assignPermissionToRole(roleId, permissionId) {
  try {
    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      throw new Error('Permission not found');
    }

    const [rolePermission, created] = await RolePermission.findOrCreate({
      where: { roleId, permissionId }
    });

    clearRolePermissionCache(roleId);

    return { rolePermission, created };
  } catch (error) {
    console.error('Error assigning permission to role:', error);
    throw error;
  }
}

async function removePermissionFromRole(roleId, permissionId) {
  try {
    const deleted = await RolePermission.destroy({
      where: { roleId, permissionId }
    });

    clearRolePermissionCache(roleId);

    return deleted > 0;
  } catch (error) {
    console.error('Error removing permission from role:', error);
    throw error;
  }
}

function clearUserPermissionCache(userId) {
  const cacheKey = `user_permissions_${userId}`;
  permissionCache.delete(cacheKey);
}

function clearRolePermissionCache(roleId) {
  for (const [key] of permissionCache.entries()) {
    if (key.includes('user_permissions_')) {
      permissionCache.delete(key);
    }
  }
}

function clearAllPermissionCache() {
  permissionCache.clear();
}

module.exports = {
  getUserPermissions,
  checkPermission,
  assignRoleToUser,
  removeRoleFromUser,
  assignUserToTeam,
  removeUserFromTeam,
  getUserRoles,
  getUserTeams,
  assignPermissionToRole,
  removePermissionFromRole,
  clearUserPermissionCache,
  clearRolePermissionCache,
  clearAllPermissionCache
};
