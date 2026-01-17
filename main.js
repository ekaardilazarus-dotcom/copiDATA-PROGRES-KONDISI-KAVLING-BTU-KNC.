// script.js - File utama yang mengimpor semua modul
// versi 0.4 - Modular version

// Impor modul-modul
// Catatan: Dalam lingkungan browser, kita tidak bisa menggunakan import/export ES6
// tanpa server yang mendukung modules. Kita akan load semua file secara terpisah.
// File ini akan berisi fungsi-fungsi utama yang tidak dipisahkan.

// ========== UTILITY FUNCTIONS ==========
// Global event listener for sync buttons
document.addEventListener('click', function(e) {
  if (e.target.closest('.sync-btn')) {
    searchKavling(true); // isSync = true
  }
});

function showStatusModal(type, title, message) {
  const modal = document.getElementById('loadingModal');
  const textEl = document.getElementById('loadingText');
  const modalContent = modal.querySelector('.modal-content');

  if (!modalContent) return;

  const isDelete = type === 'delete-success';
  const isSuccess = type === 'success' || isDelete;
  const isError = type === 'error';
  
  let iconHtml = '';
  if (type === 'loading') {
    iconHtml = '<i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #38bdf8; margin-bottom: 20px;"></i>';
  } else if (isSuccess) {
    iconHtml = `
      <div class="success-checkmark">
        <div class="check-icon ${isDelete ? 'delete' : ''}">
          <span class="icon-line line-tip"></span>
          <span class="icon-line line-long"></span>
          <div class="icon-circle"></div>
          <div class="icon-fix"></div>
        </div>
      </div>
      <style>
        .success-checkmark { width: 80px; height: 115px; margin: 0 auto; position: relative; }
        .success-checkmark .check-icon { width: 80px; height: 80px; position: relative; border-radius: 50%; box-sizing: content-box; border: 4px solid #10b981; margin-bottom: 20px; }
        .success-checkmark .check-icon.delete { border-color: #ef4444; }
        .success-checkmark .check-icon .icon-line { height: 5px; background-color: #10b981; display: block; border-radius: 2px; position: absolute; z-index: 10; }
        .success-checkmark .check-icon.delete .icon-line { background-color: #ef4444; }
        .success-checkmark .check-icon .icon-line.line-tip { top: 46px; left: 14px; width: 25px; transform: rotate(45deg); animation: icon-line-tip 0.75s; }
        .success-checkmark .check-icon .icon-line.line-long { top: 38px; right: 8px; width: 47px; transform: rotate(-45deg); animation: icon-line-long 0.75s; }
        .success-checkmark .check-icon .icon-circle { top: -4px; left: -4px; z-index: 10; width: 80px; height: 80px; border-radius: 50%; border: 4px solid rgba(16, 185, 129, 0.5); box-sizing: content-box; position: absolute; }
        .success-checkmark .check-icon.delete .icon-circle { border-color: rgba(239, 68, 68, 0.5); }
        .success-checkmark .check-icon .icon-fix { top: 8px; width: 5px; left: 26px; z-index: 1; height: 85px; position: absolute; transform: rotate(-45deg); }
        @keyframes icon-line-tip {
            0% { width: 0; left: 1px; top: 19px; }
            54% { width: 0; left: 1px; top: 19px; }
            70% { width: 50px; left: -8px; top: 37px; }
            84% { width: 17px; left: 21px; top: 48px; }
            100% { width: 25px; left: 14px; top: 46px; }
        }
        @keyframes icon-line-long {
            0% { width: 0; right: 46px; top: 54px; }
            65% { width: 0; right: 46px; top: 54px; }
            84% { width: 55px; right: 0px; top: 35px; }
            100% { width: 47px; right: 8px; top: 38px; }
        }
      </style>
    `;
  }

  modal.querySelector('.modal-content').innerHTML = `
    ${iconHtml}
    <h2 style="font-size: 1.25rem; margin-top: 10px;">${title}</h2>
    <p style="color: #94a3b8; margin-top: 5px;">${message}</p>
  `;
  
  modal.style.display = 'flex';

  if (isSuccess) {
    setTimeout(() => {
      hideGlobalLoading();
      // Restore original content for next use
      const modalContentEl = modal.querySelector('.modal-content');
      if (modalContentEl) {
        modalContentEl.innerHTML = `
          <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #38bdf8; margin-bottom: 20px;"></i>
          <h2 style="font-size: 1.25rem;">Mohon Tunggu</h2>
          <p id="loadingText">Sedang mengambil data...</p>
        `;
      }
    }, 2000);
  }
}

function showGlobalLoading(text = 'Mohon Tunggu...') {
  showStatusModal('loading', 'Mohon Tunggu', text);
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

// ========== FUNGSI LOAD KEY DELIVERY DATA ==========
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

function updateKeyDeliveryDisplay(data) {
  const deliverySection = document.getElementById('tab-delivery');
  if (!deliverySection) return;
  
  const deliveryToInput = deliverySection.querySelector('.delivery-section');
  const deliveryDateInput = deliverySection.querySelector('.key-delivery-date');
  
  if (deliveryToInput) {
    deliveryToInput.value = data.deliveryTo || '';
  }
  
  if (deliveryDateInput) {
    deliveryDateInput.value = data.deliveryDate || '';
  }
}

function resetKeyDeliveryForm() {
  const deliverySection = document.getElementById('tab-delivery');
  if (!deliverySection) return;
  
  const deliveryToInput = deliverySection.querySelector('.delivery-section');
  const deliveryDateInput = deliverySection.querySelector('.key-delivery-date');
  
  if (deliveryToInput) deliveryToInput.value = '';
  if (deliveryDateInput) deliveryDateInput.value = '';
}

// ========== LOAD PROGRESS DATA ==========
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

    // Load Tanggal Penyerahan Kunci
    if (progressData.tahap4['TANGGAL_PENYERAHAN_KUNCI']) {
      const dateEl = pageElement.querySelector('.key-delivery-date');
      if (dateEl) {
        const rawDate = progressData.tahap4['TANGGAL_PENYERAHAN_KUNCI'];
        let formattedDate = '';
        
        if (rawDate instanceof Date || (typeof rawDate === 'string' && rawDate.includes('-'))) {
          formattedDate = formatDateForInput(rawDate);
        } else if (rawDate) {
          formattedDate = formatDateForInput(new Date(rawDate));
        }
        
        dateEl.value = formattedDate;
        console.log(`Loaded date for ${selectedKavling}: ${rawDate} → ${formattedDate}`);
      }
    }

    // Load Completion
    if (progressData.tahap4['COMPLETION / Penyelesaian akhir']) {
      const completionCheckbox = findCheckboxByTaskName('COMPLETION / Penyelesaian akhir', 4, rolePage);
      if (!completionCheckbox) {
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
  
  console.log(`🔄 Starting UI setup for ${rolePage}...`);
  
  setTimeout(() => {
    console.log(`✅ Data loaded for ${rolePage}, setting up UI...`);
    
    // 1. Setup checkbox listeners
    const checkboxCount = pageElement.querySelectorAll('input[type="checkbox"]').length;
    console.log(`📋 Found ${checkboxCount} checkboxes`);
    setupCheckboxListeners(rolePage);
    
    // 2. Setup state buttons (PENTING!)
    const stateBtnCount = pageElement.querySelectorAll('.system-btn, .tiles-btn, .table-btn').length;
    console.log(`🎯 Found ${stateBtnCount} state buttons`);
    setupStateButtons(rolePage);
    
    // 3. Aktifkan semua input
    console.log(`🔓 Enabling all inputs...`);
    enableAllInputs();
    
    // 4. Perbaiki font styles
    console.log(`🎨 Fixing font styles...`);
    fixFontStyles();
    
    // 5. Update progress calculation
    console.log(`📊 Updating progress...`);
    updateProgress(rolePage);
    
    // 6. Tambahkan visual feedback
    addVisualFeedback();
    
    console.log(`✅ UI setup complete for ${rolePage}! Inputs should be editable now.`);
    
    // 7. Debug final status
    debugFinalStatus();
    
  }, 300);
}

// Helper function to find checkbox by task name
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

// ========== FUNGSI TAMBAHAN UNTUK USER4 ==========
function loadUtilitasDataFromData(data) {
  // Key delivery
  const keyInput = document.getElementById('keyDeliveryInputUser4');
  if (keyInput) {
    keyInput.value = data.data?.tahap4?.['PENYERAHAN KUNCI'] || '';
  }
  
  // Utility Dates
  const listrikInput = document.getElementById('listrikInstallDate');
  const airInput = document.getElementById('airInstallDate');
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
    
    const btnSaveKeyDelivery = document.querySelector('#tab-delivery .btn-save-section');
    if (btnSaveKeyDelivery) {
      btnSaveKeyDelivery.addEventListener('click', async function(e) {
        e.preventDefault();
        await saveKeyDelivery();
      });
    }
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

// ========== EDIT KAVLING FUNCTIONS ==========
function setupEditKavling() {
  const editBtns = document.querySelectorAll('.btn-edit-kavling');
  const modal = document.getElementById('editKavlingModal');
  const closeBtn = document.getElementById('closeEditKavling');
  const submitBtn = document.getElementById('submitEditKavling');

  editBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!selectedKavling || !currentKavlingData) {
        showToast('warning', 'Pilih kavling terlebih dahulu di menu "Pilih Kavling"!');
        const selectId = getSelectIdByRole(currentRole);
        const selectEl = document.getElementById(selectId);
        if (selectEl) {
          selectEl.focus();
          // Visual highlight
          selectEl.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.5)';
          setTimeout(() => selectEl.style.boxShadow = '', 2000);
        }
        return;
      }

      // Fill modal with current data
      document.getElementById('editKavlingName').value = currentKavlingData.kavling;
      document.getElementById('editKavlingType').value = currentKavlingData.type || '';
      document.getElementById('editKavlingLT').value = currentKavlingData.lt || '';
      document.getElementById('editKavlingLB').value = currentKavlingData.lb || '';

      modal.style.display = 'flex';
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
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
          modal.style.display = 'none';
          
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
    });
  }

  const deleteBtn = document.getElementById('deleteKavlingData');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
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
          modal.style.display = 'none';
          
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
    });
  }
}

// ========== FUNGSI TAMBAHAN UNTUK VISUAL ==========
function addVisualFeedback() {
  const pageId = currentRole + 'Page';
  const page = document.getElementById(pageId);
  if (!page) return;
  
  // Tambahkan efek visual untuk state buttons
  const stateBtns = page.querySelectorAll('.system-btn, .tiles-btn, .table-btn');
  stateBtns.forEach(btn => {
    // Tambah transition
    btn.style.transition = 'all 0.2s ease';
    
    // Tambah hover effect yang lebih jelas
    btn.addEventListener('mouseenter', function() {
      if (!this.classList.contains('active')) {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      }
    });
    
    btn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      if (!this.classList.contains('active')) {
        this.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
      }
    });
  });
  
  // Tambah visual untuk checkbox
  const checkboxes = page.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.style.transform = 'scale(1.2)';
    cb.style.marginRight = '10px';
    
    // Highlight jika checked
    if (cb.checked) {
      const label = cb.closest('label');
      if (label) {
        label.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        label.style.padding = '8px 12px';
        label.style.borderRadius = '6px';
      }
    }
  });
}

function debugFinalStatus() {
  const pageId = currentRole + 'Page';
  const page = document.getElementById(pageId);
  if (!page) return;
  
  console.log('=== FINAL DEBUG STATUS ===');
  
  // Checkboxes
  const checkboxes = page.querySelectorAll('input[type="checkbox"]');
  let enabledCheckboxes = 0;
  checkboxes.forEach(cb => {
    if (!cb.disabled) enabledCheckboxes++;
  });
  console.log(`Checkboxes: ${enabledCheckboxes}/${checkboxes.length} enabled`);
  
  // State buttons
  const stateBtns = page.querySelectorAll('.system-btn, .tiles-btn, .table-btn');
  let enabledButtons = 0;
  stateBtns.forEach(btn => {
    if (!btn.disabled) enabledButtons++;
  });
  console.log(`State buttons: ${enabledButtons}/${stateBtns.length} enabled`);
  
  // Simpan buttons
  const saveBtns = page.querySelectorAll('.btn-save-section');
  console.log(`Save buttons: ${saveBtns.length} found`);
}

function fixFontStyles() {
  console.log('Applying font style fixes...');
  // Tambahkan style fixes jika diperlukan
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  setupEditKavling();
  setupCustomSearch('searchKavlingUser1Input', 'searchKavlingUser1List', 'searchKavlingUser1');
  setupCustomSearch('searchKavlingUser2Input', 'searchKavlingUser2List', 'searchKavlingUser2');
  setupCustomSearch('searchKavlingUser3Input', 'searchKavlingUser3List', 'searchKavlingUser3');
  setupCustomSearch('searchKavlingUser4Input', 'searchKavlingUser4List', 'searchKavlingUser4');
  setupCustomSearch('searchKavlingManagerInput', 'searchKavlingManagerList', 'searchKavlingManager');
  
  // Set initial setup for each page if needed
  setupUser4Page();
  
  updateTabsState(); // Initial state: disabled if no kavling
  
  // Initialize the app
  initApp();
});

// ========== FUNGSI UNTUK MANAGER ==========
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

// ========== FUNGSI UNTUK ADMIN ==========
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

function handleEditUser(role, displayName, id) {
  showToast('info', 'Fitur edit pengguna akan segera hadir');
  console.log('Edit user:', { role, displayName, id });
}

// ========== FUNGSI PROPERTY NOTES ==========
function savePropertyNotes() {
  console.log('savePropertyNotes called');
  if (!selectedKavling) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }
  
  const notesEl = document.getElementById('propertyNotesManager');
  if (!notesEl) return;
  
  const notes = notesEl.value.trim();
  
  showGlobalLoading('Menyimpan catatan...');
  
  // Implementasi save property notes
  // ... (kode untuk save property notes)
}

function loadPropertyNotes(kavlingName) {
  console.log('loadPropertyNotes called for:', kavlingName);
  // Implementasi load property notes
}

function loadPropertyNotesFromData(data) {
  const notesEl = document.getElementById('propertyNotesManager');
  if (notesEl && data.propertyNotes) {
    notesEl.value = data.propertyNotes;
  }
}

// ========== START APPLICATION ==========
// Tunggu DOM siap sepenuhnya
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM sudah siap
  initApp();
}
