// utils.js - Fungsi utilitas umum

// Fungsi untuk memanggil server dengan JSONP
function getDataFromServer(url, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    window[callbackName] = function(data) {
      resolve(data);
      delete window[callbackName];
      
      const scriptId = 'script_' + callbackName;
      const scriptEl = document.getElementById(scriptId);
      if (scriptEl) scriptEl.remove();
    };
    
    let requestUrl = url + '?';
    const urlParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        if (typeof params[key] === 'object') {
          urlParams.append(key, JSON.stringify(params[key]));
        } else {
          urlParams.append(key, params[key]);
        }
      }
    });
    
    urlParams.append('callback', callbackName);
    requestUrl += urlParams.toString();
    
    const script = document.createElement('script');
    script.id = 'script_' + callbackName;
    script.src = requestUrl;
    script.onerror = () => {
      reject(new Error('Failed to load script'));
      delete window[callbackName];
      script.remove();
    };
    
    document.body.appendChild(script);
  });
}

// Format tanggal untuk input[type="date"]
function formatDateForInput(dateValue) {
  try {
    if (!dateValue) return '';
    
    let date;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      // Coba parse berbagai format tanggal
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        date = parsed;
      } else {
        // Coba format dd/mm/yyyy atau dd-mm-yyyy
        const parts = dateValue.split(/[\/\-]/);
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          date = new Date(year, month, day);
        } else {
          return '';
        }
      }
    } else {
      return '';
    }
    
    // Format ke yyyy-MM-dd
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

// Clear semua input dan progress display
function clearInputsForNewLoad() {
  console.log('Clearing all inputs and progress displays...');
  
  // 1. Reset Checkboxes and Labels
  const checkboxes = document.querySelectorAll('.sub-task[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.checked = false;
    const label = cb.closest('.task-item');
    if (label) label.classList.remove('task-completed');
  });

  // 2. Reset Text, Hidden, and Date Inputs
  const textInputs = document.querySelectorAll('.sub-task-text, .tahap-comments, .key-delivery-input, .key-delivery-date, input[type="hidden"].sub-task, .search-input-custom');
  textInputs.forEach(input => {
    if (!input.classList.contains('search-input-custom')) {
      input.value = '';
    }
  });

  // 3. Reset Dual-State Buttons
  const stateButtons = document.querySelectorAll('.state-btn');
  stateButtons.forEach(btn => {
    btn.setAttribute('data-active', 'false');
    btn.classList.remove('active');
  });

  // 4. Reset ALL Progress Bars and Percentage Texts
  const progressFills = document.querySelectorAll('.progress-fill');
  progressFills.forEach(fill => {
    fill.style.width = '0%';
  });

  const percentTexts = document.querySelectorAll('.total-percent, .sub-percent, .sub-percent-tahap');
  percentTexts.forEach(text => {
    text.textContent = '0%';
  });

  // 5. Reset Info Display values
  const valDisplays = document.querySelectorAll('.info-value');
  valDisplays.forEach(display => {
    if (!display.classList.contains('val-name')) {
      display.textContent = '-';
    }
  });
}

// Extract LT dan LB dari string type
function extractLTandLB(tipeString) {
  if (!tipeString || tipeString === '-' || tipeString === '/') {
    return { lt: "", lb: "" };
  }
  const parts = tipeString.split('/').map(part => part.trim());
  return {
    lt: parts[0] || "",
    lb: parts[1] || ""
  };
}

// Get select ID berdasarkan role
function getSelectIdByRole(role) {
  const selectIds = {
    'user1': 'searchKavlingUser1',
    'user2': 'searchKavlingUser2', 
    'user3': 'searchKavlingUser3',
    'user4': 'searchKavlingUser4',
    'manager': 'searchKavlingManager'
  };
  return selectIds[role] || `searchKavling${role.charAt(0).toUpperCase() + role.slice(1)}`;
}

// Get kavling info ID berdasarkan role
function getKavlingInfoIdByRole(role) {
  const infoIds = {
    'user1': 'kavlingInfoUser1',
    'user2': 'kavlingInfoUser2', 
    'user3': 'kavlingInfoUser3',
    'user4': 'kavlingInfoUser4',
    'manager': 'kavlingInfoManager'
  };
  return infoIds[role] || `kavlingInfo${role.charAt(0).toUpperCase() + role.slice(1)}`;
}

// Debug functions
function debugInputStatus() {
  if (!currentRole) return;
  
  const pageId = currentRole + 'Page';
  const page = document.getElementById(pageId);
  if (!page) return;
  
  console.log(`🔍 DEBUG INPUT STATUS untuk ${pageId}:`);
  
  const checkboxes = page.querySelectorAll('input[type="checkbox"]');
  console.log(`Total checkbox: ${checkboxes.length}`);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDataFromServer,
    formatDateForInput,
    clearInputsForNewLoad,
    extractLTandLB,
    getSelectIdByRole,
    getKavlingInfoIdByRole,
    debugInputStatus
  };
}
