// versi 0.334
const USER_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx08smViAL2fT_P0ZCljaM8NGyDPZvhZiWt2EeIy1MYsjoWnSMEyXwoS6jydO-_J8OH/exec';
const PROGRESS_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxBYbfxCaIfXbq_lHtV6_vFAd24wdsuqeLdXo4mzsY-wJdbxxLQ88jR16sfd3hpQbYzXw/exec';

let currentRole = null;
let selectedKavling = null;
let currentKavlingData = null;

const defaultDisplayNames = {
  'user1': 'Pelaksana 1',
  'user2': 'Pelaksana 2',
  'user3': 'Pelaksana 3',
  'user4': 'Pelaksana 4',
  'manager': 'MANAGEMENT',
  'admin': 'Admin'
};

// ========== UTILITY FUNCTIONS ==========
function showGlobalLoading(text = 'Mohon Tunggu...') {
  const modal = document.getElementById('loadingModal');
  const textEl = document.getElementById('loadingText');
  if (modal && textEl) {
    textEl.textContent = text;
    modal.style.display = 'flex';
  }
}

function hideGlobalLoading() {
  const modal = document.getElementById('loadingModal');
  if (modal) modal.style.display = 'none';
}

// ========== TOAST NOTIFICATION ==========
function showToast(type, message) {
  // Hapus toast sebelumnya
  const existingToast = document.getElementById('globalToast');
  if (existingToast) existingToast.remove();
  
  const template = document.getElementById('toastTemplate');
  if (!template) return;
  
  const toast = template.content.cloneNode(true).querySelector('.toast');
  toast.id = 'globalToast';
  toast.classList.add(`toast-${type}`);
  
  const icon = toast.querySelector('i');
  icon.classList.add(type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle');
  
  const messageSpan = toast.querySelector('.toast-message');
  messageSpan.textContent = message;
  
  document.body.appendChild(toast);
  
  // Tampilkan toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Hapus setelah 2.5 detik
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 2500);
}

// Ganti fungsi lama
function showProgressMessage(type, message) {
  showToast(type, message);
}

// Fungsi baru untuk load data utilitas
function loadUtilitasDataFromData(data) {
  // Key delivery
  const keyInput = document.getElementById('keyDeliveryInputUser4');
  if (keyInput) {
    keyInput.value = data.data?.tahap4?.['PENYERAHAN KUNCI'] || '';
  }
  
  // Utility Dates
  const listrikInput = document.getElementById('listrikInstallDate');
  const airInput = document.getElementById('airInstallDate');
  const notesInput = document.getElementById('utilityNotes');
  const propNotesInput = document.getElementById('utilityPropertyNotes');
  
  if (listrikInput) listrikInput.value = data.utilitas?.listrikDate || '';
  if (airInput) airInput.value = data.utilitas?.airDate || '';
  if (propNotesInput) propNotesInput.value = data.propertyNotes || '';
}

function updateUtilitasProgressDisplay(totalProgress) {
  const percentEl = document.getElementById('utilityOverallPercent');
  const barEl = document.getElementById('utilityOverallBar');
  
  if (!percentEl || !barEl) return;
  
  let displayProgress = totalProgress;
  let percentValue = 0;
  
  if (typeof totalProgress === 'string') {
    if (totalProgress.includes('%')) {
      percentValue = parseInt(totalProgress);
    } else {
      const num = parseFloat(totalProgress);
      if (!isNaN(num)) {
        percentValue = num <= 1 ? Math.round(num * 100) : Math.round(num);
        displayProgress = percentValue + '%';
      }
    }
  } else if (typeof totalProgress === 'number') {
    percentValue = totalProgress <= 1 ? Math.round(totalProgress * 100) : Math.round(totalProgress);
    displayProgress = percentValue + '%';
  }
  
  percentEl.textContent = displayProgress;
  barEl.style.width = percentValue + '%';
  
  // Color classes
  barEl.className = 'total-bar';
  if (percentValue >= 89) barEl.classList.add('bar-high');
  else if (percentValue >= 60) barEl.classList.add('bar-medium');
  else if (percentValue >= 10) barEl.classList.add('bar-low');
  else barEl.classList.add('bar-very-low');
}

// Global Event Listeners setup for user4
function setupUser4EventListeners() {
  const btnSave = document.getElementById('btnSaveUtility');
  if (btnSave) {
    btnSave.addEventListener('click', async function() {
      if (!selectedKavling) {
        showToast('warning', 'Pilih kavling terlebih dahulu!');
        return;
      }
      
      const listrikDate = document.getElementById('listrikInstallDate').value;
      const airDate = document.getElementById('airInstallDate').value;
      
      showGlobalLoading('Menyimpan data utilitas...');
      
      try {
        const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
          action: 'saveUtilitasData',
          kavling: selectedKavling,
          listrikDate: listrikDate,
          airDate: airDate,
          user: 'user4'
        });
        
        if (result.success) {
          showToast('success', 'Data utilitas berhasil disimpan!');
        } else {
          showToast('error', 'Gagal menyimpan: ' + result.message);
        }
      } catch (error) {
        showToast('error', 'Error: ' + error.message);
      } finally {
        hideGlobalLoading();
      }
    });
  }

  const btnSaveNotes = document.getElementById('btnSaveUtilityNotes');
  if (btnSaveNotes) {
    btnSaveNotes.addEventListener('click', async function() {
      if (!selectedKavling) {
        showToast('warning', 'Pilih kavling terlebih dahulu!');
        return;
      }
      
      const notes = document.getElementById('utilityPropertyNotes').value;
      
      showGlobalLoading('Menyimpan catatan property...');
      
      try {
        const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
          action: 'savePropertyNotes',
          kavling: selectedKavling,
          notes: notes,
          user: 'user4'
        });
        
        if (result.success) {
          showToast('success', 'Catatan property berhasil disimpan!');
          if (currentKavlingData) currentKavlingData.propertyNotes = notes;
        } else {
          showToast('error', 'Gagal menyimpan: ' + result.message);
        }
      } catch (error) {
        showToast('error', 'Error: ' + error.message);
      } finally {
        hideGlobalLoading();
      }
    });
  }
}
//--------
function setupUser4Tabs() {
  const user4Page = document.getElementById('user4Page');
  if (!user4Page) return;
  
  // Gunakan event delegation untuk tab yang mungkin dinamis
  user4Page.addEventListener('click', function(e) {
    const tabBtn = e.target.closest('.admin-tab-btn');
    if (!tabBtn) return;
    
    e.preventDefault();
    const tabId = tabBtn.getAttribute('data-tab');
    
    // Update UI tabs
    const tabBtns = user4Page.querySelectorAll('.admin-tab-btn');
    const tabContents = user4Page.querySelectorAll('.tab-content-item');
    
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    tabBtn.classList.add('active');
    const targetTab = user4Page.querySelector(`#tab-${tabId}`);
    if (targetTab) {
      targetTab.classList.add('active');
      
      // Load data spesifik tab jika diperlukan
      if (tabId === 'utility-install') {
        loadUtilitasData();
      }
    }
  });
}

// ========== KAVLING FUNCTIONS ==========
async function loadKavlingList() {
  console.log('Loading kavling list...');
  showGlobalLoading('Memuat daftar kavling...');
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getKavlingList'
    });
    
    if (result.success && result.kavlings && result.kavlings.length > 0) {
      updateAllKavlingSelects(result.kavlings);
      console.log(`✅ Loaded ${result.kavlings.length} kavlings`);
      
      if (selectedKavling) {
        setTimeout(() => {
          setSelectedKavlingInDropdowns(selectedKavling);
        }, 100);
      }
      
      return result.kavlings;
    } else {
      console.log('❌ No kavlings found:', result.message);
      showToast('warning', 'Tidak ada data kavling ditemukan');
      return [];
    }
    
  } catch (error) {
    console.error('❌ Error loading kavling list:', error);
    showToast('error', 'Gagal memuat daftar kavling');
    return [];
  } finally {
    hideGlobalLoading();
  }
}

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

function updateAllKavlingSelects(kavlings) {
  const selectIds = [
    'searchKavlingUser1',
    'searchKavlingUser2', 
    'searchKavlingUser3',
    'searchKavlingUser4',
    'searchKavlingManager'
  ];
  
  selectIds.forEach(selectId => {
    const selectElement = document.getElementById(selectId);
    if (selectElement) {
      updateKavlingSelect(selectElement, kavlings);
    }
  });
}

function updateKavlingSelect(selectElement, kavlings) {
  const currentValue = selectElement.value;
  selectElement.innerHTML = '<option value="">-- Pilih Kavling --</option>';
  
  if (!kavlings || kavlings.length === 0) {
    const option = document.createElement('option');
    option.value = "";
    option.textContent = "Tidak ada kavling tersedia";
    option.disabled = true;
    selectElement.appendChild(option);
    return;
  }
  
  const sortedKavlings = [...kavlings].sort((a, b) => {
    const extractParts = (str) => {
      const match = str.match(/([A-Za-z]+)[_ ]*(\d+)/);
      if (match) {
        return { block: match[1].toUpperCase(), number: parseInt(match[2]) };
      }
      return { block: str, number: 0 };
    };
    
    const aParts = extractParts(a);
    const bParts = extractParts(b);
    
    if (aParts.block !== bParts.block) {
      return aParts.block.localeCompare(bParts.block);
    }
    return aParts.number - bParts.number;
  });
  
  sortedKavlings.forEach(kavling => {
    const option = document.createElement('option');
    option.value = kavling;
    option.textContent = kavling;
    selectElement.appendChild(option);
  });
  
  if (currentValue && kavlings.includes(currentValue)) {
    selectElement.value = currentValue;
  }
}

function setSelectedKavlingInDropdowns(kavlingName) {
  const selectIds = [
    'searchKavlingUser1',
    'searchKavlingUser2', 
    'searchKavlingUser3',
    'searchKavlingUser4',
    'searchKavlingManager'
  ];
  
  selectIds.forEach(selectId => {
    const selectElement = document.getElementById(selectId);
    if (selectElement && Array.from(selectElement.options).some(opt => opt.value === kavlingName)) {
      selectElement.value = kavlingName;
    }
  });
}

async function searchKavling() {
  console.log('=== FUNGSI searchKavling DIPANGGIL ===');
  
  try {
    const rolePage = currentRole + 'Page';
    const selectId = getSelectIdByRole(currentRole);
    const selectElement = document.getElementById(selectId);
    
    if (!selectElement) {
      showToast('error', 'Dropdown kavling tidak ditemukan!');
      return;
    }
    
    const kavlingName = selectElement.value.trim();
    
    if (!kavlingName) {
      showToast('warning', 'Pilih kavling terlebih dahulu dari dropdown!');
      selectElement.focus();
      return;
    }
    
    showGlobalLoading('Mengambil data kavling ' + kavlingName + '...');
    
    const data = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getKavlingData',
      kavling: kavlingName
    });
    
     console.log('📦 Full response from server:', data);
    
   if (data.success) {
      selectedKavling = kavlingName;
      
      // ✅ Simpan SEMUA data dari server dengan struktur yang benar
      currentKavlingData = {
        kavling: data.kavling || kavlingName,
        type: data.type || '-', 
        lt: data.lt || '-',
        lb: data.lb || '-',
        propertyNotes: data.propertyNotes || '',
        totalAH: data.totalAH || '0%', // Ambil dari kolom AH
        data: data.data || {}
      };
     
      setSelectedKavlingInDropdowns(kavlingName);
      updateKavlingInfo(currentKavlingData, rolePage);
           
      if (currentRole !== 'manager') {
        loadProgressData(data.data);
      }
      
      if (currentRole === 'manager') {
        loadPropertyNotesFromData(currentKavlingData);
        
        // Update progress display untuk manager menggunakan data AH
        updateManagerProgressDisplay(currentKavlingData.totalAH);
        
        // Jika di tab reports, load laporan
        const activeTab = document.querySelector('#managerPage .admin-tab-btn.active');
        if (activeTab && activeTab.getAttribute('data-tab') === 'reports') {
          setTimeout(() => {
            loadSummaryReport();
          }, 500);
        }
      }
      
      if (currentRole === 'user4') {
        // Load data untuk Admin Utilitas
        loadUtilitasDataFromData(currentKavlingData);
        
        // Update progress display untuk utilitas menggunakan data AH
        updateUtilitasProgressDisplay(currentKavlingData.totalAH);
      }
      
      showToast('success', `Data ${kavlingName} berhasil dimuat!`);
      
    } else {
      showToast('error', data.message || 'Kavling tidak ditemukan');
      selectElement.value = '';
    }
    
  } catch (error) {
    console.error('Error dalam searchKavling:', error);
    showToast('error', 'Gagal mengambil data: ' + error.message);
  } finally {
    hideGlobalLoading();
  }
}      

// Fungsi baru untuk load property notes dari data
function loadPropertyNotesFromData(data) {
  const notesEl = document.getElementById('propertyNotesManager');
  if (!notesEl) return;
  
  // PERBAIKAN: Ambil notes dari data.propertyNotes ATAU data.data.keterangan
 const notes = data.propertyNotes || '';
  
  notesEl.value = notes;
  notesEl.placeholder = 'Masukkan catatan kondisi property (AH) di sini...';
  
  // Update character counter jika ada
  if (typeof updateNotesCounter === 'function') {
    updateNotesCounter(notes.length);
  }
}
//----------------------------------------------
function updateManagerProgressDisplay(totalProgress) {
  const progressDisplay = document.getElementById('managerProgressDisplay');
  if (!progressDisplay) {
    console.error('managerProgressDisplay element not found');
    return;
  }
  
  progressDisplay.style.display = 'block';
  
  const overallVal = progressDisplay.querySelector('.val-overall');
  const progressFill = progressDisplay.querySelector('.total-bar');
  
  if (overallVal) {
    let displayProgress = totalProgress || '0%';
    
    // Jika masih berupa angka desimal (0.97), konversi ke persen
    if (typeof totalProgress === 'string' && !totalProgress.includes('%')) {
      const num = parseFloat(totalProgress);
      if (!isNaN(num)) {
        displayProgress = (num <= 1 ? Math.round(num * 100) : Math.round(num)) + '%';
      }
    } else if (typeof totalProgress === 'number') {
      displayProgress = (totalProgress <= 1 ? Math.round(totalProgress * 100) : Math.round(totalProgress)) + '%';
    }
    
    overallVal.textContent = displayProgress;
  }
  
  if (progressFill) {
    let percentValue = 0;
    
    if (typeof totalProgress === 'string') {
      const percentMatch = totalProgress.match(/(\d+)%/);
      if (percentMatch) {
        percentValue = parseInt(percentMatch[1]);
      } else {
        const num = parseFloat(totalProgress);
        if (!isNaN(num)) {
          percentValue = num <= 1 ? Math.round(num * 100) : Math.round(num);
        }
      }
    } else if (typeof totalProgress === 'number') {
      percentValue = totalProgress <= 1 ? Math.round(totalProgress * 100) : Math.round(totalProgress);
    }
    
    progressFill.style.width = percentValue + '%';
    
    progressFill.className = 'total-bar';
    if (percentValue >= 89) progressFill.classList.add('bar-high');
    else if (percentValue >= 60) progressFill.classList.add('bar-medium');
    else if (percentValue >= 10) progressFill.classList.add('bar-low');
    else progressFill.classList.add('bar-very-low');
  }
}
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

// ========== FUNGSI updateKavlingInfo (PERBAIKAN) ==========
function updateKavlingInfo(data, pageId) {
  const role = currentRole;
  const infoId = getKavlingInfoIdByRole(role);
  const infoDisplay = document.getElementById(infoId);
  
  if (!infoDisplay) return;
  
  if (role === 'manager') {
    infoDisplay.innerHTML = `
      <div class="info-item">
        <span class="info-label">Blok/Kavling:</span>
        <span class="info-value val-name">${data.kavling || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Type:</span>
        <span class="info-value val-type">${data.type || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Luas Tanah (LT):</span>
        <span class="info-value val-lt">${data.lt || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Luas Bangunan (LB):</span>
        <span class="info-value val-lb">${data.lb || '-'}</span>
      </div>
    `;

    // Update progress display untuk manager
    if (data.data?.tahap4?.TOTAL) {
      updateManagerProgressDisplay(data.data.tahap4.TOTAL);
    }
  } else {
    infoDisplay.innerHTML = `
      <div class="info-item">
        <span class="info-label">Blok/Kavling:</span>
        <span class="info-value val-name">${data.kavling || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Type:</span>
        <span class="info-value val-type">${data.type || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">LT:</span>
        <span class="info-value val-lt">${data.lt || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">LB:</span>
        <span class="info-value val-lb">${data.lb || '-'}</span>
      </div>
    `;
  }
}

// ========== FUNGSI loadProgressData (PERBAIKAN) ==========
function loadProgressData(progressData) {
  if (!progressData) return;
  
  const rolePage = currentRole + 'Page';
  const pageElement = document.getElementById(rolePage);
  if (!pageElement) return;

  // Load data untuk field pilihan khusus
  if (progressData.tahap1) {
    // Handle Sistem Pembuangan
    const sistemPembuanganValue = progressData.tahap1['SISTEM PEMBUANGAN'];
    if (sistemPembuanganValue) {
      const taskItem = pageElement.querySelector('.waste-system');
      if (taskItem) {
        const buttons = taskItem.querySelectorAll('.system-btn');
        const hiddenInput = taskItem.querySelector('#wasteSystemInput');
        
        // Reset active state first
        buttons.forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('data-active', 'false');
        });
        
        buttons.forEach(btn => {
          if (btn.getAttribute('data-state') === sistemPembuanganValue.toLowerCase()) {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          }
        });
        
        if (hiddenInput) {
          hiddenInput.value = sistemPembuanganValue;
        }
      }
    }
    
    // Handle Cor Meja Dapur
    const corMejaDapurValue = progressData.tahap1['COR MEJA DAPUR'];
    if (corMejaDapurValue) {
      const taskItem = pageElement.querySelector('.table-kitchen');
      if (taskItem) {
        const buttons = taskItem.querySelectorAll('.table-btn');
        const hiddenInput = taskItem.querySelector('#tableKitchenInput');
        
        // Reset active state first
        buttons.forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('data-active', 'false');
        });
        
        buttons.forEach(btn => {
          if (btn.getAttribute('data-state') === 'include' && corMejaDapurValue === 'Dengan Cor Meja Dapur') {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          } else if (btn.getAttribute('data-state') === 'exclude' && corMejaDapurValue === 'Tanpa Cor Meja Dapur') {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          }
        });
        
        if (hiddenInput) {
          hiddenInput.value = corMejaDapurValue;
        }
      }
    }
    
    // Load checkbox biasa untuk tahap 1
    const checkboxTasks1 = ['LAND CLEARING', 'PONDASI', 'SLOOF', 'PAS.DDG S/D2 CANOPY', 
                           'PAS.DDG S/D RING BLK', 'CONDUIT+INBOW DOOS', 'PIPA AIR KOTOR', 
                           'PIPA AIR BERSIH', 'PLESTER', 'ACIAN & BENANGAN'];
    
    checkboxTasks1.forEach(taskName => {
      const isChecked = progressData.tahap1[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 1, rolePage);
      if (checkbox) {
        checkbox.checked = isChecked;
        const label = checkbox.closest('label');
        if (label) {
          if (isChecked) {
            label.classList.add('task-completed');
          } else {
            label.classList.remove('task-completed');
          }
        }
      }
    });
  }
  
  if (progressData.tahap2) {
    // Handle Keramik Dinding Toilet & Dapur
    const keramikDindingValue = progressData.tahap2['KERAMIK DINDING TOILET & DAPUR'];
    if (keramikDindingValue) {
      const taskItem = pageElement.querySelector('.bathroom-tiles');
      if (taskItem) {
        const buttons = taskItem.querySelectorAll('.tiles-btn');
        const hiddenInput = taskItem.querySelector('#bathroomTilesInput');
        
        // Reset active state first
        buttons.forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('data-active', 'false');
        });
        
        buttons.forEach(btn => {
          if (btn.getAttribute('data-state') === 'include' && keramikDindingValue === 'Dengan Keramik Dinding') {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          } else if (btn.getAttribute('data-state') === 'exclude' && keramikDindingValue === 'Tanpa Keramik Dinding') {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          }
        });
        
        if (hiddenInput) {
          hiddenInput.value = keramikDindingValue;
        }
      }
    }
    
    // Load checkbox biasa untuk tahap 2
    const checkboxTasks2 = ['RANGKA ATAP', 'GENTENG', 'PLAFOND', 'INSTALASI LISTRIK', 'KERAMIK LANTAI'];
    
    checkboxTasks2.forEach(taskName => {
      const isChecked = progressData.tahap2[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 2, rolePage);
      if (checkbox) {
        checkbox.checked = isChecked;
        const label = checkbox.closest('label');
        if (label) {
          if (isChecked) {
            label.classList.add('task-completed');
          } else {
            label.classList.remove('task-completed');
          }
        }
      }
    });
  }
  
  if (progressData.tahap3) {
    Object.keys(progressData.tahap3).forEach(taskName => {
      const isChecked = progressData.tahap3[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 3, rolePage);
      if (checkbox) {
        checkbox.checked = isChecked;
        const label = checkbox.closest('label');
        if (label) {
          if (isChecked) {
            label.classList.add('task-completed');
          } else {
            label.classList.remove('task-completed');
          }
        }
      }
    });
  }

  if (progressData.tahap4) {
    // Load Keterangan
    if (progressData.tahap4['KETERANGAN']) {
      const commentEl = pageElement.querySelector('.tahap-comments');
      if (commentEl) {
        commentEl.value = progressData.tahap4['KETERANGAN'];
      }
    }
    
    // Load Penyerahan Kunci
    if (progressData.tahap4['PENYERAHAN KUNCI']) {
      const deliveryEl = pageElement.querySelector('.key-delivery-input');
      if (deliveryEl) {
        deliveryEl.value = progressData.tahap4['PENYERAHAN KUNCI'];
      }
    }

    // ===== PERBAIKAN: LOAD TANGGAL PENYERAHAN KUNCI =====
    if (progressData.tahap4['TANGGAL_PENYERAHAN_KUNCI']) {
      const dateEl = pageElement.querySelector('.key-delivery-date');
      if (dateEl) {
        // Format tanggal untuk input type="date" (yyyy-MM-dd)
        const rawDate = progressData.tahap4['TANGGAL_PENYERAHAN_KUNCI'];
        let formattedDate = '';
        
        if (rawDate instanceof Date || (typeof rawDate === 'string' && rawDate.includes('-'))) {
          // Jika sudah format Date atau yyyy-MM-dd
          formattedDate = formatDateForInput(rawDate);
        } else if (rawDate) {
          // Coba parse tanggal lain
          formattedDate = formatDateForInput(new Date(rawDate));
        }
        
        dateEl.value = formattedDate;
        console.log(`Loaded date for ${selectedKavling}: ${rawDate} → ${formattedDate}`);
      }
    }

  
    // Load Completion - PERBAIKAN: CARI CHECKBOX DI TAHAP 4
    if (progressData.tahap4['COMPLETION / Penyelesaian akhir']) {
      const completionCheckbox = findCheckboxByTaskName('COMPLETION / Penyelesaian akhir', 4, rolePage);
      if (!completionCheckbox) {
        // Coba cari dengan nama yang lebih sederhana
        const allCheckboxes = pageElement.querySelectorAll(`[data-tahap="4"] .sub-task[type="checkbox"]`);
        for (const checkbox of allCheckboxes) {
          const label = checkbox.closest('label');
          if (label && label.textContent.toLowerCase().includes('completion')) {
            completionCheckbox = checkbox;
            break;
          }
        }
      }
      
      if (completionCheckbox) {
        completionCheckbox.checked = true;
        const label = completionCheckbox.closest('label');
        if (label) {
          label.classList.add('task-completed');
        }
      }
    }
    
    // Update total progress
    if (progressData.tahap4['TOTAL']) {
      updateTotalProgressDisplay(progressData.tahap4['TOTAL'] || '0%', rolePage);
    }
  }
  
  updateProgress(rolePage);
}
//

// ===== FUNGSI TAMBAHAN UNTUK FORMAT TANGGAL =====
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
    
    // Format ke yyyy-MM-dd untuk input[type="date"]
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

//
function findCheckboxByTaskName(taskName, tahap, pageId) {
  const pageElement = document.getElementById(pageId);
  if (!pageElement) return null;
  
  const cleanTaskName = taskName.toUpperCase().trim();
  const checkboxes = pageElement.querySelectorAll(`[data-tahap="${tahap}"] .sub-task[type="checkbox"]`);
  
  for (let cb of checkboxes) {
    if (cb.getAttribute('data-task') === cleanTaskName) {
      return cb;
    }
  }
  
  // Fallback: search by text content if data-task doesn't match
  const cleanSearch = cleanTaskName.replace(/[^A-Z0-9]/g, '');
  for (let cb of checkboxes) {
    const label = cb.closest('label');
    if (label) {
      const labelText = label.textContent.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (labelText.includes(cleanSearch) || cleanSearch.includes(labelText)) {
        return cb;
      }
    }
  }
  return null;
}

// ========== FUNGSI saveTahap1 (PERBAIKAN) ==========
async function saveTahap1() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }
  
  const rolePage = currentRole + 'Page';
  const tahap1Section = document.querySelector(`#${rolePage} .progress-section[data-tahap="1"]`);
  if (!tahap1Section) return;
  
  const checkboxes = tahap1Section.querySelectorAll('.sub-task');
  const wasteSystemInput = tahap1Section.querySelector('#wasteSystemInput');
  const tableKitchenInput = tahap1Section.querySelector('#tableKitchenInput');
  const saveButton = tahap1Section.querySelector('.btn-save-section');
  
  const t1Mapping = {
    "Land Clearing": "LAND CLEARING",
    "Pondasi": "PONDASI",
    "Sloof": "SLOOF",
    "Pas.Ddg S/D Canopy": "PAS.DDG S/D2 CANOPY",
    "Pas.Ddg S/D Ring Blk": "PAS.DDG S/D RING BLK",
    "PAS.DDG S/D2 CANOPY": "PAS.DDG S/D2 CANOPY",
    "PAS.DDG S/D RING BLK": "PAS.DDG S/D RING BLK",
    "Pas.Ddg S/D Canopy ": "PAS.DDG S/D2 CANOPY",
    "Pas.Ddg S/D Ring Blk ": "PAS.DDG S/D RING BLK",
    "Conduit + Inbow Doos": "CONDUIT+INBOW DOOS",
    "Pipa Air Kotor": "PIPA AIR KOTOR",
    "Pipa Air Bersih": "PIPA AIR BERSIH",
    "Sistem Pembuangan": "SISTEM PEMBUANGAN",
    "Plester": "PLESTER",
    "Acian & Benangan": "ACIAN & BENANGAN",
    "Cor Meja Dapur": "COR MEJA DAPUR"
  };

  const tahapData = {};

    // Handle checkbox biasa
    checkboxes.forEach(checkbox => {
      if (checkbox.type === 'checkbox') {
        const spreadsheetTaskName = checkbox.getAttribute('data-task');
        if (spreadsheetTaskName) {
          tahapData[spreadsheetTaskName] = checkbox.checked;
        }
      }
    });

  // Handle Sistem Pembuangan
  if (wasteSystemInput && wasteSystemInput.value) {
    tahapData['SISTEM PEMBUANGAN'] = wasteSystemInput.value === 'biotank' ? 'Biotank' : 
                                     wasteSystemInput.value === 'ipal' ? 'Ipal' : 'Septictank';
  }

  // Handle Cor Meja Dapur
  if (tableKitchenInput && tableKitchenInput.value) {
    tahapData['COR MEJA DAPUR'] = tableKitchenInput.value === 'include' ? 
                                  'Dengan Cor Meja Dapur' : 'Tanpa Cor Meja Dapur';
  }

  // Tambahkan LT, LB, dan TYPE
  if (currentKavlingData.lt) tahapData['LT'] = currentKavlingData.lt;
  if (currentKavlingData.lb) tahapData['LB'] = currentKavlingData.lb;
  if (currentKavlingData.type) tahapData['TYPE'] = currentKavlingData.type;

  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }
  
  showGlobalLoading('Mohon Tunggu, Sedang Menyimpan Tahap 1...');
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveTahap1',
      kavling: selectedKavling,
      data: tahapData,
      user: currentRole
    });
    
    hideGlobalLoading();
    
    if (result.success) {
      showToast('success', `Berhasil! Tahap 1 untuk Blok ${selectedKavling} telah tersimpan.`);
      
      // Update data lokal
      if (currentKavlingData.data) {
        if (!currentKavlingData.data.tahap1) currentKavlingData.data.tahap1 = {};
        Object.keys(tahapData).forEach(taskName => {
          if (taskName !== 'LT' && taskName !== 'LB' && taskName !== 'TYPE') {
            currentKavlingData.data.tahap1[taskName] = tahapData[taskName];
          }
        });
      }
      
      updateProgress(rolePage);
    } else {
      showToast('error', result.message || 'Gagal menyimpan tahap 1');
    }
  } catch (error) {
    console.error('Error saving tahap 1:', error);
    showToast('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Tahap 1';
      saveButton.disabled = false;
    }
  }
}

// ========== FUNGSI saveTahap2 (PERBAIKAN) ==========
async function saveTahap2() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }
  
  const rolePage = currentRole + 'Page';
  const tahap2Section = document.querySelector(`#${rolePage} .progress-section[data-tahap="2"]`);
  if (!tahap2Section) return;
  
  const checkboxes = tahap2Section.querySelectorAll('.sub-task');
  const bathroomTilesInput = tahap2Section.querySelector('#bathroomTilesInput');
  const saveButton = tahap2Section.querySelector('.btn-save-section');
  
  const t2Mapping = {
    "Rangka Atap": "RANGKA ATAP",
    "Genteng": "GENTENG",
    "Plafond": "PLAFOND",
    "Keramik Dinding Toilet & Dapur": "KERAMIK DINDING TOILET & DAPUR",
    "Instalasi Listrik": "INSTALASI LISTRIK",
    "Keramik Lantai": "KERAMIK LANTAI"
  };

  const tahapData = {};

  // Handle checkbox biasa
  checkboxes.forEach(checkbox => {
    if (checkbox.type === 'checkbox') {
      const label = checkbox.closest('label');
      const uiTaskName = label.textContent.trim();
      const spreadsheetTaskName = t2Mapping[uiTaskName] || uiTaskName;
      tahapData[spreadsheetTaskName] = checkbox.checked;
    }
  });

  // Handle Keramik Dinding Toilet & Dapur
  if (bathroomTilesInput && bathroomTilesInput.value) {
    tahapData['KERAMIK DINDING TOILET & DAPUR'] = bathroomTilesInput.value === 'include' ? 
                                                  'Dengan Keramik Dinding' : 'Tanpa Keramik Dinding';
  }

  // Tambahkan LT, LB, dan TYPE
  if (currentKavlingData.lt) tahapData['LT'] = currentKavlingData.lt;
  if (currentKavlingData.lb) tahapData['LB'] = currentKavlingData.lb;
  if (currentKavlingData.type) tahapData['TYPE'] = currentKavlingData.type;

  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }
  
  showGlobalLoading('Mohon Tunggu, Sedang Menyimpan Tahap 2...');
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveTahap2',
      kavling: selectedKavling,
      data: tahapData,
      user: currentRole
    });
    
    hideGlobalLoading();
    
    if (result.success) {
      showToast('success', `Berhasil! Tahap 2 untuk Blok ${selectedKavling} telah tersimpan.`);
      
      // Update data lokal
      if (currentKavlingData.data) {
        if (!currentKavlingData.data.tahap2) currentKavlingData.data.tahap2 = {};
        Object.keys(tahapData).forEach(taskName => {
          if (taskName !== 'LT' && taskName !== 'LB' && taskName !== 'TYPE') {
            currentKavlingData.data.tahap2[taskName] = tahapData[taskName];
          }
        });
      }
      
      updateProgress(rolePage);
    } else {
      showToast('error', result.message || 'Gagal menyimpan tahap 2');
    }
  } catch (error) {
    console.error('Error saving tahap 2:', error);
    showToast('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Tahap 2';
      saveButton.disabled = false;
    }
  }
}

// ========== FUNGSI saveTahap3 ==========
async function saveTahap3() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }
  
  const rolePage = currentRole + 'Page';
  const tahap3Section = document.querySelector(`#${rolePage} .progress-section[data-tahap="3"]`);
  if (!tahap3Section) return;
  
  const checkboxes = tahap3Section.querySelectorAll('.sub-task');
  const saveButton = tahap3Section.querySelector('.btn-save-section');
  
  const t3Mapping = {
    "Kusen Pintu & Jendela": "KUSEN PINTU & JENDELA",
    "Daun Pintu & Jendela": "DAUN PINTU & JENDELA",
    "Cat Dasar + Lapis Awal": "CAT DASAR + LAPIS AWAL",
    "Fitting Lampu": "FITTING LAMPU",
    "Fixture & Saniter": "FIXTURE & SANITER",
    "Cat Finish Interior": "CAT FINISH INTERIOR",
    "Cat Finish Exterior": "CAT FINISH EXTERIOR",
    "Bak Kontrol & Batas Carport": "BAK KONTROL & BATAS CARPORT",
    "Paving Halaman": "PAVING HALAMAN",
    "General Cleaning": "GENERAL CLEANING",
    "Completion": "COMPLETION / Penyelesaian akhir"
  };

  const tahapData = {};

  // Handle checkbox biasa
  checkboxes.forEach(checkbox => {
    if (checkbox.type === 'checkbox') {
      const label = checkbox.closest('label');
      const uiTaskName = label.textContent.trim();
      const spreadsheetTaskName = t3Mapping[uiTaskName] || uiTaskName;
      tahapData[spreadsheetTaskName] = checkbox.checked;
    }
  });

  // Tambahkan LT, LB, dan TYPE
  if (currentKavlingData.lt) tahapData['LT'] = currentKavlingData.lt;
  if (currentKavlingData.lb) tahapData['LB'] = currentKavlingData.lb;
  if (currentKavlingData.type) tahapData['TYPE'] = currentKavlingData.type;

  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }
  
  showGlobalLoading('Mohon Tunggu, Sedang Menyimpan Tahap 3...');
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveTahap3',
      kavling: selectedKavling,
      data: tahapData,
      user: currentRole
    });
    
    hideGlobalLoading();
    
    if (result.success) {
      showToast('success', `Berhasil! Tahap 3 untuk Blok ${selectedKavling} telah tersimpan.`);
      
      // Update data lokal
      if (currentKavlingData.data) {
        if (!currentKavlingData.data.tahap3) currentKavlingData.data.tahap3 = {};
        Object.keys(tahapData).forEach(taskName => {
          if (taskName !== 'LT' && taskName !== 'LB' && taskName !== 'TYPE') {
            currentKavlingData.data.tahap3[taskName] = tahapData[taskName];
          }
        });
      }
      
      updateProgress(rolePage);
    } else {
      showToast('error', result.message || 'Gagal menyimpan tahap 3');
    }
  } catch (error) {
    console.error('Error saving tahap 3:', error);
    showToast('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Tahap 3';
      saveButton.disabled = false;
    }
  }
}

// ========== FUNGSI saveTahap4 (BARU) ==========
async function saveTahap4() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }
  
  const rolePage = currentRole + 'Page';
  const tahap4Section = document.querySelector(`#${rolePage} .progress-section[data-tahap="4"]`);
  if (!tahap4Section) return;
  
  const commentEl = tahap4Section.querySelector('.tahap-comments');
  const deliveryEl = tahap4Section.querySelector('.key-delivery-input');
 const dateEl = tahap4Section.querySelector('.key-delivery-date');
  const saveButton = tahap4Section.querySelector('.btn-save-section');
  // Cari checkbox completion di tahap 4
  let completionCheckbox = tahap4Section.querySelector('.sub-task[data-task="COMPLETION / Penyelesaian akhir"]');
  if (!completionCheckbox) {
    // Cari dengan cara lain jika data-task tidak ada
    const allCheckboxes = tahap4Section.querySelectorAll('.sub-task[type="checkbox"]');
    for (const checkbox of allCheckboxes) {
      const label = checkbox.closest('label');
      if (label && label.textContent.toLowerCase().includes('completion')) {
        completionCheckbox = checkbox;
        break;
      }
    }
  }
  

  const tahapData = {};

   if (completionCheckbox) {
    tahapData['COMPLETION / Penyelesaian akhir'] = completionCheckbox.checked;
    console.log('Completion checked:', completionCheckbox.checked);
  }
  
   if (commentEl) {
    tahapData['KETERANGAN'] = commentEl.value.trim();
    console.log('Keterangan:', tahapData['KETERANGAN']);
  }
  
  // Tambahkan PENYERAHAN KUNCI
  if (deliveryEl) {
    tahapData['PENYERAHAN KUNCI'] = deliveryEl.value.trim();
    console.log('Penyerahan Kunci:', tahapData['PENYERAHAN KUNCI']);
  }

   // Tambahkan TANGGAL_PENYERAHAN_KUNCI
  if (dateEl && dateEl.value) {
    tahapData['TANGGAL_PENYERAHAN_KUNCI'] = dateEl.value;
    console.log('Tanggal:', tahapData['TANGGAL_PENYERAHAN_KUNCI']);
  }
  
  // Tambahkan LT, LB, dan TYPE
  if (currentKavlingData.lt) tahapData['LT'] = currentKavlingData.lt;
  if (currentKavlingData.lb) tahapData['LB'] = currentKavlingData.lb;
  if (currentKavlingData.type) tahapData['TYPE'] = currentKavlingData.type;
 console.log('Tahap 4 data to save:', tahapData);
  
  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }
  
  showGlobalLoading('Mohon Tunggu, Sedang Menyimpan Tahap 4...');
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveTahap4',
      kavling: selectedKavling,
      data: tahapData,
      user: currentRole
    });
    
    hideGlobalLoading();
    
    if (result.success) {
      showToast('success', `Berhasil! Tahap 4 untuk Blok ${selectedKavling} telah tersimpan.`);
      
      // PERBAIKAN PENTING: Update data lokal
      if (currentKavlingData.data) {
        if (!currentKavlingData.data.tahap4) currentKavlingData.data.tahap4 = {};
        
        // Update semua field tahap 4
        Object.keys(tahapData).forEach(taskName => {
          if (taskName !== 'LT' && taskName !== 'LB' && taskName !== 'TYPE') {
            currentKavlingData.data.tahap4[taskName] = tahapData[taskName];
          }
        });
      }
      
      // PERBAIKAN: Update total progress display dengan benar
      if (result.totalProgress) {
        updateTotalProgressDisplay(result.totalProgress, rolePage);
        
        // Update juga di overall rekap
        const overallPercent = document.querySelector(`#${rolePage} .total-percent`);
        const overallBar = document.querySelector(`#${rolePage} .total-bar`);
        
        if (overallPercent) {
          overallPercent.textContent = result.totalProgress;
        }
        if (overallBar) {
          // Parse persentase untuk width
          let percentValue = 0;
          if (typeof result.totalProgress === 'string') {
            const match = result.totalProgress.match(/(\d+)%/);
            if (match) {
              percentValue = parseInt(match[1]);
            }
          }
          overallBar.style.width = percentValue + '%';
        }
      }
      
      // PERBAIKAN: Refresh data kavling untuk mendapatkan progress terbaru dari server
      setTimeout(async () => {
        await searchKavling(); // Ini akan memuat ulang data dengan progress terbaru
        updateProgress(rolePage); // Update perhitungan progress lokal
      }, 300);
      
    } else {
      showToast('error', result.message || 'Gagal menyimpan tahap 4');
    }
    
  } catch (error) {
    console.error('Error saving tahap 4:', error);
    showToast('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Tahap 4';
      saveButton.disabled = false;
    }
  }
}

// ========== SUMMARY REPORT FUNCTIONS ==========
async function loadSummaryReport() {
  try {
    showGlobalLoading('Mengambil laporan summary...');
    
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getSummaryReport'
    });
    
    if (result.success) {
      displaySummaryReport(result);
      // Auto-filter to 'all' to show the list immediately
      setTimeout(() => filterKavlingByProgress('all'), 100);
    } else {
      showToast('error', result.message || 'Gagal mengambil laporan');
    }
    
  } catch (error) {
    console.error('Error loading summary report:', error);
    showToast('error', 'Gagal mengambil laporan');
  } finally {
    hideGlobalLoading();
  }
}

function displaySummaryReport(summaryData) {
  const container = document.getElementById('summaryReportContainer');
  if (!container) return;
  
  console.log("Summary data received:", summaryData);
  
  // Store summary data for filtering
  window.lastSummaryData = summaryData;
  
  // PERBAIKAN: Jika server tidak mengirimkan allKavlings atau items, kita kumpulkan dari kategori
  if (!summaryData.allKavlings && !summaryData.items) {
    summaryData.allKavlings = [
      ...(summaryData.categories?.completed?.items || summaryData.categories?.completed?.kavlings || summaryData.topCompleted || []),
      ...(summaryData.categories?.almostCompleted?.items || summaryData.categories?.almostCompleted?.kavlings || summaryData.topAlmost || []),
      ...(summaryData.categories?.inProgress?.items || summaryData.categories?.inProgress?.kavlings || []),
      ...(summaryData.categories?.lowProgress?.items || summaryData.categories?.lowProgress?.kavlings || summaryData.needAttention || [])
    ];
  }
  
  const timestamp = new Date(summaryData.timestamp || new Date()).toLocaleString('id-ID');
  
  // Ensure we have numbers for the badges
  const totalCount = summaryData.totalKavlings || 
                     (summaryData.items ? summaryData.items.length : 0) || 
                     (summaryData.allKavlings ? summaryData.allKavlings.length : 0) || 0;
  
  const completedCount = summaryData.categories?.completed?.count || 
                         summaryData.completedKavlings?.length || 
                         summaryData.items?.filter(k => (parseInt(k.totalProgress) || 0) >= 89).length || 0;
                         
  const almostCount = summaryData.categories?.almostCompleted?.count || 
                      summaryData.almostCompletedKavlings?.length || 
                      summaryData.items?.filter(k => {
                        const p = parseInt(k.totalProgress) || 0;
                        return p >= 60 && p < 89;
                      }).length || 0;
                      
  const progressCount = summaryData.categories?.inProgress?.count || 
                        summaryData.inProgressKavlings?.length || 
                        summaryData.items?.filter(k => {
                          const p = parseInt(k.totalProgress) || 0;
                          return p >= 10 && p < 60;
                        }).length || 0;
                        
  const lowCount = summaryData.categories?.lowProgress?.count || 
                   summaryData.lowProgressKavlings?.length || 
                   summaryData.items?.filter(k => (parseInt(k.totalProgress) || 0) < 10).length || 0;

  let html = `
    <div class="summary-header">
      <h3><i class="fas fa-chart-bar"></i> Laporan Summary Progress Kavling</h3>
      <p class="summary-timestamp">Diperbarui: ${timestamp}</p>
    </div>
    
    <div class="summary-stats">
      <div class="stat-card stat-total" onclick="filterKavlingByProgress('all')" style="cursor: pointer;">
        <div class="stat-icon">
          <i class="fas fa-home"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${totalCount}</div>
          <div class="stat-label">Total Kavling</div>
        </div>
      </div>
      
      <div class="stat-card stat-completed" onclick="filterKavlingByProgress('completed')" style="cursor: pointer;">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${completedCount}</div>
          <div class="stat-label">Selesai (89-100%)</div>
          <div class="stat-percent">${totalCount > 0 ? Math.round((completedCount/totalCount)*100) : 0}%</div>
        </div>
      </div>
      
      <div class="stat-card stat-almost" onclick="filterKavlingByProgress('almostCompleted')" style="cursor: pointer;">
        <div class="stat-icon">
          <i class="fas fa-hourglass-half"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${almostCount}</div>
          <div class="stat-label">Hampir Selesai (60-88%)</div>
          <div class="stat-percent">${totalCount > 0 ? Math.round((almostCount/totalCount)*100) : 0}%</div>
        </div>
      </div>
      
      <div class="stat-card stat-progress" onclick="filterKavlingByProgress('inProgress')" style="cursor: pointer;">
        <div class="stat-icon">
          <i class="fas fa-tools"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${progressCount}</div>
          <div class="stat-label">Sedang Berjalan (10-59%)</div>
          <div class="stat-percent">${totalCount > 0 ? Math.round((progressCount/totalCount)*100) : 0}%</div>
        </div>
      </div>
      
      <div class="stat-card stat-low" onclick="filterKavlingByProgress('lowProgress')" style="cursor: pointer;">
        <div class="stat-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${lowCount}</div>
          <div class="stat-label">Progress Rendah (0-9%)</div>
          <div class="stat-percent">${totalCount > 0 ? Math.round((lowCount/totalCount)*100) : 0}%</div>
        </div>
      </div>
    </div>

    <div id="filteredKavlingSection">
      <div class="summary-section">
        <p class="no-data">Pilih kategori di atas untuk melihat detail data</p>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

function renderKavlingSection(title, kavlings) {
  if (!kavlings || kavlings.length === 0) {
    return `
      <div class="summary-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h4><i class="fas fa-list"></i> ${title}</h4>
        </div>
        <p class="no-data">Tidak ada data untuk kategori ini</p>
      </div>
    `;
  }

  let html = `
    <div class="summary-section">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h4><i class="fas fa-list"></i> ${title}</h4>
        <button onclick="downloadKavlingToExcel('${title}')" class="btn-save-section" style="width: auto; margin-top: 0; padding: 8px 15px; font-size: 0.9rem; background: linear-gradient(135deg, #10b981, #059669);">
          <i class="fas fa-file-excel"></i> Download Excel
        </button>
      </div>
      <div class="kavling-list">
  `;
  
  kavlings.forEach((kavling, index) => {
    const progressVal = parseInt(kavling.totalProgress) || 0;
    const progressClass = progressVal >= 89 ? 'progress-high' : (progressVal >= 60 ? 'progress-medium' : 'progress-low');
    
    html += `
      <div class="kavling-item">
        <div class="kavling-rank">${index + 1}</div>
        <div class="kavling-info">
          <div class="kavling-name">${kavling.kavling}</div>
          <div class="kavling-details">LT: ${kavling.lt || '-'} | LB: ${kavling.lb || '-'}</div>
        </div>
        <div class="kavling-progress ${progressClass}">${kavling.totalProgress}</div>
      </div>
    `;
  });
  
  html += `</div></div>`;
  return html;
}

function filterKavlingByProgress(category) {
  const summaryData = window.lastSummaryData;
  if (!summaryData) {
    console.error("No summary data found");
    return;
  }

  const sectionContainer = document.getElementById('filteredKavlingSection');
  if (!sectionContainer) {
    console.error("filteredKavlingSection element not found");
    return;
  }

  let title = '';
  let kavlings = [];

  // PERBAIKAN: Ambil items dari data yang benar (beberapa format didukung)
  switch(category) {
    case 'completed':
      title = 'Data Kavling Selesai (89-100%)';
      kavlings = summaryData.categories?.completed?.items || 
                 summaryData.categories?.completed?.kavlings || 
                 summaryData.completedKavlings || 
                 summaryData.topCompleted ||
                 (summaryData.items || summaryData.allKavlings)?.filter(k => (parseInt(k.totalProgress) || 0) >= 89) || [];
      break;
    case 'almostCompleted':
      title = 'Data Kavling Hampir Selesai (60-88%)';
      kavlings = summaryData.categories?.almostCompleted?.items || 
                 summaryData.categories?.almostCompleted?.kavlings || 
                 summaryData.almostCompletedKavlings || 
                 summaryData.topAlmost ||
                 (summaryData.items || summaryData.allKavlings)?.filter(k => {
                   const p = parseInt(k.totalProgress) || 0;
                   return p >= 60 && p < 89;
                 }) || [];
      break;
    case 'inProgress':
      title = 'Data Kavling Sedang Berjalan (10-59%)';
      kavlings = summaryData.categories?.inProgress?.items || 
                 summaryData.categories?.inProgress?.kavlings || 
                 summaryData.inProgressKavlings || 
                 (summaryData.items || summaryData.allKavlings)?.filter(k => {
                   const p = parseInt(k.totalProgress) || 0;
                   return p >= 10 && p < 60;
                 }) || [];
      break;
    case 'lowProgress':
      title = 'Data Kavling Progress Rendah (0-9%)';
      kavlings = summaryData.categories?.lowProgress?.items || 
                 summaryData.categories?.lowProgress?.kavlings || 
                 summaryData.lowProgressKavlings || 
                 summaryData.needAttention ||
                 (summaryData.items || summaryData.allKavlings)?.filter(k => (parseInt(k.totalProgress) || 0) < 10) || [];
      break;
    case 'all':
      title = 'Seluruh Data Kavling';
      // Prioritaskan daftar lengkap
      kavlings = summaryData.allKavlings || summaryData.items || summaryData.kavlings || [];
      break;
    default:
      title = 'Detail Data Kavling';
      kavlings = [];
  }

  console.log(`Filtering for ${category}, found ${kavlings.length} items`);
  sectionContainer.innerHTML = renderKavlingSection(title, kavlings);
  
  // Highlight active card
  document.querySelectorAll('.stat-card').forEach(card => card.classList.remove('active-filter'));
  const activeCardClass = `.stat-${category === 'almostCompleted' ? 'almost' : (category === 'inProgress' ? 'progress' : (category === 'all' ? 'total' : category))}`;
  const activeCard = document.querySelector(activeCardClass);
  if (activeCard) activeCard.classList.add('active-filter');
}

async function saveUtilitasData() {
  if (!selectedKavling) {
    showToast('warning', 'Pilih kavling terlebih dahulu!');
    return;
  }
  
  const listrikDate = document.getElementById('listrikInstallDate')?.value || '';
  const airDate = document.getElementById('airInstallDate')?.value || '';
  const notes = document.getElementById('utilityNotes')?.value || '';
  
  console.log('Saving utilitas data:', { listrikDate, airDate, notes });
  
  showGlobalLoading('Menyimpan data utilitas...');
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveUtilitasData',
      kavling: selectedKavling,
      listrikDate: listrikDate,
      airDate: airDate,
      notes: notes,
      user: 'user4'
    });
    
    if (result.success) {
      showToast('success', 'Data utilitas berhasil disimpan!');
      
      // Update data lokal jika perlu
      if (currentKavlingData) {
        if (!currentKavlingData.utilitas) currentKavlingData.utilitas = {};
        currentKavlingData.utilitas.listrikDate = listrikDate;
        currentKavlingData.utilitas.airDate = airDate;
        currentKavlingData.utilitas.notes = notes;
      }
    } else {
      showToast('error', 'Gagal menyimpan: ' + result.message);
    }
  } catch (error) {
    console.error('Error saving utilitas:', error);
    showToast('error', 'Error: ' + error.message);
  } finally {
    hideGlobalLoading();
  }
}

function setupUser4Page() {
  console.log('Setting up User4 page...');
  
  // Setup tabs
  setupUser4Tabs();
  
  // Setup save button untuk utilitas
  const btnSaveUtility = document.getElementById('btnSaveUtility');
  if (btnSaveUtility) {
    // Hapus listener lama jika ada
    const newBtn = btnSaveUtility.cloneNode(true);
    btnSaveUtility.parentNode.replaceChild(newBtn, btnSaveUtility);
    
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      saveUtilitasData();
    });
  }
  
  // Setup save buttons untuk mutasi kunci
  setupMutasiButtons();
  
  // Setup dropdown search
  const searchSelect = document.getElementById('searchKavlingUser4');
  if (searchSelect) {
    searchSelect.addEventListener('change', function() {
      if (this.value) {
        searchKavling();
      }
    });
  }
  
  console.log('User4 page setup complete');
}

function setupMutasiButtons() {
  // Button mutasi masuk
  const btnMutasiMasuk = document.querySelector('#tab-kunci-masuk .btn-save-section');
  if (btnMutasiMasuk) {
    btnMutasiMasuk.addEventListener('click', function(e) {
      e.preventDefault();
      saveMutasi('masuk');
    });
  }
  
  // Button mutasi keluar
  const btnMutasiKeluar = document.querySelector('#tab-kunci-keluar .btn-save-section');
  if (btnMutasiKeluar) {
    btnMutasiKeluar.addEventListener('click', function(e) {
      e.preventDefault();
      saveMutasi('keluar');
    });
  }
  
  // Button mutasi HO
  const btnMutasiHO = document.querySelector('#tab-ho-user .btn-save-section');
  if (btnMutasiHO) {
    btnMutasiHO.addEventListener('click', function(e) {
      e.preventDefault();
      saveMutasi('ho');
    });
  }
}

async function saveMutasi(type) {
  if (!selectedKavling) {
    showToast('warning', 'Pilih kavling terlebih dahulu!');
    return;
  }
  
  let dariInput, keInput, tglInput;
  
  switch(type) {
    case 'masuk':
      dariInput = document.querySelector('.input-mutasi-masuk-dari');
      keInput = document.querySelector('.input-mutasi-masuk-ke');
      tglInput = document.querySelector('.input-mutasi-masuk-tgl');
      break;
    case 'keluar':
      dariInput = document.querySelector('.input-mutasi-keluar-dari');
      keInput = document.querySelector('.input-mutasi-keluar-ke');
      tglInput = document.querySelector('.input-mutasi-keluar-tgl');
      break;
    case 'ho':
      dariInput = document.querySelector('.input-mutasi-ho-dari');
      keInput = document.querySelector('.input-mutasi-ho-ke');
      tglInput = document.querySelector('.input-mutasi-ho-tgl');
      break;
  }
  
  const dari = dariInput?.value || '';
  const ke = keInput?.value || '';
  const tgl = tglInput?.value || '';
  
  if (!dari || !ke) {
    showToast('warning', 'Nama pemberi dan penerima harus diisi!');
    return;
  }
  
  showGlobalLoading('Menyimpan mutasi kunci...');
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveMutasi',
      kavling: selectedKavling,
      type: type,
      dari: dari,
      ke: ke,
      tanggal: tgl,
      user: 'user4'
    });
    
    if (result.success) {
      showToast('success', `Mutasi kunci ${type} berhasil disimpan!`);
      
      // Reset form jika berhasil
      if (dariInput) dariInput.value = '';
      if (keInput) keInput.value = '';
      if (tglInput) tglInput.value = '';
    } else {
      showToast('error', 'Gagal menyimpan: ' + result.message);
    }
  } catch (error) {
    console.error('Error saving mutasi:', error);
    showToast('error', 'Error: ' + error.message);
  } finally {
    hideGlobalLoading();
  }
}

function downloadKavlingToExcel(title) {
  // Simple CSV generation as a proxy for Excel since we are in client-side JS without heavy libraries
  const sectionContainer = document.getElementById('filteredKavlingSection');
  const items = sectionContainer.querySelectorAll('.kavling-item');
  
  if (items.length === 0) {
    showToast('warning', 'Tidak ada data untuk didownload');
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "No,Kavling,LT,LB,Progress\n";

  items.forEach(item => {
    const rank = item.querySelector('.kavling-rank').textContent;
    const name = item.querySelector('.kavling-name').textContent;
    const details = item.querySelector('.kavling-details').textContent;
    const progress = item.querySelector('.kavling-progress').textContent;
    
    // Parse details LT: 72 | LB: 36
    const lt = details.match(/LT: (.*?) \|/) ? details.match(/LT: (.*?) \|/)[1] : '-';
    const lb = details.match(/LB: (.*)$/) ? details.match(/LB: (.*)$/)[1] : '-';

    csvContent += `"${rank}","${name}","${lt}","${lb}","${progress}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${title.replace(/\s+/g, '_')}_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('success', 'Laporan berhasil didownload');
}

// ========== ADMIN FUNCTIONS ==========
async function loadActivityLog() {
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getActivityLog',
      limit: 20
    });
    
    if (result.success && result.logs) {
      displayActivityLog(result.logs);
    }
    
  } catch (error) {
    console.error('Error loading activity log:', error);
  }
}

function displayActivityLog(logs) {
  const container = document.getElementById('activityLogContainer');
  if (!container) return;
  
  if (logs.length === 0) {
    container.innerHTML = '<p class="no-data">Belum ada aktivitas yang tercatat</p>';
    return;
  }
  
  let html = `
    <div class="activity-header">
      <h4><i class="fas fa-history"></i> Log Aktivitas Terakhir</h4>
      <span class="activity-count">${logs.length} aktivitas</span>
    </div>
    <div class="activity-list">
  `;
  
  logs.forEach(log => {
    const time = new Date(log.timestamp).toLocaleString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
    
    const icon = log.action === 'LOGIN' ? 'sign-in-alt' :
                 log.action.includes('UPDATE') ? 'edit' :
                 log.action === 'ADD_KAVLING' ? 'plus-circle' :
                 log.action === 'EXPORT_REPORT' ? 'file-export' : 'info-circle';
    
    html += `
      <div class="activity-item">
        <div class="activity-icon">
          <i class="fas fa-${icon}"></i>
        </div>
        <div class="activity-content">
          <div class="activity-title">${log.description || log.action}</div>
          <div class="activity-details">
            ${log.kavling ? `<span class="activity-kavling">${log.kavling}</span>` : ''}
            ${log.user ? `<span class="activity-user">${log.user}</span>` : ''}
            <span class="activity-time">${time}</span>
          </div>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  container.innerHTML = html;
}

async function loadUsersForAdmin() {
  try {
    showGlobalLoading('Memuat data pengguna...');
    
    const result = await getDataFromServer(USER_APPS_SCRIPT_URL, {
      action: 'getUsers'
    });
    
    if (result.success && result.users) {
      displayUsersForAdmin(result.users);
    } else {
      showToast('error', result.message || 'Gagal memuat data pengguna');
    }
    
  } catch (error) {
    console.error('Error loading users:', error);
    showToast('error', 'Gagal memuat data pengguna');
  } finally {
    hideGlobalLoading();
  }
}

function displayUsersForAdmin(users) {
  const container = document.getElementById('usersListContainer');
  if (!container) return;
  
  if (!users || users.length === 0) {
    container.innerHTML = '<p class="no-data">Tidak ada data pengguna</p>';
    return;
  }
  
  let html = `
    <div class="users-header">
      <h4><i class="fas fa-users"></i> Daftar Pengguna</h4>
      <span class="users-count">${users.length} pengguna</span>
    </div>
    <div class="users-list">
  `;
  
  users.forEach(user => {
    const roleName = defaultDisplayNames[user.role] || user.role;
    
    html += `
      <div class="user-item">
        <div class="user-info">
          <div class="user-role">
            <span class="role-name">${roleName}</span>
            <span class="role-code">(${user.role})</span>
          </div>
          <div class="user-name">
            <i class="fas fa-user"></i> ${user.displayName || '-'}
          </div>
          <div class="user-password">
            <i class="fas fa-key"></i> ${user.password ? '••••••••' : 'Tidak ada'}
          </div>
          <div class="user-id">
            <i class="fas fa-hashtag"></i> Baris: ${user.id}
          </div>
        </div>
        <div class="user-actions">
          <button class="btn-edit-user" onclick="handleEditUser('${user.role}', '${user.displayName}', '${user.id}')">
            <i class="fas fa-user-edit"></i> Edit
          </button>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  container.innerHTML = html;
}

// ========== TAMBAH KAVLING BARU ==========
async function submitNewKavling() {
  console.log('submitNewKavling called');
  const nameInput = document.getElementById('newKavlingName');
  const ltInput = document.getElementById('newKavlingLT');
  const lbInput = document.getElementById('newKavlingLB');
  const typeInput = document.getElementById('newKavlingType');
  const submitBtn = document.getElementById('submitNewKavling');
  
 if (!nameInput || !ltInput || !lbInput) { 
    console.error('Missing inputs:', {
      nameInput: !!nameInput,
      ltInput: !!ltInput,
      lbInput: !!lbInput,
      typeInput: !!typeInput
    });
    showToast('error', 'Form tidak lengkap!');
    return;
  }
  
  const name = nameInput.value.trim();
  const lt = ltInput.value.trim();
  const lb = lbInput.value.trim(); 
  const type = typeInput.value.trim();
  
  console.log('Kavling data:', { name, lt, lb, type });

  if (!name) { 
    showToast('error', 'Nama kavling harus diisi');
    nameInput.focus();
    return;
  }
  
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    submitBtn.disabled = true;
  }
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'addNewKavling',
      name: name, 
      lt: lt || '',
      lb: lb || '',
      type: type || '',
      createdBy: currentRole || 'admin'
    });
    
    console.log('Server result:', result);

    if (result.success) {
      showToast('success', result.message || 'Kavling berhasil ditambahkan');
      
      // Reset form
      nameInput.value = '';
      ltInput.value = '';
      lbInput.value = '';
      typeInput.value = '';
      
      // Tutup modal
      const modal = document.getElementById('addKavlingModal');
      if (modal) modal.style.display = 'none';
      
      // Refresh daftar kavling
      await loadKavlingList();
      
    } else {
      showToast('error', result.message || 'Gagal menambahkan kavling');
    }
  } catch (error) {
    console.error('Error adding kavling:', error);
    showToast('error', 'Gagal menambahkan kavling: ' + error.message);
  } finally {
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Kavling Baru';
      submitBtn.disabled = false;
    }
  }
}

// ========== LOGIN & SESSION ==========
async function handleLogin() {
  const passwordInput = document.getElementById('passwordInput');
  const errorMsg = document.getElementById('errorMessage');
  const submitBtn = document.getElementById('submitPassword');
  
  if (!passwordInput || !currentRole) return;
  
  const password = passwordInput.value.trim();
  if (!password) {
    if (errorMsg) errorMsg.textContent = 'Password harus diisi!';
    showToast('warning', 'Password harus diisi');
    return;
  }
  
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memverifikasi...';
  }
  
  try {
    const result = await getDataFromServer(USER_APPS_SCRIPT_URL, {
      action: 'login',
      role: currentRole,
      password: password
    });
    
    if (result.success) {
      sessionStorage.setItem('loggedRole', currentRole);
      sessionStorage.setItem('loggedDisplayName', result.displayName);
      sessionStorage.setItem('loginTime', new Date().toISOString());
      
      document.querySelectorAll(`[data-role="${currentRole}"] h3`).forEach(el => {
        el.textContent = result.displayName;
      });
      
      updateDashboardTitle(currentRole, result.displayName);
      
      const modal = document.getElementById('passwordModal');
      if (modal) modal.style.display = 'none';
      
      showToast('success', `Login berhasil sebagai ${result.displayName}`);
      showPage(currentRole);
      
    } else {
      if (errorMsg) errorMsg.textContent = result.message || 'Password salah!';
      showToast('error', 'Password salah');
      passwordInput.value = '';
      passwordInput.focus();
    }
    
  } catch (error) {
    console.error('Login error:', error);
    if (errorMsg) errorMsg.textContent = 'Gagal menghubungi server';
    showToast('error', 'Gagal menghubungi server');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Masuk';
    }
  }
}

function updateDashboardTitle(role, name) {
  const titleIds = {
    'user1': 'user1Title',
    'user2': 'user2Title',
    'user3': 'user3Title',
    'user4': 'user4Title',
    'manager': 'managerTitle',
    'admin': 'adminTitle'
  };
  
  const el = document.getElementById(titleIds[role]);
  if (el) {
    const prefix = role === 'manager' ? 'Dashboard' : (role === 'admin' ? 'Panel' : 'Dashboard');
    el.textContent = `${prefix} ${name}`;
  }

  // Reset selected kavling when entering dashboard
  selectedKavling = null;
  currentKavlingData = null;
  
  // Clear all kavling dropdowns
  const selectIds = ['searchKavlingUser1', 'searchKavlingUser2', 'searchKavlingUser3', 'searchKavlingUser4', 'searchKavlingManager'];
  selectIds.forEach(id => {
    const select = document.getElementById(id);
    if (select) select.value = '';
  });

  // Clear info displays
  const infoIds = ['kavlingInfoUser1', 'kavlingInfoUser2', 'kavlingInfoUser3', 'kavlingInfoUser4', 'kavlingInfoManager'];
  infoIds.forEach(id => {
    const info = document.getElementById(id);
    if (info) {
      if (id === 'kavlingInfoManager') {
        info.innerHTML = `
          <div class="info-item"><span class="info-label">Blok/Kavling:</span><span class="info-value val-name">-</span></div>
          <div class="info-item"><span class="info-label">Type:</span><span class="info-value val-type">-</span></div>
          <div class="info-item"><span class="info-label">Luas Tanah (LT):</span><span class="info-value val-lt">-</span></div>
          <div class="info-item"><span class="info-label">Luas Bangunan (LB):</span><span class="info-value val-lb">-</span></div>
        `;
      } else {
        info.innerHTML = `
         <div class="info-item"><span class="info-label">Blok/Kavling:</span><span class="info-value val-name">-</span></div>
          <div class="info-item"><span class="info-label">Type:</span><span class="info-value val-type">-</span></div>
          <div class="info-item"><span class="info-label">LT:</span><span class="info-value val-lt">-</span></div>
          <div class="info-item"><span class="info-label">LB:</span><span class="info-value val-lb">-</span></div>
        `;
      }
    }
  });

  // Reset specific displays
  if (role === 'manager') {
    const progressDisplay = document.getElementById('managerProgressDisplay');
    if (progressDisplay) progressDisplay.style.display = 'none';
    const notesEl = document.getElementById('propertyNotesManager');
    if (notesEl) {
      notesEl.value = '';
      notesEl.placeholder = 'Pilih kavling terlebih dahulu untuk melihat catatan';
    }
  } else {
    const pageId = role + 'Page';
    updateTotalProgressDisplay('0%', pageId);
    // Reset checkboxes
    const checkboxes = document.querySelectorAll(`#${pageId} .sub-task`);
    checkboxes.forEach(cb => {
      cb.checked = false;
      const label = cb.closest('label');
      if (label) label.classList.remove('task-completed');
    });
    const subPercents = document.querySelectorAll(`#${pageId} .sub-percent`);
    subPercents.forEach(el => el.textContent = '0%');
    const fills = document.querySelectorAll(`#${pageId} .progress-fill`);
    fills.forEach(el => el.style.width = '0%');
  }
}

function setupUser4Tabs() {
  const page = document.getElementById('user4Page');
  if (!page) return;
  
  const tabBtns = page.querySelectorAll('.admin-tab-btn');
  const tabContents = page.querySelectorAll('.tab-content-item');
  
  console.log('Setting up User4 tabs, count:', tabBtns.length);

  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      console.log('User4 Tab clicked:', tabId);
      
      // Hapus active dari semua tombol dan konten di halaman ini
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Tambah active ke yang dipilih
      this.classList.add('active');
      const targetTab = page.querySelector('#tab-' + tabId);
      if (targetTab) {
        targetTab.classList.add('active');
      }
    });
  });
}

function showPage(role) {
  document.querySelectorAll('.page-content').forEach(page => {
    page.style.display = 'none';
  });
  
  document.querySelectorAll('.section-container').forEach(container => {
    container.style.display = 'none';
  });
  
  const pageElement = document.getElementById(role + 'Page');
  if (pageElement) {
    pageElement.style.display = 'block';
    pageElement.setAttribute('aria-hidden', 'false');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const savedName = sessionStorage.getItem('loggedDisplayName');
    if (savedName) updateDashboardTitle(role, savedName);
    
    updateProgress(role + 'Page');
    
    if (role === 'admin') {
      setTimeout(() => {
        loadUsersForAdmin();
        setupAdminTabs();
      }, 500);
    } else if (role === 'manager') {
      setTimeout(() => {
        loadKavlingList();
        setupManagerTabs();
      }, 500);
    } else if (role === 'user1') {
      setTimeout(() => {
        loadKavlingList();
        setupPelaksanaTabs();
      }, 500);
    } else if (role === 'user4') {
      setTimeout(() => {
        loadKavlingList();
        setupUser4Tabs();
      }, 500);
    } else {
      setTimeout(loadKavlingList, 500);
    }
  }
}

function setupPelaksanaTabs() {
  const roles = ['user1', 'user2', 'user3'];
  
  roles.forEach(role => {
    const pageId = role + 'Page';
    const page = document.getElementById(pageId);
    if (!page) return;
    
    const tabBtns = page.querySelectorAll('.admin-tab-btn');
    const tabContents = page.querySelectorAll('.tab-content-item');
    
    console.log(`Setting up pelaksana tabs for ${role}, count:`, tabBtns.length);

    // Set active tab pertama kali jika belum ada yang active
    if (tabBtns.length > 0 && !page.querySelector('.admin-tab-btn.active')) {
      tabBtns[0].classList.add('active');
      const firstTabId = tabBtns[0].getAttribute('data-tab');
      const firstTab = page.querySelector(`#tab-${firstTabId}`);
      if (firstTab) firstTab.classList.add('active');
      page.setAttribute('data-active-tab', firstTabId);
    } else {
      const currentActiveBtn = page.querySelector('.admin-tab-btn.active');
      if (currentActiveBtn) {
        page.setAttribute('data-active-tab', currentActiveBtn.getAttribute('data-tab'));
      }
    }

    tabBtns.forEach(btn => {
      // Remove old listener and add new one
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        console.log(`Tab clicked for ${role}:`, tabId);
        
        // Re-select fresh buttons and contents after clones
        const allBtns = page.querySelectorAll('.admin-tab-btn');
        const allContents = page.querySelectorAll('.tab-content-item');
        
        // Reset
        allBtns.forEach(b => b.classList.remove('active'));
        allContents.forEach(c => c.classList.remove('active'));
        
        // Set active
        this.classList.add('active');
        const targetTab = page.querySelector(`#tab-${tabId}`);
        if (targetTab) {
          targetTab.classList.add('active');
        }

        // Update parent data attribute
        page.setAttribute('data-active-tab', tabId);
      });
    });
  });
}

function goBack() {
  document.querySelectorAll('.section-container').forEach(container => {
    container.style.display = 'block';
  });
  
  document.querySelectorAll('.page-content').forEach(page => {
    page.style.display = 'none';
    page.setAttribute('aria-hidden', 'true');
  });
}

function clearSession() {
  sessionStorage.removeItem('loggedRole');
  sessionStorage.removeItem('loggedDisplayName');
  sessionStorage.removeItem('loginTime');
  currentRole = null;
  selectedKavling = null;
  currentKavlingData = null;
}

// ========== SYNC & SETUP ==========
async function syncData() {
  const rolePage = currentRole + 'Page';
  const syncBtn = document.querySelector(`#${rolePage} .sync-btn`);
  
  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Sinkronisasi...';
  }
  
  try {
    showGlobalLoading('Sinkronisasi data...');
    await loadKavlingList();
    
    // Clear selections and reset UI
    selectedKavling = null;
    currentKavlingData = null;
    
    // Clear all dropdowns
    const selectIds = ['searchKavlingUser1', 'searchKavlingUser2', 'searchKavlingUser3', 'searchKavlingUser4', 'searchKavlingManager'];
    selectIds.forEach(id => {
      const select = document.getElementById(id);
      if (select) select.value = '';
    });

    // Clear info displays
    const infoIds = ['kavlingInfoUser1', 'kavlingInfoUser2', 'kavlingInfoUser3', 'kavlingInfoUser4', 'kavlingInfoManager'];
    infoIds.forEach(id => {
      const info = document.getElementById(id);
      if (info) {
        if (id === 'kavlingInfoManager') {
          info.innerHTML = `
            <div class="info-item"><span class="info-label">Blok/Kavling:</span><span class="info-value val-name">-</span></div>
            <div class="info-item"><span class="info-label">Type:</span><span class="info-value val-type">-</span></div>
            <div class="info-item"><span class="info-label">Luas Tanah (LT):</span><span class="info-value val-lt">-</span></div>
            <div class="info-item"><span class="info-label">Luas Bangunan (LB):</span><span class="info-value val-lb">-</span></div>
          `;
        } else {
          info.innerHTML = `
            <div class="info-item"><span class="info-label">Blok/Kavling:</span><span class="info-value val-name">-</span></div>
            <div class="info-item"><span class="info-label">Type:</span><span class="info-value val-type">-</span></div>
            <div class="info-item"><span class="info-label">LT:</span><span class="info-value val-lt">-</span></div>
            <div class="info-item"><span class="info-label">LB:</span><span class="info-value val-lb">-</span></div>
          `;
        }
      }
    });

    // Reset specific displays
    if (currentRole === 'manager') {
      const progressDisplay = document.getElementById('managerProgressDisplay');
      if (progressDisplay) progressDisplay.style.display = 'none';
      const notesEl = document.getElementById('propertyNotesManager');
      if (notesEl) {
        notesEl.value = '';
        notesEl.placeholder = 'Pilih kavling terlebih dahulu untuk melihat catatan';
      }
    } else {
      updateTotalProgressDisplay('0%', rolePage);
      const checkboxes = document.querySelectorAll(`#${rolePage} .sub-task`);
      checkboxes.forEach(cb => {
        cb.checked = false;
        const label = cb.closest('label');
        if (label) label.classList.remove('task-completed');
      });
      const subPercents = document.querySelectorAll(`#${rolePage} .sub-percent`);
      subPercents.forEach(el => el.textContent = '0%');
      const fills = document.querySelectorAll(`#${rolePage} .progress-fill`);
      fills.forEach(el => el.style.width = '0%');
    }

    showToast('success', 'Data berhasil disinkronisasi dan tampilan dibersihkan!');
  } catch (error) {
    console.error('Sync error:', error);
    showToast('error', 'Gagal sinkronisasi data');
  } finally {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sinkronkan Data';
    }
    hideGlobalLoading();
  }
}

// ========== TAB FUNCTIONS ==========
function setupManagerTabs() {
  const tabBtns = document.querySelectorAll('#managerPage .admin-tab-btn, #user4Page .admin-tab-btn');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      const parentPage = this.closest('.page-content');
      
      const siblingBtns = parentPage.querySelectorAll('.admin-tab-btn');
      const siblingContents = parentPage.querySelectorAll('.tab-content-item');
      
      // Hapus active dari saudara
      siblingBtns.forEach(b => b.classList.remove('active'));
      siblingContents.forEach(c => c.classList.remove('active'));
      
      // Tambah active ke yang dipilih
      this.classList.add('active');
      const targetTab = document.getElementById(`tab-${tabId}`);
      if (targetTab) {
        targetTab.classList.add('active');
        
        // Load data sesuai tab (Manager)
        if (parentPage.id === 'managerPage') {
          if (tabId === 'reports') {
            setTimeout(loadSummaryReport, 100);
          } else if (tabId === 'notes' && selectedKavling) {
            loadPropertyNotes(selectedKavling);
          }
        }
      }
    });
  });
}

function setupAdminTabs() {
  const tabBtns = document.querySelectorAll('#adminPage .admin-tab-btn');
  const tabContents = document.querySelectorAll('#adminPage .tab-content-item');
  
  // Set active tab pertama kali
  if (tabBtns.length > 0 && !document.querySelector('#adminPage .admin-tab-btn.active')) {
    tabBtns[0].classList.add('active');
    const firstTabId = tabBtns[0].getAttribute('data-tab');
    const firstTab = document.getElementById(`tab-${firstTabId}-admin`);
    if (firstTab) firstTab.classList.add('active');
  }
  
  // Tambahkan tombol sync di tab laporan admin
  const adminButtons = document.getElementById('adminButtons');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      
      // Hapus active dari semua
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Tambah active ke yang dipilih
      this.classList.add('active');
      const targetTab = document.getElementById(`tab-${tabId}-admin`);
      if (targetTab) {
        targetTab.classList.add('active');
        
        // Jika tab laporan, load report dan tambahkan tombol sync
        if (tabId === 'reports') {
          setTimeout(loadSummaryReport, 100);
          
          // Tambahkan tombol sync jika belum ada
          if (!document.querySelector('#adminButtons .sync-btn')) {
            const syncBtn = document.createElement('button');
            syncBtn.className = 'sync-btn combined-btn';
            syncBtn.type = 'button';
            syncBtn.style.cssText = 'background: linear-gradient(135deg, #f59e0b, #d97706); padding:8px 12px; border-radius:10px; color:white; border:none; font-weight:700; font-size: 0.9rem; cursor: pointer;';
            syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sinkronkan Data';
            syncBtn.addEventListener('click', syncData);
            adminButtons.appendChild(syncBtn);
          }
        } else {
          // Hapus tombol sync jika ada
          const existingSyncBtn = document.querySelector('#adminButtons .sync-btn');
          if (existingSyncBtn) {
            existingSyncBtn.remove();
          }
        }
        
        // Load data sesuai tab
        if (tabId === 'users') {
          setTimeout(loadUsersForAdmin, 100);
        } else if (tabId === 'activity') {
          setTimeout(loadActivityLog, 100);
        }
      }
    });
  });
}

function setupDynamicEventListeners() {
  console.log('Setting up dynamic event listeners...');
  
  // 1. Tombol tambah kavling
  document.querySelectorAll('.btn-add-kavling').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = document.getElementById('addKavlingModal');
      if (modal) modal.style.display = 'flex';
    });
  });
  
  // 2. Tombol submit tambah kavling
  const submitNewKavlingBtn = document.getElementById('submitNewKavling');
  if (submitNewKavlingBtn) {
    submitNewKavlingBtn.addEventListener('click', (e) => {
      e.preventDefault();
      submitNewKavling();
    });
  }
  
  // 3. Tombol close modal tambah kavling
  const closeAddKavlingBtn = document.getElementById('closeAddKavling');
  if (closeAddKavlingBtn) {
    closeAddKavlingBtn.addEventListener('click', () => {
      document.getElementById('addKavlingModal').style.display = 'none';
    });
  }
  
  // 4. Tombol sync
  document.querySelectorAll('.sync-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      syncData();
    });
  });
  
  // 5. Tombol logout
  document.querySelectorAll('.logout-btn').forEach(btn => {
    // Hapus event listener lama
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    // Tambah event listener baru
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('Apakah Anda yakin ingin logout?')) {
        clearSession();
        goBack();
      }
    });
  });

  // 6. Tombol save catatan manager
  const managerSaveNotesBtn = document.querySelector('#tab-notes .btn-save-section');
  if (managerSaveNotesBtn) {
    managerSaveNotesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      savePropertyNotes();
    });
  }

  // 7. Tombol save tahap progress
  document.querySelectorAll('.btn-save-section:not(#tab-notes .btn-save-section)').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    // Tambah listener baru
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Save button clicked:', this);
      
      // PERBAIKAN: Cari .progress-section dengan benar
      const progressSection = this.closest('.progress-section');
      console.log('Closest progress section:', progressSection);
      
      if (progressSection) {
        const tahap = progressSection.getAttribute('data-tahap');
        console.log(`Processing tahap ${tahap}`);
        
        if (tahap === '1') {
          console.log('Calling saveTahap1');
          saveTahap1();
        } else if (tahap === '2') {
          console.log('Calling saveTahap2');
          saveTahap2();
        } else if (tahap === '3') {
          console.log('Calling saveTahap3');
          saveTahap3();
        } else if (tahap === '4') {
          console.log('Calling saveTahap4');
          saveTahap4();
        } else {
          console.log('Unknown tahap:', tahap);
        }
      } else {
        console.error('No progress section found for this button!');
        console.log('Parent structure:', this.parentElement);
        
        // Fallback: Coba ambil data-tahap dari tombol itu sendiri
        const tahapFromBtn = this.getAttribute('data-tahap');
        if (tahapFromBtn === '4') {
          console.log('Fallback: Calling saveTahap4 from button attribute');
          saveTahap4();
        }
      }
    });
  });
  
  // 8. Dropdown kavling
  const selectIds = ['searchKavlingUser1', 'searchKavlingUser2', 'searchKavlingUser3', 'searchKavlingUser4', 'searchKavlingManager'];
  selectIds.forEach(selectId => {
    const el = document.getElementById(selectId);
    if (el) {
      // Hapus event listener lama
      const newEl = el.cloneNode(true);
      el.parentNode.replaceChild(newEl, el);
      
      // Tambah event listener baru
      newEl.addEventListener('change', () => {
        console.log('Kavling dropdown changed:', selectId);
        searchKavling();
      });
    }
  });
  
  // 9. Tombol close modal
  document.querySelectorAll('.close-btn').forEach(btn => {
    if (!btn.id || !btn.id.includes('AddKavling')) {
      btn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        if (modal) modal.style.display = 'none';
      });
    }
  });
  
  // 10. Tutup modal ketika klik di luar konten modal
  window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      // PERBAIKAN: Jangan tutup modal jika yang diklik adalah addKavlingModal
      if (event.target === modal && modal.id !== 'addKavlingModal') {
        modal.style.display = 'none';
      }
    });
  });
  
  // 11. Setup admin tabs jika di halaman admin
  if (document.getElementById('adminPage')) {
    setupAdminTabs();
  }
  
  // 12. Setup manager tabs jika di halaman manager
  if (document.getElementById('managerPage')) {
    setupManagerTabs();
  }
  
  // 13. Setup pelaksana tabs
  if (document.getElementById('user1Page') || document.getElementById('user2Page') || document.getElementById('user3Page')) {
    setupPelaksanaTabs();
  }
  
  // 14. Setup user4 tabs jika di halaman user4
  if (document.getElementById('user4Page')) {
    setupUser4Tabs();
  }
  
  console.log('Dynamic event listeners setup complete');
}

// ========== INITIALIZE ON DOM READY ==========
function initApp() {
  console.log('=== INITIALIZING APP ===');
  
  // Setup semua event listener
  setupDynamicEventListeners();
  
  // Setup tombol role di halaman utama
  setupRoleButtons();
  
  // Setup tombol submit password
  const submitPasswordBtn = document.getElementById('submitPassword');
  if (submitPasswordBtn) {
    submitPasswordBtn.addEventListener('click', handleLogin);
  }
  
  // Setup enter key untuk password input
  const passwordInput = document.getElementById('passwordInput');
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleLogin();
      }
    });
  }
  
  // Cek session login
  const savedRole = sessionStorage.getItem('loggedRole');
  if (savedRole) {
    currentRole = savedRole;
    showPage(savedRole);
  }
  
  console.log('=== APP INITIALIZED ===');
}

// Fungsi khusus untuk setup tombol role
function setupRoleButtons() {
  const roleButtons = document.querySelectorAll('.role-btn');
  console.log(`Found ${roleButtons.length} role buttons`);
  
  roleButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Role button clicked:', this.getAttribute('data-role'));
      
      currentRole = this.getAttribute('data-role');
      const modal = document.getElementById('passwordModal');
      
      if (modal) {
        // Reset modal state
        document.getElementById('errorMessage').textContent = '';
        document.getElementById('passwordInput').value = '';
        
        modal.style.display = 'flex';
        document.getElementById('passwordInput').focus();
        
        // Update modal title berdasarkan role
        const roleNames = {
          'user1': 'Pelaksana 1',
          'user2': 'Pelaksana 2', 
          'user3': 'Pelaksana 3',
          'user4': 'Admin Utilitas',
          'manager': 'Supervisor',
          'admin': 'AdminSystemWeb'
        };
        
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
          modalTitle.textContent = `Login sebagai ${roleNames[currentRole] || currentRole}`;
        }
      }
    });
  });
}

// Event listener untuk checkbox
document.addEventListener('change', function(e) {
  if (e.target.classList.contains('sub-task')) {
    const rolePage = currentRole + 'Page';
    updateProgress(rolePage);
  }
});

// ========== START APPLICATION ==========
// Tunggu DOM siap sepenuhnya
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM sudah siap
  initApp();
}

// Fungsi untuk edit user (placeholder)
function handleEditUser(role, displayName, id) {
  showToast('info', 'Fitur edit pengguna akan segera hadir');
  console.log('Edit user:', { role, displayName, id });
}

// Fungsi untuk toggle tombol sistem pembuangan
function toggleSystemButton(button, systemType) {
  const taskItem = button.closest('.task-item');
  const buttons = taskItem.querySelectorAll('.system-btn');
  const hiddenInput = taskItem.querySelector('#wasteSystemInput');
  
  const wasActive = button.classList.contains('active');

  // Reset semua tombol
  buttons.forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('data-active', 'false');
  });
  
  if (wasActive) {
    hiddenInput.value = '';
  } else {
    // Aktifkan tombol yang diklik
    button.classList.add('active');
    button.setAttribute('data-active', 'true');
    hiddenInput.value = systemType;
  }
  
  const rolePage = currentRole + 'Page';
  updateProgress(rolePage);
}

// Fungsi untuk toggle tombol keramik dinding
function toggleTilesButton(button, option) {
  const taskItem = button.closest('.task-item');
  const buttons = taskItem.querySelectorAll('.tiles-btn');
  const hiddenInput = taskItem.querySelector('#bathroomTilesInput');
  
  const wasActive = button.classList.contains('active');

  // Reset semua tombol
  buttons.forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('data-active', 'false');
  });
  
  if (wasActive) {
    hiddenInput.value = '';
  } else {
    // Aktifkan tombol yang diklik
    button.classList.add('active');
    button.setAttribute('data-active', 'true');
    hiddenInput.value = option;
  }
  
  const rolePage = currentRole + 'Page';
  updateProgress(rolePage);
}

// Fungsi untuk toggle tombol cor meja dapur
function toggleTableButton(button, option) {
  const taskItem = button.closest('.task-item');
  const buttons = taskItem.querySelectorAll('.table-btn');
  const hiddenInput = taskItem.querySelector('#tableKitchenInput');
  
  const wasActive = button.classList.contains('active');

  // Reset semua tombol
  buttons.forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('data-active', 'false');
  });
  
  if (wasActive) {
    hiddenInput.value = '';
  } else {
    // Aktifkan tombol yang diklik
    button.classList.add('active');
    button.setAttribute('data-active', 'true');
    hiddenInput.value = option;
  }
  
  const rolePage = currentRole + 'Page';
  updateProgress(rolePage);
}

// Setup Delete Kavling button
function setupDeleteKavling() {
  const btnDelete = document.getElementById('btnDeleteKavling');
  if (btnDelete) {
    btnDelete.addEventListener('click', async function() {
      if (!selectedKavling) {
        showToast('warning', 'Pilih kavling yang akan dihapus terlebih dahulu!');
        return;
      }
      
      const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus kavling ${selectedKavling}? Tindakan ini tidak dapat dibatalkan.`);
      
      if (confirmDelete) {
        showGlobalLoading(`Menghapus kavling ${selectedKavling}...`);
        
        try {
          const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
            action: 'deleteKavling',
            kavling: selectedKavling
          });
          
          if (result.success) {
            showToast('success', `Kavling ${selectedKavling} berhasil dihapus.`);
            selectedKavling = null;
            currentKavlingData = null;
            // Reload list
            await loadKavlingList();
            // Reset display
            const infoId = getKavlingInfoIdByRole(currentRole);
            const infoDisplay = document.getElementById(infoId);
            if (infoDisplay) {
              infoDisplay.innerHTML = `
                <div class="info-item">
                  <span class="info-label">Blok/Kavling:</span>
                  <span class="info-value val-name">-</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Type:</span>
                  <span class="info-value val-type">-</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Luas Tanah (LT):</span>
                  <span class="info-value val-lt">-</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Luas Bangunan (LB):</span>
                  <span class="info-value val-lb">-</span>
                </div>
              `;
            }
          } else {
            showToast('error', 'Gagal menghapus: ' + result.message);
          }
        } catch (error) {
          showToast('error', 'Error: ' + error.message);
        } finally {
          hideGlobalLoading();
        }
      }
    });
  }
}

// ========== START APPLICATION ==========
// Tambahkan event listener untuk DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('=== DOM CONTENT LOADED ===');
  initApp();
  setupDeleteKavling();
});

// Juga jalankan jika DOM sudah siap
if (document.readyState === 'loading') {
  // Tunggu DOM selesai loading
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM sudah siap
  console.log('DOM already ready, initializing immediately');
  initApp();
}

// Fungsi untuk edit user (placeholder)
function handleEditUser(role, displayName, id) {
  showToast('info', 'Fitur edit pengguna akan segera hadir');
  console.log('Edit user:', { role, displayName, id });
}

// Fungsi untuk toggle tombol sistem pembuangan
function toggleSystemButton(button, systemType) {
  const taskItem = button.closest('.task-item');
  const buttons = taskItem.querySelectorAll('.system-btn');
  const hiddenInput = taskItem.querySelector('#wasteSystemInput');
  
  const wasActive = button.classList.contains('active');

  // Reset semua tombol
  buttons.forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('data-active', 'false');
  });
  
  if (wasActive) {
    hiddenInput.value = '';
  } else {
    // Aktifkan tombol yang diklik
    button.classList.add('active');
    button.setAttribute('data-active', 'true');
    hiddenInput.value = systemType;
  }
  
  const rolePage = currentRole + 'Page';
  updateProgress(rolePage);
}

// Fungsi untuk toggle tombol keramik dinding
function toggleTilesButton(button, option) {
  const taskItem = button.closest('.task-item');
  const buttons = taskItem.querySelectorAll('.tiles-btn');
  const hiddenInput = taskItem.querySelector('#bathroomTilesInput');
  
  const wasActive = button.classList.contains('active');

  // Reset semua tombol
  buttons.forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('data-active', 'false');
  });
  
  if (wasActive) {
    hiddenInput.value = '';
  } else {
    // Aktifkan tombol yang diklik
    button.classList.add('active');
    button.setAttribute('data-active', 'true');
    hiddenInput.value = option;
  }
  
  const rolePage = currentRole + 'Page';
  updateProgress(rolePage);
}

// Fungsi untuk toggle tombol cor meja dapur
function toggleTableButton(button, option) {
  const taskItem = button.closest('.task-item');
  const buttons = taskItem.querySelectorAll('.table-btn');
  const hiddenInput = taskItem.querySelector('#tableKitchenInput');
  
  const wasActive = button.classList.contains('active');

  // Reset semua tombol
  buttons.forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('data-active', 'false');
  });
  
  if (wasActive) {
    hiddenInput.value = '';
  } else {
    // Aktifkan tombol yang diklik
    button.classList.add('active');
    button.setAttribute('data-active', 'true');
    hiddenInput.value = option;
  }
  
  const rolePage = currentRole + 'Page';
  updateProgress(rolePage);
}

// ========== TAMBAHKAN FUNGSI YANG HILANG ==========
// Fungsi-fungsi ini disebut di kode Anda tetapi tidak didefinisikan:

function updateProgress(rolePage) {
  const pageElement = document.getElementById(rolePage);
  if (!pageElement) return;

  const progressSections = pageElement.querySelectorAll('.progress-section[data-tahap]');
  let totalWeightedProgress = 0;
  let totalPossibleWeight = 0;

  progressSections.forEach(section => {
    const tahap = section.getAttribute('data-tahap');
    const tasks = section.querySelectorAll('.sub-task');
    let completedTasksWeight = 0;
    let totalSectionWeight = 0;

    tasks.forEach(task => {
      const weight = parseFloat(task.getAttribute('data-weight')) || 1;
      totalSectionWeight += weight;

      if (task.type === 'checkbox') {
        if (task.checked) {
          completedTasksWeight += weight;
        }
      } else if (task.type === 'hidden') {
        if (task.value && task.value.trim() !== '') {
          completedTasksWeight += weight;
        }
      }
   else if (task.type === 'text' || task.type === 'textarea' || task.type === 'date') {
        // Untuk field text/textarea/date di tahap 4, hitung jika ada isi
        if (tahap === '4' && task.value && task.value.trim() !== '') {
          completedTasksWeight += weight;
        }
      }
    });

    const sectionPercent = totalSectionWeight > 0 ? (completedTasksWeight / totalSectionWeight) * 100 : 0;
    const subPercentEl = section.querySelector('.sub-percent');
    if (subPercentEl) {
      subPercentEl.textContent = Math.round(sectionPercent) + '%';
    }

    const progressFill = section.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = sectionPercent + '%';
    }

    // PERBAIKAN: Weight yang lebih realistis
    // Tahap 1: 40%, Tahap 2: 30%, Tahap 3: 20%, Tahap 4: 10%
    const tahapWeights = { 
      '1': 0.40,  // 40%
      '2': 0.30,  // 30%
      '3': 0.20,  // 20%
      '4': 0.10   // 10%
    };
    
    const weightFactor = tahapWeights[tahap] || 0.25;
    totalWeightedProgress += sectionPercent * weightFactor;
  });
  // PERBAIKAN: Update dengan persentase yang benar
  const roundedProgress = Math.round(totalWeightedProgress);
  updateTotalProgressDisplay(Math.round(totalWeightedProgress) + '%', rolePage);
 // Juga update langsung di overall rekap
  const overallPercent = pageElement.querySelector('.total-percent');
  const overallBar = pageElement.querySelector('.total-bar');
  
  if (overallPercent) {
    overallPercent.textContent = roundedProgress + '%';
  }
  if (overallBar) {
    overallBar.style.width = roundedProgress + '%';
  }
  
  console.log(`Updated progress for ${rolePage}: ${roundedProgress}%`);
}

//--------------

function updateTotalProgressDisplay(progress, pageId) {
  const pageElement = document.getElementById(pageId);
  if (!pageElement) return;

  const totalPercentEl = pageElement.querySelector('.total-percent');
  if (totalPercentEl) {
    totalPercentEl.textContent = progress;
  }

  const totalBarEl = pageElement.querySelector('.total-bar');
  if (totalBarEl) {
    totalBarEl.style.width = progress;
  }
}

function savePropertyNotes() {
  // Fungsi untuk save property notes
  console.log('savePropertyNotes called');
  if (!selectedKavling) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }
  
  const notesEl = document.getElementById('propertyNotesManager');
  if (!notesEl) return;
  
  const notes = notesEl.value.trim();
  
  showGlobalLoading('Menyimpan catatan...');
  
  // Panggil server untuk menyimpan notes
  // Implementasi Anda di sini
}

function loadPropertyNotes(kavlingName) {
  // Fungsi untuk load property notes
  console.log('loadPropertyNotes called for:', kavlingName);
  // Implementasi Anda di sini
}

function updateKavlingBadge(kavlingName) {
  // Fungsi untuk update badge kavling
  console.log('updateKavlingBadge called for:', kavlingName);
  // Implementasi Anda di sini
}

function updateNotesCounter(length) {
  // Fungsi untuk update notes character counter
  console.log('updateNotesCounter:', length);
  // Implementasi Anda di sini
}

// ========== FUNGSI DEBUG UNTUK MEMERIKSA STRUKTUR ==========
function debugTahap4Structure() {
  console.log('=== DEBUG TAHAP 4 STRUCTURE ===');
  
  // Cek di semua halaman
  const pages = ['user1Page', 'user2Page', 'user3Page'];
  
  pages.forEach(pageId => {
    const page = document.getElementById(pageId);
    if (!page) return;
    
    console.log(`\nChecking ${pageId}:`);
    
    // Cari section tahap 4
    const tahap4Section = page.querySelector('[data-tahap="4"]');
    if (!tahap4Section) {
      console.log('❌ No tahap 4 section found');
      return;
    }
    
    console.log('✅ Found tahap 4 section');
    console.log('Section class:', tahap4Section.className);
    
    // Cari tombol save di dalam section
    const saveButton = tahap4Section.querySelector('.btn-save-section');
    if (saveButton) {
      console.log('✅ Save button found INSIDE progress-section');
      console.log('Button data-tahap:', saveButton.getAttribute('data-tahap'));
      console.log('Button is child of progress-section:', saveButton.closest('.progress-section') === tahap4Section);
    } else {
      console.log('❌ Save button NOT FOUND inside progress-section');
      
      // Cari tombol di luar
      const allButtons = page.querySelectorAll('.btn-save-section[data-tahap="4"]');
      console.log(`Found ${allButtons.length} tahap 4 buttons total in page`);
    }
  });
}

// Panggil setelah DOM siap
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(debugTahap4Structure, 1000);
});
