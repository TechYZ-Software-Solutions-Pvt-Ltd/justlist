// Runtime API configuration for JustList
// This file is loaded before the React app and allows changing the API URL without rebuilding
(function() {
  var isGitHubPages = window.location.hostname === 'techyz-software-solutions-pvt-ltd.github.io' ||
                      window.location.hostname.includes('github.io');

  var API_URL = isGitHubPages
    ? 'https://justlist.onrender.com' // Production backend on Render
    : 'http://localhost:8000'; // Local development

  var isPlaceholder = API_URL.includes('your-backend.onrender.com') || API_URL.includes('your-');

  window.__APP_CONFIG__ = {
    apiUrl: API_URL
  };

  console.log('🔧 JustList API Configuration:');
  console.log('   Environment:', isGitHubPages ? 'GitHub Pages (Production)' : 'Local Development');
  console.log('   API URL:', API_URL);

  if (isPlaceholder && isGitHubPages) {
    console.error('❌ ERROR: Backend URL not configured!');
    console.error('   Please update frontend/public/config.js with your actual backend URL');
    console.error('   Example: https://justlist.onrender.com');
  }
})();

