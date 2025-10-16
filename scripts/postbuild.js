// Post-build script to fix missing manifest files for route groups
const fs = require('fs');
const path = require('path');

const serverDir = path.join(__dirname, '..', '.next', 'server', 'app');
const routeGroups = ['(dashboard)', '(auth)'];

routeGroups.forEach(group => {
  const groupDir = path.join(serverDir, group);
  if (fs.existsSync(groupDir)) {
    const manifestPath = path.join(groupDir, 'page_client-reference-manifest.js');
    if (!fs.existsSync(manifestPath)) {
      // Create empty manifest to prevent tracing errors
      fs.writeFileSync(manifestPath, 'self.__RSC_MANIFEST={};self.__BUILD_MANIFEST={};');
      console.log(`Created missing manifest for ${group}`);
    }
  }
});

console.log('Post-build script completed');
