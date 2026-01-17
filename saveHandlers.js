// saveHandlers.js - Fungsi save untuk semua tahap

// Save Tahap 1
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

// Save Tahap 2
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

// Save Tahap 3
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

// Save Tahap 4
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

// Save Key Delivery
async function saveKeyDelivery() {
  if (!selectedKavling) {
    showToast('warning', 'Pilih kavling terlebih dahulu!');
    return;
  }
  
  // Cari elemen-elemen di tab baru
  const deliverySection = document.getElementById('tab-delivery');
  if (!deliverySection) {
    showToast('error', 'Tab penyerahan kunci tidak ditemukan');
    return;
  }
  
  const deliveryToInput = deliverySection.querySelector('.delivery-section');
  const deliveryDateInput = deliverySection.querySelector('.key-delivery-date');
  
  if (!deliveryToInput || !deliveryDateInput) {
    console.error('Input elements not found:', {
      deliveryTo: !!deliveryToInput,
      deliveryDate: !!deliveryDateInput
    });
    showToast('error', 'Form tidak lengkap!');
    return;
  }
  
  const deliveryTo = deliveryToInput.value.trim();
  const deliveryDate = deliveryDateInput.value;
  
  if (!deliveryTo) {
    showToast('warning', 'Harap isi "Penyerahan Kunci Ke"');
    deliveryToInput.focus();
    return;
  }
  
  showGlobalLoading('Menyimpan data penyerahan kunci...');
  
  try {
    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'saveKeyDelivery',
      kavling: selectedKavling,
      deliveryTo: deliveryTo,
      deliveryDate: deliveryDate,
      user: currentRole
    });
    
    if (result.success) {
      showToast('success', 'Data penyerahan kunci berhasil disimpan!');
      
      // Update data lokal
      if (currentKavlingData) {
        if (!currentKavlingData.keyDelivery) currentKavlingData.keyDelivery = {};
        currentKavlingData.keyDelivery.deliveryTo = deliveryTo;
        currentKavlingData.keyDelivery.deliveryDate = deliveryDate;
      }
      
      // Clear form jika berhasil
      deliveryToInput.value = '';
      deliveryDateInput.value = '';
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

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    saveTahap1,
    saveTahap2,
    saveTahap3,
    saveTahap4,
    saveKeyDelivery
  };
}
