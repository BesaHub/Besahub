const { Role, Permission, RolePermission } = require('../models');

const resources = [
  'users',
  'teams',
  'properties',
  'contacts',
  'deals',
  'documents',
  'tasks',
  'reports',
  'analytics',
  'communications',
  'imports',
  'settings'
];

const actions = ['create', 'read', 'update', 'delete', 'list'];

const roleDefinitions = {
  admin: {
    name: 'admin',
    description: 'Administrator with full system access',
    isSystem: true,
    permissions: 'all'
  },
  manager: {
    name: 'manager',
    description: 'Manager with most permissions except system configuration',
    isSystem: true,
    permissions: {
      exclude: [
        { resource: 'settings', action: 'update' },
        { resource: 'settings', action: 'delete' },
        { resource: 'users', action: 'delete' }
      ]
    }
  },
  agent: {
    name: 'agent',
    description: 'Agent with standard permissions',
    isSystem: true,
    permissions: {
      include: [
        { resource: 'properties', action: 'create' },
        { resource: 'properties', action: 'read' },
        { resource: 'properties', action: 'update' },
        { resource: 'properties', action: 'list' },
        { resource: 'contacts', action: 'create' },
        { resource: 'contacts', action: 'read' },
        { resource: 'contacts', action: 'update' },
        { resource: 'contacts', action: 'list' },
        { resource: 'deals', action: 'create' },
        { resource: 'deals', action: 'read' },
        { resource: 'deals', action: 'update' },
        { resource: 'deals', action: 'list' },
        { resource: 'tasks', action: 'create' },
        { resource: 'tasks', action: 'read' },
        { resource: 'tasks', action: 'update' },
        { resource: 'tasks', action: 'list' },
        { resource: 'documents', action: 'create' },
        { resource: 'documents', action: 'read' },
        { resource: 'documents', action: 'list' },
        { resource: 'communications', action: 'create' },
        { resource: 'communications', action: 'read' },
        { resource: 'communications', action: 'list' },
        { resource: 'reports', action: 'read' },
        { resource: 'reports', action: 'list' },
        { resource: 'analytics', action: 'read' }
      ]
    }
  },
  assistant: {
    name: 'assistant',
    description: 'Assistant with read-only permissions',
    isSystem: true,
    permissions: {
      include: resources.flatMap(resource => [
        { resource, action: 'read' },
        { resource, action: 'list' }
      ])
    }
  }
};

async function seedPermissions() {
  try {
    console.log('🌱 Starting permissions seeder...');

    const allPermissions = [];
    for (const resource of resources) {
      for (const action of actions) {
        allPermissions.push({
          resource,
          action,
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`
        });
      }
    }

    console.log('📝 Creating permissions...');
    const createdPermissions = await Permission.bulkCreate(allPermissions, {
      ignoreDuplicates: true,
      validate: true
    });
    console.log(`✅ Created ${createdPermissions.length} permissions`);

    const allPerms = await Permission.findAll();
    const permissionMap = {};
    allPerms.forEach(perm => {
      const key = `${perm.resource}:${perm.action}`;
      permissionMap[key] = perm.id;
    });

    console.log('👥 Creating roles...');
    for (const [roleName, roleDef] of Object.entries(roleDefinitions)) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleDef.name },
        defaults: {
          description: roleDef.description,
          isSystem: roleDef.isSystem
        }
      });

      if (created) {
        console.log(`✅ Created role: ${roleName}`);
      } else {
        console.log(`ℹ️  Role already exists: ${roleName}`);
      }

      await RolePermission.destroy({ where: { roleId: role.id } });

      let permissionIds = [];

      if (roleDef.permissions === 'all') {
        permissionIds = Object.values(permissionMap);
      } else if (roleDef.permissions.include) {
        permissionIds = roleDef.permissions.include.map(
          p => permissionMap[`${p.resource}:${p.action}`]
        ).filter(Boolean);
      } else if (roleDef.permissions.exclude) {
        const excludeKeys = roleDef.permissions.exclude.map(
          p => `${p.resource}:${p.action}`
        );
        permissionIds = Object.entries(permissionMap)
          .filter(([key]) => !excludeKeys.includes(key))
          .map(([, id]) => id);
      }

      const rolePermissions = permissionIds.map(permissionId => ({
        roleId: role.id,
        permissionId
      }));

      if (rolePermissions.length > 0) {
        await RolePermission.bulkCreate(rolePermissions, {
          ignoreDuplicates: true
        });
        console.log(`✅ Assigned ${rolePermissions.length} permissions to ${roleName}`);
      }
    }

    console.log('🎉 Permissions seeding completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  }
}

module.exports = { seedPermissions };
