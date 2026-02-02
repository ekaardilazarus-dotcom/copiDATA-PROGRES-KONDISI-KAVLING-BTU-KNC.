// versi 0.66 - Database Connection Module
const USER_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx08smViAL2fT_P0ZCljaM8NGyDPZvhZiWt2EeIy1MYsjoWnSMEyXwoS6jydO-_J8OH/exec';
const PROGRESS_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxdn4gEn2DdgLYRyVy8QVfF4QMVwL2gs7O7cFIfisvKdfFCPkiOlLTYpJpVGt-w3-q4Vg/exec';

// Global variables
let currentRole = null;
let selectedKavling = null;
let currentKavlingData = null;

const defaultDisplayNames = {
  'user1': 'Pelaksana 1',
  'user2': 'Pelaksana 2',
  'user3': 'Pelaksana 3',
  'user4': 'Admin Utilitas',
  'manager': 'Supervisor',
  'admin': 'Admin System'
};

// ========== DATABASE CONNECTION FUNCTIONS ==========

/**
 * Main function to get data from Google Apps Script server
 * @param {string} url - The Apps Script URL
 * @param {Object} params - Parameters to send
 * @returns {Promise} - Promise with server response
 */
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

    let requestUrl = url + (url.includes('?') ? '&' : '?');
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

/**
 * Load list of all kavlings from database
 * @returns {Promise<Array>} - Array of kavling names
 */
async function loadKavlingList() {
  console.log('Loading kavling list...');
  showGlobalLoading('Memuat daftar kavling...');

  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getKavlingList'
    });

    if (result.success && result.kavlings && result.kavlings.length > 0) {
      // Store globally for search functionality
      if (typeof window !== 'undefined') {
        window.allKavlings = result.kavlings;
      }
      
      updateAllKavlingSelects(result.kavlings);
      console.log(`✅ Loaded ${result.kavlings.length} kavlings`);

      // Show success notification when data is loaded for Pelaksana/Manager roles
      if (currentRole && currentRole !== 'admin') {
        showStatusModal('success', 'Data Berhasil Dimuat', 'Data kavling terbaru telah berhasil dimuat dari server.');
      }

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

/**
 * Load data for a specific kavling
 * @param {string} kavlingName - Name of the kavling
 * @returns {Promise<Object>} - Kavling data
 */
async function loadKavlingData(kavlingName) {
  if (!kavlingName) return;
  
  showGlobalLoading('Memuat data kavling...');
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getKavlingData',
      kavling: kavlingName
    });
    
    if (result.success) {
      currentKavlingData = result;
      selectedKavling = kavlingName;
      
      // Update UI displays
      updateKavlingInfoDisplay(result);
      
      const pageId = currentRole + 'Page';
      const page = document.getElementById(pageId);
      
      if (page) {
        // Load each stage section
        const stages = ['1', '2', '3', '4'];
        stages.forEach(s => {
          const section = page.querySelector(`.progress-section[data-tahap="${s}"]`);
          if (section) {
            const stageData = result.data ? result.data[`tahap${s}`] : null;
            loadTahapDataSection(section, s, stageData);
          }
        });
        
        // Specific for Pelaksana 1: Kondisi Unit Saat Ini
        if (currentRole === 'user1') {
          const revisiSection = page.querySelector('.progress-section[data-tahap="revisi"]');
          if (revisiSection) {
            const notesEl = revisiSection.querySelector('#kondisiUnitNotesUser1');
            if (notesEl) notesEl.value = result.propertyNotes || '';
          }
        }
      }
      
      showToast('success', 'Data kavling berhasil dimuat');
      return result;
    } else {
      showToast('error', 'Gagal memuat data: ' + result.message);
      return null;
    }
  } catch (error) {
    console.error('Error loading kavling data:', error);
    showToast('error', 'Error: ' + error.message);
    return null;
  } finally {
    hideGlobalLoading();
  }
}

/**
 * Save Tahap 1 data to database
 */
async function saveTahap1() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }

  const rolePage = currentRole + 'Page';
  const tahap1Section = document.querySelector(`#${rolePage} .progress-section[data-tahap="1"]`);
  if (!tahap1Section) return;

  const checkboxes = tahap1Section.querySelectorAll('.sub-task');

  // Find inputs based on current role
  let currentWasteSystemInput, currentTableKitchenInput;

  if (currentRole === 'user1') {
    currentWasteSystemInput = tahap1Section.querySelector('#wasteSystemInputUser1');
    currentTableKitchenInput = tahap1Section.querySelector('#tableKitchenInputUser1');
  } else if (currentRole === 'user2') {
    currentWasteSystemInput = tahap1Section.querySelector('#wasteSystemInputUser2');
    currentTableKitchenInput = tahap1Section.querySelector('#tableKitchenInputUser2');
  } else if (currentRole === 'user3') {
    currentWasteSystemInput = tahap1Section.querySelector('#wasteSystemInputUser3');
    currentTableKitchenInput = tahap1Section.querySelector('#tableKitchenInputUser3');
  } else if (currentRole === 'user4') {
    currentWasteSystemInput = tahap1Section.querySelector('#wasteSystemInputUser4');
    currentTableKitchenInput = tahap1Section.querySelector('#tableKitchenInputUser4');
  } else if (currentRole === 'user5') {
    currentWasteSystemInput = tahap1Section.querySelector('#wasteSystemInputUser5');
    currentTableKitchenInput = tahap1Section.querySelector('#tableKitchenInputUser5');
  } else {
    // Fallback for other roles
    currentWasteSystemInput = tahap1Section.querySelector('#wasteSystemInput');
    currentTableKitchenInput = tahap1Section.querySelector('#tableKitchenInput');
  }

  const saveButton = tahap1Section.querySelector('.btn-save-section');

  const tahapData = {};

  // Handle checkbox biasa dengan mapping yang benar
  checkboxes.forEach(checkbox => {
    if (checkbox.type === 'checkbox') {
      const spreadsheetTaskName = checkbox.getAttribute('data-task');
      if (spreadsheetTaskName) {
        tahapData[spreadsheetTaskName] = checkbox.checked;
      }
    }
  });

  // Handle Cor Meja Dapur
  const currentCorMejaDapurInputEl = tahap1Section.querySelector(`#tableKitchenInput${currentRole === 'user1' ? 'User1' : currentRole === 'user2' ? 'User2' : currentRole === 'user3' ? 'User3' : ''}`);
  if (currentCorMejaDapurInputEl) {
    const tableValue = currentCorMejaDapurInputEl.value;
    console.log('Cor Meja Dapur value from input:', tableValue);
    if (tableValue === 'include' || tableValue === 'Dengan Cor Meja Dapur') {
      tahapData['COR MEJA DAPUR'] = 'Dengan Cor Meja Dapur';
    } else if (tableValue === 'exclude' || tableValue === 'Tanpa Cor Meja Dapur') {
      tahapData['COR MEJA DAPUR'] = 'Tanpa Cor Meja Dapur';
    } else {
      tahapData['COR MEJA DAPUR'] = tableValue;
    }
  }

  // Handle Sistem Pembuangan
  const currentWasteSystemInputEl = tahap1Section.querySelector(`#wasteSystemInput${currentRole === 'user1' ? 'User1' : currentRole === 'user2' ? 'User2' : currentRole === 'user3' ? 'User3' : ''}`);
  if (currentWasteSystemInputEl) {
    const wasteValue = currentWasteSystemInputEl.value;
    console.log('Sistem Pembuangan value from input:', wasteValue);
    if (wasteValue === 'septictank') {
      tahapData['SISTEM PEMBUANGAN'] = 'Septictank';
    } else if (wasteValue === 'biotank') {
      tahapData['SISTEM PEMBUANGAN'] = 'Biotank';
    } else if (wasteValue === 'ipal') {
      tahapData['SISTEM PEMBUANGAN'] = 'Ipal';
    } else {
      tahapData['SISTEM PEMBUANGAN'] = wasteValue;
    }
  }

  // Debug data yang akan dikirim
  console.log('Data Tahap 1 yang akan disimpan:', tahapData);

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

/**
 * Save Tahap 2 data to database
 */
async function saveTahap2() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }

  const rolePage = currentRole + 'Page';
  const tahap2Section = document.querySelector(`#${rolePage} .progress-section[data-tahap="2"]`);
  if (!tahap2Section) return;

  const checkboxes = tahap2Section.querySelectorAll('.sub-task');

  // Find bathroomTiles input based on role
  let bathroomTilesInput;
  if (currentRole === 'user1') {
    bathroomTilesInput = tahap2Section.querySelector('#bathroomTilesInputUser1');
  } else if (currentRole === 'user2') {
    bathroomTilesInput = tahap2Section.querySelector('#bathroomTilesInputUser2');
  } else if (currentRole === 'user3') {
    bathroomTilesInput = tahap2Section.querySelector('#bathroomTilesInputUser3');
  } else if (currentRole === 'user4') {
    bathroomTilesInput = tahap2Section.querySelector('#bathroomTilesInputUser4');
  } else if (currentRole === 'user5') {
    bathroomTilesInput = tahap2Section.querySelector('#bathroomTilesInputUser5');
  } else {
    bathroomTilesInput = tahap2Section.querySelector('#bathroomTilesInput');
  }

  const saveButton = tahap2Section.querySelector('.btn-save-section');

  const tahapData = {};

  // Handle checkbox biasa dengan mapping yang benar
  checkboxes.forEach(checkbox => {
    if (checkbox.type === 'checkbox') {
      const spreadsheetTaskName = checkbox.getAttribute('data-task');
      if (spreadsheetTaskName) {
        tahapData[spreadsheetTaskName] = checkbox.checked;
      }
    }
  });

  // Handle Keramik Dinding Toilet & Dapur
  if (bathroomTilesInput) {
    const tilesValue = bathroomTilesInput.value;
    console.log('Keramik Dinding value:', tilesValue);

    if (tilesValue === 'include' || tilesValue === 'Dengan Keramik Dinding') {
      tahapData['KERAMIK DINDING TOILET & DAPUR'] = 'Dengan Keramik Dinding';
    } else if (tilesValue === 'exclude' || tilesValue === 'Tanpa Keramik Dinding') {
      tahapData['KERAMIK DINDING TOILET & DAPUR'] = 'Tanpa Keramik Dinding';
    } else {
      tahapData['KERAMIK DINDING TOILET & DAPUR'] = '';
    }
  }

  // Debug data yang akan dikirim
  console.log('Data Tahap 2 yang akan disimpan:', tahapData);

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

/**
 * Save Tahap 3 data to database
 */
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

  const tahapData = {};

  // Handle checkbox biasa dengan mapping yang benar
  checkboxes.forEach(checkbox => {
    if (checkbox.type === 'checkbox') {
      const spreadsheetTaskName = checkbox.getAttribute('data-task');
      if (spreadsheetTaskName) {
        tahapData[spreadsheetTaskName] = checkbox.checked;
      }
    }
  });

  // Debug data yang akan dikirim
  console.log('Data Tahap 3 yang akan disimpan:', tahapData);

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

/**
 * Save Tahap 4 data to database
 */
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

  // Handle Completion checkbox
  if (completionCheckbox) {
    tahapData['COMPLETION / Penyelesaian akhir'] = completionCheckbox.checked;
    console.log('Completion checked:', completionCheckbox.checked);
  }

  // Handle Keterangan
  if (commentEl) {
    tahapData['KETERANGAN'] = commentEl.value.trim();
    console.log('Keterangan:', tahapData['KETERANGAN']);
  }

  // Handle Penyerahan Kunci
  if (deliveryEl) {
    tahapData['PENYERAHAN KUNCI'] = deliveryEl.value.trim();
    console.log('Penyerahan Kunci:', tahapData['PENYERAHAN KUNCI']);
  }

  // Handle Tanggal Penyerahan Kunci
  if (dateEl && dateEl.value.trim()) {
    const dateValue = dateEl.value.trim();

    // Validasi format dd/mm/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
      tahapData['TANGGAL_PENYERAHAN_KUNCI'] = dateValue;
      console.log('Tanggal valid:', dateValue);
    } else {
      // Jika format tidak valid, kirim string kosong
      tahapData['TANGGAL_PENYERAHAN_KUNCI'] = '';
      console.log('Format tanggal tidak valid, dikirim kosong');
      showToast('warning', 'Format tanggal harus dd/mm/yyyy (contoh: 25/12/2023)');
    }
  } else if (dateEl) {
    // Jika input kosong atau hanya spasi
    tahapData['TANGGAL_PENYERAHAN_KUNCI'] = '';
    console.log('Tanggal kosong, dikirim string kosong');
  }

  // Debug data yang akan dikirim
  console.log('Data Tahap 4 yang akan disimpan:', tahapData);

  // Tambahkan LT, LB, dan TYPE
  if (currentKavlingData.lt) tahapData['LT'] = currentKavlingData.lt;
  if (currentKavlingData.lb) tahapData['LB'] = currentKavlingData.lb;
  if (currentKavlingData.type) tahapData['TYPE'] = currentKavlingData.type;

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

      // Update data lokal
      if (currentKavlingData.data) {
        if (!currentKavlingData.data.tahap4) currentKavlingData.data.tahap4 = {};

        // Update semua field tahap 4
        Object.keys(tahapData).forEach(taskName => {
          if (taskName !== 'LT' && taskName !== 'LB' && taskName !== 'TYPE') {
            currentKavlingData.data.tahap4[taskName] = tahapData[taskName];
          }
        });
      }

      // Update total progress display dengan benar
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

      // Refresh data kavling untuk mendapatkan progress terbaru dari server
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

/**
 * Save Revision Photos to database
 */
async function saveTahapRevisi() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }

  const rolePage = currentRole + 'Page';
  const revisiSection = document.querySelector(`#${rolePage} .progress-section[data-tahap="revisi"]`);
  if (!revisiSection) return;

  const saveButton = revisiSection.querySelector('.btn-save-revisi');
  const notesEl = revisiSection.querySelector('#kondisiUnitNotesUser1');
  
  const tahapData = {};
  if (notesEl) {
    tahapData['KETERANGAN_KONDISI_UNIT'] = notesEl.value.trim();
  }

  // Tambahkan foto ke data yang dikirim (sebagai array base64)
  tahapData['FOTO_KONDISI_PROPERTI'] = selectedRevisiPhotos;

  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveButton.disabled = true;
  }

  showGlobalLoading('Menyimpan Kondisi Unit Saat Ini & Foto...');

  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveTahapRevisi',
      kavling: selectedKavling,
      data: tahapData,
      user: currentRole
    });

    hideGlobalLoading();

    if (result.success) {
      showToast('success', `Berhasil! Kondisi Unit Saat Ini untuk Blok ${selectedKavling} telah tersimpan.`);
      // Reset foto setelah sukses
      selectedRevisiPhotos = [];
      renderRevisiPreviews();
    } else {
      showToast('error', result.message || 'Gagal menyimpan kondisi unit');
    }
  } catch (error) {
    console.error('Error saving kondisi unit:', error);
    showToast('error', 'Gagal menyimpan: ' + error.message);
  } finally {
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save"></i> Simpan Kondisi Unit';
      saveButton.disabled = false;
    }
  }
}

/**
 * Save Key Delivery data to database
 */
async function saveKeyDelivery() {
  if (!selectedKavling) {
    showToast('warning', 'Pilih kavling terlebih dahulu!');
    return;
  }

  // Cari elemen-elemen di Tahap 4
  const pageId = currentRole + 'Page';
  const page = document.getElementById(pageId);
  if (!page) return;

  const deliveryDateInput = page.querySelector('.key-delivery-date');

  if (!deliveryDateInput) {
    console.error('Input element not found');
    showToast('error', 'Form tidak lengkap!');
    return;
  }

  const deliveryDate = deliveryDateInput.value;

  showGlobalLoading('Menyimpan data penyerahan kunci...');

  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveKeyDelivery',
      kavling: selectedKavling,
      deliveryDate: deliveryDate,
      user: currentRole
    });

    if (result.success) {
      showToast('success', 'Data penyerahan kunci berhasil disimpan!');

      // Update data lokal
      if (currentKavlingData) {
        if (!currentKavlingData.keyDelivery) currentKavlingData.keyDelivery = {};
        currentKavlingData.keyDelivery.deliveryDate = deliveryDate;
      }

    } else {
      showToast('error', 'Gagal menyimpan: ' + result.message);
    }
  } catch (error) {
    console.error('Error saving key delivery:', error);
    showToast('error', 'Error: ' + error.message);
  } finally {
    hideGlobalLoading();
  }
}

/**
 * Save Property Notes to database
 */
async function savePropertyNotes() {
  if (!selectedKavling) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }

  const notesEl = document.getElementById('propertyNotesManager');
  if (!notesEl) return;

  const notes = notesEl.value.trim();

  showGlobalLoading('Menyimpan catatan...');

  try {
    const response = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'savePropertyNotes',
      kavling: selectedKavling,
      notes: notes
    });

    if (response.success) {
      if (currentKavlingData && currentKavlingData.kavling === selectedKavling) {
        currentKavlingData.propertyNotes = notes;
      }
      showStatusModal('success', 'Berhasil', 'Catatan kondisi property berhasil disimpan');
      setTimeout(() => {
        hideGlobalLoading();
        showToast('success', 'Catatan berhasil disimpan');
      }, 1500);
    } else {
      hideGlobalLoading();
      showToast('error', response.message || 'Gagal menyimpan catatan');
    }
  } catch (error) {
    console.error('Error saving notes:', error);
    hideGlobalLoading();
    showToast('error', 'Terjadi kesalahan: ' + error.message);
  }
}

/**
 * Save Utility data to database
 */
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

/**
 * Load summary report from database
 */
async function loadSummaryReport() {
  try {
    showGlobalLoading('Mengambil laporan summary...');

    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getSummaryReport'
    });

    if (result.success) {
      await showProcessingProgress(3500);
      hideGlobalLoading();
      displaySummaryReport(result);
      setTimeout(() => filterKavlingByProgress('all'), 100);
    } else {
      hideGlobalLoading();
      showToast('error', result.message || 'Gagal mengambil laporan');
    }

  } catch (error) {
    console.error('Error loading summary report:', error);
    hideGlobalLoading();
    showToast('error', 'Gagal mengambil laporan');
  }
}

/**
 * Load activity log from database
 */
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

/**
 * Load users data for admin
 */
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

/**
 * Add new kavling to database
 */
async function submitNewKavling() {
  console.log('submitNewKavling called');
  const nameInput = document.getElementById('newKavlingName');
  const ltInput = document.getElementById('newKavlingLT');
  const lbInput = document.getElementById('newKavlingLB');
  const typeInput = document.getElementById('newKavlingType');
  const submitBtn = document.getElementById('submitNewKavling');

 if (!nameInput) { 
    console.error('Missing name input');
    showToast('error', 'Elemen form tidak ditemukan!');
    return;
  }

  const name = nameInput.value.trim();
  const lt = ltInput ? ltInput.value.trim() : '';
  const lb = lbInput ? lbInput.value.trim() : ''; 
  const type = typeInput ? typeInput.value.trim() : '';

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

      // Clear all inputs and progress displays to start fresh
      clearInputsForNewLoad();

      // Reset form fields in the modal
      if (nameInput) nameInput.value = '';
      if (ltInput) ltInput.value = '';
      if (lbInput) lbInput.value = '';
      if (typeInput) typeInput.value = '';

      // Tutup modal
      const modal = document.getElementById('addKavlingModal');
      if (modal) modal.style.display = 'none';

      // Refresh daftar kavling dari server
      await loadKavlingList();

      // Optional: Auto-select the newly created kavling
      if (name) {
        selectedKavling = name;
        setSelectedKavlingInDropdowns(name);
        // Trigger a sync for the new kavling (which should have 0% progress)
        await searchKavling(true);
      }

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

/**
 * Edit kavling data in database
 */
async function submitEditKavling() {
  const name = document.getElementById('editKavlingName').value;
  const type = document.getElementById('editKavlingType').value;
  const lt = document.getElementById('editKavlingLT').value;
  const lb = document.getElementById('editKavlingLB').value;

  if (!name) {
    showToast('warning', 'Nama kavling harus diisi!');
    return;
  }

  showGlobalLoading('Mengupdate data kavling...');

  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'editKavling',
      kavling: name,
      type: type || '',
      lt: lt || '',
      lb: lb || '',
      user: currentRole
    });

    if (result.success) {
      showStatusModal('success', 'Berhasil Update', `Data kavling ${name} telah diperbarui.`);
      
      // Clear all inputs before re-sync
      clearInputsForNewLoad();

      // Refresh list of kavlings first
      await loadKavlingList();

      // Re-sync specific kavling data
      await searchKavling(true);
    } else {
      showToast('error', 'Gagal update: ' + (result.message || 'Unknown error'));
    }
  } catch (error) {
    showToast('error', 'Error: ' + error.message);
  } finally {
    hideGlobalLoading();
  }
}

/**
 * Delete kavling from database
 */
async function deleteKavling() {
  const name = document.getElementById('editKavlingName').value;

  if (!confirm(`Apakah Anda yakin ingin menghapus data kavling ${name}? Tindakan ini tidak dapat dibatalkan.`)) {
    return;
  }

  showGlobalLoading('Menghapus data kavling...');

  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'deleteKavling',
      kavling: name,
      user: currentRole
    });

    if (result.success) {
      showStatusModal('delete-success', 'Berhasil Hapus', `Data kavling ${name} telah dihapus.`);
      
      // Reset internal selection state
      selectedKavling = null;
      currentKavlingData = null;

      // Reset UI inputs and progress displays
      clearInputsForNewLoad();

      // Refresh kavling list from database
      await loadKavlingList();

      // Reset display info to neutral
      const rolePage = currentRole + 'Page';
      updateKavlingInfo({kavling: '-', type: '-', lt: '-', lb: '-'}, rolePage);

      updateTabsState();
    } else {
      showToast('error', 'Gagal menghapus: ' + (result.message || 'Unknown error'));
    }
  } catch (error) {
    showToast('error', 'Error: ' + error.message);
  } finally {
    hideGlobalLoading();
  }
}

/**
 * Handle user login
 */
async function handleLogin() {
  console.log('=== HANDLE LOGIN CALLED ===');
  console.log('Current role:', currentRole);
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

      // Load initial data after login
      if (currentRole.startsWith('user')) {
        setTimeout(async () => {
          await loadKavlingListWithLoading();
        }, 100);
      }

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

/**
 * Search kavling data
 */
async function searchKavling(isSync = false) {
  console.log('=== FUNGSI searchKavling DIPANGGIL ===');

  try {
    const rolePage = currentRole + 'Page';
    const selectId = getSelectIdByRole(currentRole);
    const selectElement = document.getElementById(selectId);

    if (!selectElement) {
      showToast('error', 'Dropdown kavling tidak ditemukan!');
      return;
    }

    // Check custom input first for current role
    const inputId = selectId + 'Input';
    const inputEl = document.getElementById(inputId);
    let kavlingName = selectElement.value.trim();

    if (!kavlingName && inputEl) {
      kavlingName = inputEl.value.trim();
      if (kavlingName) {
        selectElement.value = kavlingName;
      }
    }

    if (!kavlingName && !isSync) {
      showToast('warning', 'Pilih kavling terlebih dahulu dari pencarian!');
      if (inputEl) inputEl.focus();
      else selectElement.focus();
      return;
    }

    if (isSync && !kavlingName) {
      showGlobalLoading('Mengambil data terbaru dari spreadsheet...');
      try {
        // Refresh dropdown lists and clear selections
        await initializeApp(); 
        hideGlobalLoading();
        showToast('success', 'Data berhasil diperbarui!');
        return;
      } catch (err) {
        hideGlobalLoading();
        showToast('error', 'Gagal memperbarui data!');
        return;
      }
    }

    // Clear all inputs/status before sync to give "refresh" feel
    clearInputsForNewLoad();

    showGlobalLoading('Menyinkronkan data ' + kavlingName + '...');

    const data = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getKavlingData',
      kavling: kavlingName
    });

    console.log('📦 Full response from server:', data);

    if (data.success) {
      selectedKavling = kavlingName;
      updateTabsState(); // Enable tabs when kavling is loaded

      // Get progress from server
      let serverProgress = data.totalAH || '0%';

      // Convert decimal to percentage if needed
      if (typeof serverProgress === 'number') {
        serverProgress = (serverProgress <= 1 ? Math.round(serverProgress * 100) : Math.round(serverProgress)) + '%';
      } else if (typeof serverProgress === 'string' && !serverProgress.includes('%')) {
        const num = parseFloat(serverProgress);
        if (!isNaN(num)) {
          serverProgress = (num <= 1 ? Math.round(num * 100) : Math.round(num)) + '%';
        }
      }

      // Save ALL data from server with correct structure
      currentKavlingData = {
        kavling: data.kavling || kavlingName,
        type: data.type || '-', 
        lt: data.lt || '-',
        lb: data.lb || '-',
        propertyNotes: data.propertyNotes || '',
        totalAH: serverProgress, // Use formatted value
        data: data.data || {}
      };

      setSelectedKavlingInDropdowns(kavlingName);
      updateKavlingInfo(currentKavlingData, rolePage);

      // Immediately update progress from server
      updateTotalProgressDisplay(currentKavlingData.totalAH, rolePage);
      const overallPercent = document.querySelector(`#${rolePage} .total-percent`);
      const overallBar = document.querySelector(`#${rolePage} .total-bar`);
      if (overallPercent) overallPercent.textContent = currentKavlingData.totalAH;
      if (overallBar) overallBar.style.width = currentKavlingData.totalAH;

      if (currentRole !== 'manager') {
        loadProgressData(data.data);
      }

      if (currentRole === 'manager') {
        loadPropertyNotesFromData(currentKavlingData);

        // Update progress display untuk manager
        updateManagerProgressDisplay(currentKavlingData.totalAH);

        // Update Supervisor Stages UI
        const totalPercent = parseInt(currentKavlingData.totalAH) || 0;
        updateSupervisorStagesUI(totalPercent, data.data);

        // Load Hand Over data
        loadSupervisorHandoverData(kavlingName);

        // Auto load mutation history
        setTimeout(async () => {
          if (selectedKavling === kavlingName) {
            console.log('⏰ Auto loading mutation history for:', kavlingName);
            loadMutationHistoryForSupervisor(kavlingName).catch(err => console.error('Auto-load failed:', err));
          }
        }, 3000);

        // Load reports if in reports tab
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
        updateUtilitasProgressDisplay(currentKavlingData.totalAH);

        // Load additional data from Admin Utilitas Apps Script
        if (typeof loadAdminUtilitasData === 'function') {
            loadAdminUtilitasData(kavlingName);
        }
      }

      // Enable all inputs after data loaded
      setTimeout(() => {
        enableAllInputs();

        // Add event listener untuk checkbox
        setupCheckboxListeners(rolePage);

        // Update tabs state
        updateTabsState();
      }, 100);

      // Show success and auto close after 1.5 seconds
      showStatusModal('success', 'Data Dimuat', `Data ${kavlingName} berhasil dimuat!`);

      setTimeout(() => {
        hideGlobalLoading();
        showToast('success', `Data ${kavlingName} berhasil dimuat!`);
      }, 1500);

    } else {
      hideGlobalLoading();
      showToast('error', data.message || 'Kavling tidak ditemukan');
      selectElement.value = '';
    }

  } catch (error) {
    console.error('Error dalam searchKavling:', error);
    hideGlobalLoading();
    showToast('error', 'Gagal mengambil data: ' + error.message);
  }
}

/**
 * Sync data with server
 */
async function syncData() {
  const rolePage = currentRole + 'Page';
  const syncBtn = document.querySelector(`#${rolePage} .sync-btn`);

  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Sinkronisasi...';
  }

  try {
    showGlobalLoading('Sinkronisasi data...');
    await loadKavlingListWithLoading();

    // Clear selections and reset UI
    selectedKavling = null;
    currentKavlingData = null;

    // Clear all selections including custom search inputs
    setSelectedKavlingInDropdowns('');

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

    // Show success and auto close
    showStatusModal('success', 'Sinkronisasi Berhasil', 'Data berhasil disinkronisasi!');

    setTimeout(() => {
      hideGlobalLoading();
      showToast('success', 'Data berhasil disinkronisasi dan tampilan dibersihkan!');
    }, 1500);

  } catch (error) {
    console.error('Sync error:', error);
    hideGlobalLoading();
    showToast('error', 'Gagal sinkronisasi data');
  } finally {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sinkronkan Data';
    }
  }
}

// ========== HELPER FUNCTIONS ==========

/**
 * Load kavling list with loading modal
 */
async function loadKavlingListWithLoading() {
  console.log('Loading kavling list with loading modal...');
  showGlobalLoading('Memuat daftar kavling...');

  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getKavlingList'
    });

    if (result.success && result.kavlings && result.kavlings.length > 0) {
      allKavlings = result.kavlings; // Store globally
      updateAllKavlingSelects(result.kavlings);
      console.log(`✅ Loaded ${result.kavlings.length} kavlings`);

      // Show success and auto close
      showStatusModal('success', 'Daftar Dimuat', `${result.kavlings.length} kavling berhasil dimuat!`);

      setTimeout(() => {
        hideGlobalLoading();
      }, 1500);

      return result.kavlings;
    } else {
      hideGlobalLoading();
      console.log('❌ No kavlings found:', result.message);
      showToast('warning', 'Tidak ada data kavling ditemukan');
      return [];
    }

  } catch (error) {
    hideGlobalLoading();
    console.error('❌ Error loading kavling list:', error);
    showToast('error', 'Gagal memuat daftar kavling');
    return [];
  }
}

/**
 * Get select ID by role
 */
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

/**
 * Get kavling info ID by role
 */
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

/**
 * Update all kavling dropdowns
 */
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

/**
 * Update individual kavling select dropdown
 */
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

/**
 * Set selected kavling in all dropdowns
 */
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
    if (selectElement) {
      if (kavlingName === '') {
        selectElement.value = '';
      } else if (Array.from(selectElement.options).some(opt => opt.value === kavlingName)) {
        selectElement.value = kavlingName;
      }

      // Also update the custom search inputs if they exist
      const inputId = selectId + 'Input';
      const inputEl = document.getElementById(inputId);
      if (inputEl) inputEl.value = kavlingName || '';
    }
  });
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    USER_APPS_SCRIPT_URL,
    PROGRESS_APPS_SCRIPT_URL,
    getDataFromServer,
    loadKavlingList,
    loadKavlingData,
    saveTahap1,
    saveTahap2,
    saveTahap3,
    saveTahap4,
    saveTahapRevisi,
    saveKeyDelivery,
    savePropertyNotes,
    saveUtilitasData,
    loadSummaryReport,
    loadActivityLog,
    loadUsersForAdmin,
    submitNewKavling,
    submitEditKavling,
    deleteKavling,
    handleLogin,
    searchKavling,
    syncData,
    getSelectIdByRole,
    getKavlingInfoIdByRole,
    updateAllKavlingSelects,
    updateKavlingSelect,
    setSelectedKavlingInDropdowns
  };
}
