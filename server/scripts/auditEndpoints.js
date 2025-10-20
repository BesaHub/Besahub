const express = require('express');
const path = require('path');
const fs = require('fs');
const { appLogger } = require('../config/logger');

const analyzeRoutes = () => {
  const app = express();
  
  const routeFiles = [
    { name: 'auth', path: '../routes/auth' },
    { name: 'mfa', path: '../routes/mfa' },
    { name: 'users', path: '../routes/users' },
    { name: 'properties', path: '../routes/properties' },
    { name: 'contacts', path: '../routes/contacts' },
    { name: 'companies', path: '../routes/companies' },
    { name: 'deals', path: '../routes/deals' },
    { name: 'tasks', path: '../routes/tasks' },
    { name: 'documents', path: '../routes/documents' },
    { name: 'reports', path: '../routes/reports' },
    { name: 'integrations', path: '../routes/integrations' },
    { name: 'dashboard', path: '../routes/dashboard' },
    { name: 'admin', path: '../routes/admin' },
    { name: 'listings', path: '../routes/listings' },
    { name: 'investors', path: '../routes/investors' },
    { name: 'marketData', path: '../routes/marketData' },
    { name: 'upload', path: '../routes/upload' },
    { name: 'notifications', path: '../routes/notifications' },
    { name: 'communications', path: '../routes/communications' },
    { name: 'import', path: '../routes/import' },
    { name: 'leases', path: '../routes/leases' },
    { name: 'debt', path: '../routes/debt' },
    { name: 'triggers', path: '../routes/triggers' },
    { name: 'entities', path: '../routes/entities' },
    { name: 'propertyOwnerships', path: '../routes/propertyOwnerships' },
    { name: 'entityRelationships', path: '../routes/entityRelationships' },
    { name: 'ownershipGraph', path: '../routes/ownershipGraph' },
    { name: 'cohorts', path: '../routes/cohorts' },
    { name: 'campaigns', path: '../routes/campaigns' },
    { name: 'campaignTemplates', path: '../routes/campaignTemplates' },
    { name: 'marketAnalysis', path: '../routes/marketAnalysis' },
    { name: 'propertyAlerts', path: '../routes/propertyAlerts' },
    { name: 'propertyMatching', path: '../routes/propertyMatching' }
  ];

  const publicRoutes = [];
  const authOnlyRoutes = [];
  const protectedRoutes = [];
  const errors = [];

  console.log('\n' + '='.repeat(80));
  console.log('🔒 RBAC ENDPOINT SECURITY AUDIT');
  console.log('='.repeat(80) + '\n');

  routeFiles.forEach(({ name, path: routePath }) => {
    try {
      const router = require(routePath);
      const prefix = `/api/${name}`;
      
      analyzeRouter(router, prefix, name, publicRoutes, authOnlyRoutes, protectedRoutes);
    } catch (error) {
      errors.push({ route: name, error: error.message });
    }
  });

  printResults(publicRoutes, authOnlyRoutes, protectedRoutes, errors);
  
  return {
    publicRoutes,
    authOnlyRoutes,
    protectedRoutes,
    errors,
    summary: {
      total: publicRoutes.length + authOnlyRoutes.length + protectedRoutes.length,
      public: publicRoutes.length,
      authOnly: authOnlyRoutes.length,
      protected: protectedRoutes.length,
      errors: errors.length
    }
  };
};

const analyzeRouter = (router, prefix, routerName, publicRoutes, authOnlyRoutes, protectedRoutes) => {
  if (!router || !router.stack) return;

  router.stack.forEach((layer) => {
    if (layer.route) {
      const route = layer.route;
      const methods = Object.keys(route.methods).map(m => m.toUpperCase());
      const fullPath = prefix + route.path;
      
      const hasAuth = hasAuthMiddleware(route);
      const hasPermission = hasPermissionMiddleware(route);
      const hasAdminOnly = hasAdminOnlyMiddleware(route);
      
      const routeInfo = {
        path: fullPath,
        methods: methods.join(', '),
        router: routerName,
        middleware: []
      };

      if (hasAuth) {
        routeInfo.middleware.push('auth');
      }
      if (hasPermission) {
        routeInfo.middleware.push('permission');
      }
      if (hasAdminOnly) {
        routeInfo.middleware.push('adminOnly');
      }

      if (!hasAuth && !hasPermission && !hasAdminOnly) {
        publicRoutes.push(routeInfo);
      } else if (hasAuth && !hasPermission && !hasAdminOnly) {
        authOnlyRoutes.push(routeInfo);
      } else {
        protectedRoutes.push(routeInfo);
      }
    } else if (layer.name === 'router' && layer.handle.stack) {
      analyzeRouter(layer.handle, prefix, routerName, publicRoutes, authOnlyRoutes, protectedRoutes);
    }
  });
};

const hasAuthMiddleware = (route) => {
  return route.stack.some(layer => 
    layer.name === 'authMiddleware' || 
    (layer.handle && layer.handle.name === 'authMiddleware')
  );
};

const hasPermissionMiddleware = (route) => {
  return route.stack.some(layer => 
    layer.name === 'permissionMiddleware' || 
    (layer.handle && layer.handle.name === 'permissionMiddleware') ||
    layer.name === 'bound permissionMiddleware'
  );
};

const hasAdminOnlyMiddleware = (route) => {
  return route.stack.some(layer => 
    layer.name === 'adminOnly' || 
    layer.name === 'adminMiddleware' ||
    (layer.handle && (layer.handle.name === 'adminOnly' || layer.handle.name === 'adminMiddleware'))
  );
};

const printResults = (publicRoutes, authOnlyRoutes, protectedRoutes, errors) => {
  console.log('📊 AUDIT SUMMARY');
  console.log('-'.repeat(80));
  console.log(`Total Routes Analyzed: ${publicRoutes.length + authOnlyRoutes.length + protectedRoutes.length}`);
  console.log(`Public Routes (No Auth): ${publicRoutes.length}`);
  console.log(`Auth-Only Routes (Missing Permissions): ${authOnlyRoutes.length}`);
  console.log(`Protected Routes (Proper RBAC): ${protectedRoutes.length}`);
  console.log(`Errors: ${errors.length}\n`);

  if (publicRoutes.length > 0) {
    console.log('🌐 PUBLIC ROUTES (No Authentication Required)');
    console.log('-'.repeat(80));
    publicRoutes.forEach(route => {
      console.log(`  ${route.methods.padEnd(10)} ${route.path}`);
      console.log(`    Router: ${route.router}`);
    });
    console.log();
  }

  if (authOnlyRoutes.length > 0) {
    console.log('⚠️  AUTH-ONLY ROUTES (Missing Permission Checks - SECURITY GAP)');
    console.log('-'.repeat(80));
    authOnlyRoutes.forEach(route => {
      console.log(`  ${route.methods.padEnd(10)} ${route.path}`);
      console.log(`    Router: ${route.router}`);
      console.log(`    Middleware: ${route.middleware.join(', ')}`);
      console.log(`    ⚠️  RECOMMENDATION: Add permission middleware`);
    });
    console.log();
  }

  if (protectedRoutes.length > 0) {
    console.log('✅ PROTECTED ROUTES (Proper RBAC Enforcement)');
    console.log('-'.repeat(80));
    console.log(`  Total: ${protectedRoutes.length} routes`);
    console.log(`  Sample routes:`);
    protectedRoutes.slice(0, 10).forEach(route => {
      console.log(`    ${route.methods.padEnd(10)} ${route.path}`);
      console.log(`      Middleware: ${route.middleware.join(', ')}`);
    });
    if (protectedRoutes.length > 10) {
      console.log(`    ... and ${protectedRoutes.length - 10} more`);
    }
    console.log();
  }

  if (errors.length > 0) {
    console.log('❌ ERRORS');
    console.log('-'.repeat(80));
    errors.forEach(error => {
      console.log(`  Route: ${error.route}`);
      console.log(`  Error: ${error.error}\n`);
    });
  }

  console.log('='.repeat(80));
  console.log('🔐 SECURITY RECOMMENDATIONS');
  console.log('='.repeat(80));
  
  if (authOnlyRoutes.length > 0) {
    console.log('⚠️  CRITICAL: Found routes with authentication but no permission checks');
    console.log('   These routes may allow unauthorized access to sensitive operations.');
    console.log('   Add permissionMiddleware() or adminOnly middleware to these routes.\n');
  }
  
  if (publicRoutes.length > 5) {
    console.log('⚠️  WARNING: Large number of public routes detected');
    console.log('   Review each public route to ensure it should be publicly accessible.\n');
  }
  
  console.log('✅ Best Practices:');
  console.log('   1. All routes should have authMiddleware unless intentionally public');
  console.log('   2. All routes should have permission checks (permissionMiddleware or adminOnly)');
  console.log('   3. Admin operations must use adminOnly middleware');
  console.log('   4. Use requirePermission() for granular resource-level access control');
  console.log('='.repeat(80) + '\n');
};

const exportToJSON = (results) => {
  const outputPath = path.join(__dirname, 'endpoint-audit-report.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`📄 Full report exported to: ${outputPath}\n`);
};

if (require.main === module) {
  try {
    const results = analyzeRoutes();
    exportToJSON(results);
    
    process.exit(results.authOnlyRoutes.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error during audit:', error);
    process.exit(1);
  }
}

module.exports = { analyzeRoutes };
