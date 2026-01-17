// config.js - Konfigurasi dan konstanta
const USER_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx08smViAL2fT_P0ZCljaM8NGyDPZvhZiWt2EeIy1MYsjoWnSMEyXwoS6jydO-_J8OH/exec';
const PROGRESS_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby4j4f2AlMMu1nZzLePeqdLzyMYj59lmlvVmnV9QywZwGwpLYhvNa7ExtrIAc3SWmDC/exec';

// Variabel global
window.currentRole = null;
window.selectedKavling = null;
window.currentKavlingData = null;
window.allKavlings = [];

// Display names
const defaultDisplayNames = {
  'user1': 'Pelaksana 1',
  'user2': 'Pelaksana 2',
  'user3': 'Pelaksana 3',
  'user4': 'Admin Utilitas',
  'manager': 'Supervisor',
  'admin': 'AdminSystemWeb'
};

// Mapping untuk progress
const tahapWeights = { 
  '1': 0.40,  // 40%
  '2': 0.30,  // 30%
  '3': 0.20,  // 20%
  '4': 0.10   // 10%
};

// Export jika menggunakan ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    USER_APPS_SCRIPT_URL,
    PROGRESS_APPS_SCRIPT_URL,
    defaultDisplayNames,
    tahapWeights
  };
}
