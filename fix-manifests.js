#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// This script creates missing manifest files for route groups before tracing
const serverDir = path.join(process.cwd(), '.next', 'server', 'app');
const routeGroups = ['(dashboard)', '(auth)'];

console.log('Fixing route group manifests...');

routeGroups.forEach(group => {
  const groupDir = path.join(serverDir, group);
  if (fs.existsSync(groupDir)) {
    const manifestPath = path.join(groupDir, 'page_client-reference-manifest.js');
    if (!fs.existsSync(manifestPath)) {
      // Create minimal valid manifest
      fs.writeFileSync(manifestPath, 'self.__RSC_MANIFEST={};self.__BUILD_MANIFEST={};', 'utf8');
      console.log(`✓ Created manifest for ${group}`);
    }
  }
});

console.log('Manifest fix completed');
