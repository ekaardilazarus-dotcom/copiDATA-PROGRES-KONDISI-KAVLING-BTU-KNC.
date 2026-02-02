// versi 0.66 - Database Connection Module
// File ini berisi fungsi-fungsi yang berkomunikasi dengan server

// URL Constants
const USER_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx08smViAL2fT_P0ZCljaM8NGyDPZvhZiWt2EeIy1MYsjoWnSMEyXwoS6jydO-_J8OH/exec';
const PROGRESS_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxdn4gEn2DdgLYRyVy8QVfF4QMVwL2gs7O7cFIfisvKdfFCPkiOlLTYpJpVGt-w3-q4Vg/exec';

// ========== GETDATAFROMSERVER ==========
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

// ========== SAVETAHAPREVISI ==========
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

// ========== SAVETAHAP1 ==========
async function saveTahap1() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }

  const rolePage = currentRole + 'Page';
  const tahap1Section = document.querySelector(`#${rolePage} .progress-section[data-tahap="1"]`);
  if (!tahap1Section) return;

  const checkboxes = tahap1Section.querySelectorAll('.sub-task');

  // PERBAIKAN: Cari input berdasarkan role yang sedang aktif
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
    // Fallback untuk role lain
    currentWasteSystemInput = tahap1Section.querySelector('#wasteSystemInput');
    currentTableKitchenInput = tahap1Section.querySelector('#tableKitchenInput');
  }

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

// ========== SAVETAHAP2 ==========
async function saveTahap2() {
  if (!selectedKavling || !currentKavlingData) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }

  const rolePage = currentRole + 'Page';
  const tahap2Section = document.querySelector(`#${rolePage} .progress-section[data-tahap="2"]`);
  if (!tahap2Section) return;

  const checkboxes = tahap2Section.querySelectorAll('.sub-task');

  // PERBAIKAN: Cari input bathroomTiles berdasarkan role
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

  const t2Mapping = {
    "Rangka Atap": "RANGKA ATAP",
    "Genteng": "GENTENG",
    "Plafond": "PLAFOND",
    "Keramik Dinding Toilet & Dapur": "KERAMIK DINDING TOILET & DAPUR",
    "Instalasi Listrik": "INSTALASI LISTRIK",
    "Keramik Lantai": "KERAMIK LANTAI"
  };

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

  // PERBAIKAN: Handle Keramik Dinding Toilet & Dapur
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

// ========== SAVETAHAP3 ==========
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
    "Meteran Listrik": "METERAN LISTRIK",
    "Meteran Air": "METERAN AIR",
    "General Cleaning": "GENERAL CLEANING"
  };

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

// ========== SAVETAHAP4 ==========
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

// ========== LOADKEYDELIVERYDATA ==========
async function loadKeyDeliveryData() {
  if (!selectedKavling) return;

  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getKeyDeliveryData',
      kavling: selectedKavling
    });

    if (result.success && result.hasData) {
      updateKeyDeliveryDisplay(result);
    } else if (result.success && !result.hasData) {
      // Data kosong, tampilkan form kosong
      resetKeyDeliveryForm();
    }
  } catch (error) {
    console.error('Error loading key delivery data:', error);
  }
}

// ========== LOADKAVLINGLIST ==========
async function loadKavlingList() {
  console.log('Loading kavling list...');
  showGlobalLoading('Memuat daftar kavling...');

  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getKavlingList'
    });

    if (result.success && result.kavlings && result.kavlings.length > 0) {
      allKavlings = result.kavlings; // Store globally
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

// ========== LOADSUMMARYREPORT ==========
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

// ========== DOWNLOADSUMMARYTOEXCEL ==========
async function downloadSummaryToExcel(title) {
  // Try to get data from currentFilteredKavlings first, then fallback to lastSummaryData
  let kavlings = window.currentFilteredKavlings;
  
  // Fallback: if currentFilteredKavlings is empty but we have lastSummaryData, use all items
  if ((!kavlings || kavlings.length === 0) && window.lastSummaryData) {
    kavlings = window.lastSummaryData.items || window.lastSummaryData.allKavlings || [];
    console.log('downloadSummaryToExcel: Using fallback from lastSummaryData, count =', kavlings.length);
  }
  
  if (!kavlings || kavlings.length === 0) {
    showToast('warning', 'Tidak ada data untuk didownload. Silakan pilih kategori terlebih dahulu.');
    return;
  }

  // Header dengan label yang benar
  const headers = [
    'BLOK', 'TOTAL', 'LT', 'LB', 'Type', 
    'LAND CLEARING', 'PONDASI', 'SLOOF', 'PAS.DDG S/D2 CANOPY', 'PAS.DDG S/D RING BLK', 
    'CONDUIT+INBOW DOOS', 'PIPA AIR KOTOR', 'PIPA AIR BERSIH', 'Sistem Pembuangan', 
    'PLESTER', 'ACIAN & BENANGAN', 'COR MEJA DAPUR', 
    'RANGKA ATAP', 'GENTENG', 'PLAFOND', 'KERAMIK DINDING TOILET & DAPUR', 
    'INSTS LISTRIK', 'KERAMIK LANTAI', 
    'KUSEN PINTU & JENDELA', 'DAUN PINTU & JENDELA', 'CAT DASAR + LAPIS AWAL', 
    'FITTING LAMPU', 'FIXTURE & SANITER', 'CAT FINISH INTERIOR', 'CAT FINISH EXTERIOR', 
    'BAK KONTROL & BATAS CARPORT', 'PAVING HALAMAN', 'Meteran Listrik', 'Meteran Air', 
    'GENERAL CLEANING', 'COMPLETION / Penyelesaian akhir', 'Keterangan', 
    'Penyerahan Kunci dari Pelaksana Ke', 'Tanggal Penyerahan Kunci dari Pelaksana'
  ];

  let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
  csvContent += headers.join(';') + "\n";

  kavlings.forEach((kavling, index) => {
    let totalValue = kavling.total_progress || kavling.total || kavling.aj || '0';
    if (totalValue && !String(totalValue).includes('%')) {
      totalValue = totalValue + '%';
    }
    const rowData = [
      // Data dasar
      kavling.kavling || '',
      totalValue,
      kavling.lt || '',
      kavling.lb || '',
      kavling.type || '',

      // Tahap 1 - mapping key yang sesuai
      formatExcelValue(kavling['LAND CLEARING'] || kavling.land_clearing),
      formatExcelValue(kavling.PONDASI || kavling.pondasi),
      formatExcelValue(kavling.SLOOF || kavling.sloof),
      formatExcelValue(kavling['PAS.DDG S/D2 CANOPY'] || kavling.pas_ddg_sd2_canopy),
      formatExcelValue(kavling['PAS.DDG S/D RING BLK'] || kavling.pas_ddg_sd_ring_blk),
      formatExcelValue(kavling['CONDUIT+INBOW DOOS'] || kavling.conduit_inbow_doos),
      formatExcelValue(kavling['PIPA AIR KOTOR'] || kavling.pipa_air_kotor),
      formatExcelValue(kavling['PIPA AIR BERSIH'] || kavling.pipa_air_bersih),
      formatExcelValue(kavling['SISTEM PEMBUANGAN'] || kavling.sistem_pembuangan || kavling.sistemPembuangan),
      formatExcelValue(kavling.PLESTER || kavling.plester),
      formatExcelValue(kavling['ACIAN & BENANGAN'] || kavling.acian_benangan),
      formatExcelValue(kavling['COR MEJA DAPUR'] || kavling.cor_meja_dapur || kavling.corMejaDapur),

      // Tahap 2
      formatExcelValue(kavling['RANGKA ATAP'] || kavling.rangka_atap),
      formatExcelValue(kavling.GENTENG || kavling.genteng),
      formatExcelValue(kavling.PLAFOND || kavling.plafond),
      formatExcelValue(kavling['KERAMIK DINDING TOILET & DAPUR'] || kavling.keramik_dinding_toilet_dapur || kavling.keramikDinding),
      formatExcelValue(kavling['INSTALASI LISTRIK'] || kavling.instalasi_listrik),
      formatExcelValue(kavling['KERAMIK LANTAI'] || kavling.keramik_lantai),

      // Tahap 3
      formatExcelValue(kavling['KUSEN PINTU & JENDELA'] || kavling.kusen_pintu_jendela),
      formatExcelValue(kavling['DAUN PINTU & JENDELA'] || kavling.daun_pintu_jendela),
      formatExcelValue(kavling['CAT DASAR + LAPIS AWAL'] || kavling.cat_dasar_lapis_awal),
      formatExcelValue(kavling['FITTING LAMPU'] || kavling.fitting_lampu),
      formatExcelValue(kavling['FIXTURE & SANITER'] || kavling.fixture_saniter),
      formatExcelValue(kavling['CAT FINISH INTERIOR'] || kavling.cat_finish_interior),
      formatExcelValue(kavling['CAT FINISH EXTERIOR'] || kavling.cat_finish_exterior),
      formatExcelValue(kavling['BAK KONTROL & BATAS CARPORT'] || kavling.bak_kontrol_batas_carport),
      formatExcelValue(kavling['PAVING HALAMAN'] || kavling.paving_halaman),
      formatExcelValue(kavling['METERAN LISTRIK'] || kavling.meteran_listrik),
      formatExcelValue(kavling['METERAN AIR'] || kavling.meteran_air),
      formatExcelValue(kavling['GENERAL CLEANING'] || kavling.general_cleaning),

      // Tahap 4
      formatExcelValue(kavling['COMPLETION / Penyelesaian akhir'] || kavling.completion_penyelesaian_akhir),
      kavling.total_progress || kavling.total || kavling.aj || '0%',
      kavling.keterangan || '',
      kavling['PENYERAHAN KUNCI'] || kavling.penyerahan_kunci_dari_pelaksana_ke || '',
      formatExcelDate(kavling['TANGGAL_PENYERAHAN_KUNCI'] || kavling.tanggal_penyerahan_kunci_dari_pelaksana || kavling.keyDeliveryDate)
    ];

    csvContent += rowData.join(';') + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute("download", `${title.replace(/\s+/g, '_')}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('success', 'Laporan berhasil didownload');
}

// ========== SAVEUTILITASDATA ==========
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

// ========== SAVEMUTASI ==========
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

// ========== DOWNLOADKAVLINGTOEXCEL ==========
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

// ========== LOADACTIVITYLOG ==========
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

// ========== LOADUSERSFORADMIN ==========
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

// ========== LOADKAVLINGDATA ==========
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
    } else {
      showToast('error', 'Gagal memuat data: ' + result.message);
    }
  } catch (error) {
    console.error('Error loading kavling data:', error);
    showToast('error', 'Error: ' + error.message);
  } finally {
    hideGlobalLoading();
  }
}

// ========== LOADKAVLINGLISTWITHLOADING ==========
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

      // Tampilkan sukses dan auto close
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

// ========== SYNCDATA ==========
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

 // Tampilkan success dan auto close setelah 1.5 detik
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

// ========== LOADMUTATIONHISTORY ==========
async function loadMutationHistory() {
  if (!selectedKavling) {
    showToast('warning', 'Pilih kavling terlebih dahulu!');
    return;
  }

  showGlobalLoading('Memuat riwayat mutasi...');

  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getAllMutasi',
      kavling: selectedKavling
    });

    if (result.success && result.mutasiData && result.mutasiData.length > 0) {
      displayMutationHistory(result.mutasiData);
    } else {
      showToast('info', 'Belum ada riwayat mutasi untuk kavling ini');
      document.getElementById('mutasiHistoryContainer').innerHTML = 
        '<p class="no-data">Belum ada riwayat mutasi</p>';
    }
  } catch (error) {
    console.error('Error loading mutation history:', error);
    showToast('error', 'Gagal memuat riwayat mutasi');
  } finally {
    hideGlobalLoading();
  }
}

// ========== LOADMUTATIONHISTORYFORSUPERVISOR ==========
async function loadMutationHistoryForSupervisor(kavling) {
  console.log('🔄 loadMutationHistoryForSupervisor called with kavling:', kavling);
  
  const container = document.getElementById('mutasiHistoryContainerSupervisor');
  if (!container) {
    console.error('❌ Container mutasiHistoryContainerSupervisor tidak ditemukan!');
    return;
  }

  try {
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: #94a3b8;"><i class="fas fa-spinner fa-spin"></i> Memuat data mutasi...</div>';
    container.style.display = 'block';

    console.log('📡 Fetching data from server...');
    // Gunakan API yang sama dengan Admin Utilitas
    const result = await getDataFromServer(ADMIN_UTILITAS_URL_SUPERVISOR, {
      action: 'getHandoverData',
      kavling: kavling
    });

    console.log('📥 Server response:', result);
    console.log('📥 Raw mutasiMasuk:', result.mutasiMasuk);
    console.log('📥 Raw mutasiKeluar:', result.mutasiKeluar);
    console.log('📥 Handover data:', result.handoverData);
    console.log('📥 All keys in result:', Object.keys(result));

    if (result.success) {
      // Parse data mutasi sama seperti Admin Utilitas
      const mutasiMasukEntries = parseMutasiDataFromStringSupervisor(result.mutasiMasuk || '');
      const mutasiKeluarEntries = parseMutasiDataFromStringSupervisor(result.mutasiKeluar || '');
      const handoverData = result.handoverData || null;
      
      console.log('📊 Parsed mutasiMasukEntries:', mutasiMasukEntries);
      console.log('📊 Parsed mutasiKeluarEntries:', mutasiKeluarEntries);
      console.log('📊 Handover data object:', handoverData);
      
      mutasiMasukEntries.forEach(entry => entry.jenis = 'MASUK');
      mutasiKeluarEntries.forEach(entry => entry.jenis = 'KELUAR');
      
      const allMutasi = [...mutasiMasukEntries, ...mutasiKeluarEntries];
      
      console.log('📊 Total allMutasi entries:', allMutasi.length);
      
      // Cek apakah ada data (mutasi ATAU handover)
      const hasData = allMutasi.length > 0 || handoverData;
      
      if (hasData) {
        let html = `<div class="progress-section detailed" style="border-left: 6px solid #8b5cf6; margin-bottom: 15px; padding: 15px; background: rgba(15, 23, 42, 0.5); border-radius: 12px;">
          <h3 style="color: #8b5cf6; margin-bottom: 15px;"><i class="fas fa-history"></i> Riwayat Mutasi Kunci</h3>`;
        
        // Tampilkan Handover Data (HO ke User) jika ada
        if (handoverData && (handoverData.dari || handoverData.user || handoverData.tglHandover)) {
          html += `<div style="margin-bottom: 15px; padding: 12px; background: rgba(139, 92, 246, 0.15); border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.3);">
            <h4 style="color: #a78bfa; margin-bottom: 10px; font-size: 0.95rem;"><i class="fas fa-key"></i> HO Kunci ke User</h4>
            <div style="display: grid; gap: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #94a3b8;">Diserahkan Oleh:</span>
                <span style="color: #f1f5f9; font-weight: 500;">${handoverData.dari || '-'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #94a3b8;">Diterima Oleh (User):</span>
                <span style="color: #f1f5f9; font-weight: 500;">${handoverData.user || '-'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #94a3b8;">Tanggal HO:</span>
                <span style="color: #a78bfa; font-weight: 600;">${handoverData.tglHandover || '-'}</span>
              </div>
            </div>
          </div>`;
        }
        
        // Tampilkan Mutasi Masuk
        if (mutasiMasukEntries.length > 0) {
          html += `<div style="margin-bottom: 15px;">
            <h4 style="color: #10b981; margin-bottom: 10px; font-size: 0.95rem;"><i class="fas fa-sign-in-alt"></i> Mutasi Kunci Masuk</h4>
            <div style="display: grid; gap: 8px;">`;
          
          mutasiMasukEntries.forEach((item, index) => {
            html += `
              <div style="padding: 10px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="color: #94a3b8; font-size: 0.8rem;">Entry #${index + 1}</span>
                    <div style="margin-top: 2px;">
                      <span style="font-weight: 500; color: #f1f5f9;">${item.dari || '-'}</span>
                      <i class="fas fa-arrow-right" style="margin: 0 8px; font-size: 0.8rem; opacity: 0.5; color: #94a3b8;"></i>
                      <span style="font-weight: 500; color: #f1f5f9;">${item.ke || '-'}</span>
                    </div>
                  </div>
                  <span style="color: #10b981; font-size: 0.85rem;">${item.tanggal || '-'}</span>
                </div>
              </div>`;
          });
          
          html += `</div></div>`;
        }
        
        // Tampilkan Mutasi Keluar
        if (mutasiKeluarEntries.length > 0) {
          html += `<div style="margin-bottom: 15px;">
            <h4 style="color: #f59e0b; margin-bottom: 10px; font-size: 0.95rem;"><i class="fas fa-sign-out-alt"></i> Mutasi Kunci Keluar</h4>
            <div style="display: grid; gap: 8px;">`;
          
          mutasiKeluarEntries.forEach((item, index) => {
            html += `
              <div style="padding: 10px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="color: #94a3b8; font-size: 0.8rem;">Entry #${index + 1}</span>
                    <div style="margin-top: 2px;">
                      <span style="font-weight: 500; color: #f1f5f9;">${item.dari || '-'}</span>
                      <i class="fas fa-arrow-right" style="margin: 0 8px; font-size: 0.8rem; opacity: 0.5; color: #94a3b8;"></i>
                      <span style="font-weight: 500; color: #f1f5f9;">${item.ke || '-'}</span>
                    </div>
                  </div>
                  <span style="color: #f59e0b; font-size: 0.85rem;">${item.tanggal || '-'}</span>
                </div>
              </div>`;
          });
          
          html += `</div></div>`;
        }
        
        // Jika tidak ada mutasi tapi ada handover, tampilkan pesan
        if (allMutasi.length === 0 && handoverData) {
          html += `<p style="color: #64748b; font-size: 0.85rem; text-align: center; margin-top: 10px;">Tidak ada data mutasi kunci masuk/keluar</p>`;
        }
        
        html += `</div>`;
        container.innerHTML = html;
        console.log('✅ Data mutasi ditampilkan');
      } else {
        container.innerHTML = `<div class="progress-section detailed" style="border-left: 6px solid #8b5cf6; margin-bottom: 15px; padding: 15px; background: rgba(15, 23, 42, 0.5); border-radius: 12px;">
          <h3 style="color: #8b5cf6; margin-bottom: 15px;"><i class="fas fa-history"></i> Riwayat Mutasi Kunci</h3>
          <p style="color: #94a3b8; text-align: center; padding: 20px;">Belum ada data mutasi untuk kavling ini</p>
        </div>`;
        console.log('ℹ️ Tidak ada data mutasi');
      }
    } else {
      container.innerHTML = `<div class="progress-section detailed" style="border-left: 6px solid #8b5cf6; margin-bottom: 15px; padding: 15px; background: rgba(15, 23, 42, 0.5); border-radius: 12px;">
        <h3 style="color: #8b5cf6; margin-bottom: 15px;"><i class="fas fa-history"></i> Riwayat Mutasi Kunci</h3>
        <p style="color: #94a3b8; text-align: center; padding: 20px;">Gagal mengambil data (success: false)</p>
      </div>`;
      console.log('⚠️ Server returned success: false');
    }
  } catch (error) {
    console.error('❌ Error loading mutation history:', error);
    container.innerHTML = `<div style="text-align: center; padding: 20px; color: #f87171;"><i class="fas fa-exclamation-triangle"></i> Gagal memuat data mutasi: ${error.message || 'Unknown error'}</div>`;
  }
}

// ========== SAVEKEYDELIVERY ==========
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

// ========== SAVEPROPERTYDATAMANAGER ==========
async function savePropertyDataManager() {
  if (!selectedKavling) {
    showToast('warning', 'Pilih kavling terlebih dahulu');
    return;
  }

  const notesEl = document.getElementById('propertyNotesManager');
  const notes = notesEl ? notesEl.value.trim() : '';

  const photoInput = document.getElementById('revisionPhotoInput');
  let photoBase64 = null;

  if (photoInput && photoInput.files && photoInput.files[0]) {
    photoBase64 = await compressImage(photoInput.files[0]);
  }

  showGlobalLoading('Menyimpan data...');

  try {
    // 1. Simpan Catatan (jika ada)
    if (notes !== '') {
      const notesResponse = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
        action: 'savePropertyNotes',
        kavling: selectedKavling,
        notes: notes,
        user: 'manager'
      });

      if (!notesResponse.success) {
        hideGlobalLoading();
        showToast('error', 'Gagal menyimpan catatan: ' + notesResponse.message);
        return;
      }

      if (currentKavlingData && currentKavlingData.kavling === selectedKavling) {
        currentKavlingData.propertyNotes = notes;
      }
    }

    // 2. Upload Foto (jika ada)
    if (photoBase64) {
      // Hilangkan prefix data:image/jpeg;base64,
      const base64Data = photoBase64.split(',')[1];
      
      const photoResponse = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
        action: 'uploadRevisionPhoto',
        kavlingName: selectedKavling,
        image: base64Data, // Kirim raw base64 data tanpa prefix
        uploadedBy: 'supervisor'
      });

      if (photoResponse && photoResponse.success) {
        if (photoInput) {
          photoInput.value = '';
          const preview = document.getElementById('revisionPhotoPreview');
          if (preview) preview.style.display = 'none';
        }
        loadRevisionPhotos(selectedKavling);
        showToast('success', '✅ Foto berhasil disimpan');
      } else {
        showToast('warning', notes !== '' ? 'Catatan tersimpan, tapi gagal menyimpan foto' : 'Gagal menyimpan foto');
      }
    }

    if (notes !== '' || photoBase64) {
      showStatusModal('success', 'Berhasil', 'Data berhasil disimpan');
      setTimeout(() => {
        hideGlobalLoading();
      }, 1500);
    } else {
      hideGlobalLoading();
      showToast('info', 'Tidak ada data yang perlu disimpan');
    }

  } catch (error) {
    console.error('Error saving data:', error);
    hideGlobalLoading();
    showToast('error', 'Terjadi kesalahan: ' + error.message);
  }
}

// ========== SAVEPROPERTYNOTES ==========
async function savePropertyNotes() {
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
