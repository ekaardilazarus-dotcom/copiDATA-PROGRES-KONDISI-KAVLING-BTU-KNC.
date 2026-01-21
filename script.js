// versi 0.45
const USER_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx08smViAL2fT_P0ZCljaM8NGyDPZvhZiWt2EeIy1MYsjoWnSMEyXwoS6jydO-_J8OH/exec';
const PROGRESS_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzSFK7tTjxYD-Z-UO35ObXnOMIxNdOmiN_YiV4xTvuifuoLY7v4Gs6HMmPn-yHGyJlbmg/exec';

let currentRole = null;
let selectedKavling = null;
let currentKavlingData = null;

const defaultDisplayNames = {
  'user1': 'Pelaksana 1',
  'user2': 'Pelaksana 2',
  'user3': 'Pelaksana 3',
  'user4': 'Pelaksana 4',
  'manager': 'Supervisor',
  'admin': 'Admin'
};

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
  const propNotesInput = document.getElementById('utilityPropertyNotes');

  if (listrikInput) listrikInput.value = data.utilitas?.listrikDate || '';
  if (airInput) airInput.value = data.utilitas?.airDate || '';
  if (propNotesInput) propNotesInput.value = data.propertyNotes || '';
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
//--------
function setupUser4Tabs() {
  const page = document.getElementById('user4Page');
  if (!page) return;

  const tabBtns = page.querySelectorAll('.admin-tab-btn');
  const tabContents = page.querySelectorAll('.tab-content-item');

  console.log('Setting up User4 tabs, count:', tabBtns.length);

  // Set active tab pertama kali jika belum ada
  if (tabBtns.length > 0 && !page.querySelector('.admin-tab-btn.active')) {
    tabBtns[0].classList.add('active');
    const firstTabId = tabBtns[0].getAttribute('data-tab');
    const firstTab = page.querySelector('#tab-' + firstTabId);
    if (firstTab) firstTab.classList.add('active');
  }

  tabBtns.forEach(btn => {
    // Hapus listener lama jika ada
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      console.log('User4 Tab clicked:', tabId);

      // Hapus active dari semua tombol dan konten di halaman ini
      const allBtns = page.querySelectorAll('.admin-tab-btn');
      const allContents = page.querySelectorAll('.tab-content-item');

      allBtns.forEach(b => b.classList.remove('active'));
      allContents.forEach(c => c.classList.remove('active'));

      // Tambah active ke yang dipilih
      this.classList.add('active');
      const targetTab = page.querySelector('#tab-' + tabId);
      if (targetTab) {
        targetTab.classList.add('active');

        // Load data sesuai tab
        if (tabId === 'utility-install' && selectedKavling) {
          setTimeout(() => {
            loadUtilitasData();
          }, 200);
        } else if (tabId === 'delivery' && selectedKavling) {
          setTimeout(() => {
            loadKeyDeliveryData();
          }, 200);
        }
      }
    });
  });
}

function loadPropertyNotesFromData(data) {
  const notesEl = document.getElementById('propertyNotesManager');
  if (notesEl && data) {
    notesEl.value = data.propertyNotes || '';
  }
}

// ========== DEBUG: CHECK KEY DELIVERY HTML STRUCTURE ==========
function debugKeyDeliveryStructure() {
  console.log('=== DEBUG KEY DELIVERY STRUCTURE ===');

  const user4Page = document.getElementById('user4Page');
  if (!user4Page) {
    console.log('❌ user4Page not found');
    return;
  }

  // Cari tab delivery
  const deliveryTab = user4Page.querySelector('#tab-delivery');
  if (!deliveryTab) {
    console.log('❌ tab-delivery not found');
    return;
  }

  console.log('✅ tab-delivery found');

  // Cari elemen input
  const deliveryToInput = deliveryTab.querySelector('.delivery-section');
  const deliveryDateInput = deliveryTab.querySelector('.key-delivery-date');
  const saveButton = deliveryTab.querySelector('.btn-save-section');

  console.log('Elements found:', {
    deliveryToInput: deliveryToInput ? '✅' : '❌',
    deliveryDateInput: deliveryDateInput ? '✅' : '❌',
    saveButton: saveButton ? '✅' : '❌'
  });

  if (deliveryToInput) {
    console.log('delivery-section type:', deliveryToInput.type || deliveryToInput.tagName);
  }

  if (deliveryDateInput) {
    console.log('key-delivery-date type:', deliveryDateInput.type || deliveryDateInput.tagName);
  }
}

// Panggil setelah DOM siap
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(debugKeyDeliveryStructure, 1500);
});
// ========== SEARCH CONTAINER FUNCTIONS ==========
let allKavlings = [];

function setupCustomSearch(inputId, listId, selectId) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  const select = document.getElementById(selectId);

 if (!input || !list || !select) {
    console.error(`Custom search elements not found: ${inputId}, ${listId}, ${selectId}`);
    return;
  }

  // Pastikan input selalu aktif
  input.disabled = false;
  input.style.pointerEvents = 'auto';
  input.style.cursor = 'text';

  // Hapus event listener lama jika ada
  const newInput = input.cloneNode(true);
  input.parentNode.replaceChild(newInput, input);

  // Setup event listeners baru
  newInput.addEventListener('focus', () => {
    console.log(`Input ${inputId} focused`);
    if (allKavlings.length > 0) {
      renderSearchList(allKavlings, list, newInput, select);
      list.style.display = 'block';
      list.style.zIndex = '1000';
    }
  });

  newInput.addEventListener('input', (e) => {
    console.log(`Input ${inputId} changed:`, e.target.value);
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allKavlings.filter(k => k.toLowerCase().includes(searchTerm));
    renderSearchList(filtered, list, newInput, select);
    list.style.display = 'block';
  });

  newInput.addEventListener('click', (e) => {
    console.log(`Input ${inputId} clicked`);
    e.stopPropagation();
    if (allKavlings.length > 0 && list.style.display === 'none') {
      renderSearchList(allKavlings, list, newInput, select);
      list.style.display = 'block';
    }
  });

  // Tutup dropdown ketika klik di luar
  document.addEventListener('click', (e) => {
    if (!newInput.contains(e.target) && !list.contains(e.target)) {
      list.style.display = 'none';
    }
  });

  // Prevent closing when clicking inside dropdown
  list.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  console.log(`Custom search setup complete for ${inputId}`);
}

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
    // Don't clear the active search input that was just used
    if (!input.id.includes('Input') || input.value === '') {
       // if it's not an input field or it's already empty, we can skip or clear others
    }
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

function renderSearchList(items, listEl, inputEl, selectEl) {
  listEl.innerHTML = '';

  if (items.length === 0) {
    const noResult = document.createElement('div');
    noResult.className = 'custom-dropdown-item no-results';
    noResult.textContent = 'Tidak ada kavling ditemukan';
    listEl.appendChild(noResult);
    return;
  }

  // Limit to first 100 items for performance
  const displayItems = items.slice(0, 100);

  displayItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'custom-dropdown-item';
    div.textContent = item;
    div.onclick = async function() {
      console.log('Selected item via onclick:', item);

      // Tampilkan loading popup
     showStatusModal('loading', 'Mohon Tunggu', `Sedang mengambil data kavling ${item}...`);

      inputEl.value = item;
      selectEl.value = item;
      listEl.style.display = 'none';

      // Ensure the value is synced and trigger search
      selectedKavling = item;

      // Clear all inputs and progress displays before loading new data
      clearInputsForNewLoad();

      // Force change event for any listeners
      const event = new Event('change', { bubbles: true });
      selectEl.dispatchEvent(event);

      // Tunggu 300ms untuk efek visual
      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        const data = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
          action: 'getKavlingData',
          kavling: item
        });

        if (data.success) {
          currentKavlingData = {
            kavling: data.kavling || item,
            type: data.type || '-', 
            lt: data.lt || '-',
            lb: data.lb || '-',
            propertyNotes: data.propertyNotes || '',
            totalAH: data.totalAH || '0%',
            data: data.data || {}
          };

          updateKavlingInfo(currentKavlingData, currentRole + 'Page');
          loadProgressData(data.data);
          
          // Fix: Ensure total progress bar and notes are updated for manager
          if (currentRole === 'manager') {
            updateTotalProgressDisplay(currentKavlingData.totalAH, currentRole + 'Page');
            loadPropertyNotesFromData(currentKavlingData);
            loadRevisionPhotos(selectedKavling);
          } else if (currentRole === 'user1' || currentRole === 'user2' || currentRole === 'user3') {
            loadRevisionPhotosForPelaksana(selectedKavling, currentRole);
          }

          // Tampilkan sukses dan auto close
          showStatusModal('success', 'Data Dimuat', `Data ${item} berhasil dimuat!`);

          setTimeout(() => {
            hideGlobalLoading();
            showToast('success', `Data ${item} berhasil dimuat!`);
          }, 1500);

        } else {
          hideGlobalLoading();
          showToast('error', data.message || 'Kavling tidak ditemukan');
        }
      } catch (error) {
        hideGlobalLoading();
        showToast('error', 'Gagal mengambil data: ' + error.message);
      }
    };
    listEl.appendChild(div);
  });

  if (items.length > 100) {
    const more = document.createElement('div');
    more.className = 'custom-dropdown-item no-results';
    more.textContent = `...dan ${items.length - 100} lainnya (ketik untuk mencari)`;
    listEl.appendChild(more);
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
          action: 'deleteKavling', // Handled by user manually later
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
});

// ========== KAVLING FUNCTIONS ==========
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

// ========== PROGRESS FUNCTIONS ==========
function updateTabsState() {
  const pelaksanaTabs = document.querySelectorAll('.pelaksana-tabs .admin-tab-btn');
  const pelaksanaContent = document.querySelector('.pelaksana-tab-content');

  // SELALU AKTIFKAN TABS (Hapus fungsi freeze)
  pelaksanaTabs.forEach(btn => {
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
    btn.style.cursor = 'pointer';
  });

  if (pelaksanaContent) {
    pelaksanaContent.style.opacity = '1';
    pelaksanaContent.style.pointerEvents = 'auto';
  }

  // Selalu pastikan input aktif
  enableAllInputs();
}

// ========== FUNGSI BARU: Aktifkan/Nonaktifkan Input ==========
function disableAllInputs() {
  // Fungsi ini dikosongkan untuk menghapus fitur freeze/disable
  console.log("Freeze disabled: All inputs remain active");
  return;
}

function enableAllInputs() {
  const pageId = currentRole + 'Page';
  const page = document.getElementById(pageId);
  if (!page) {
    console.error(`❌ Page ${pageId} not found for enableAllInputs`);
    return;
  }

  console.log(`🔧 Enabling all inputs for ${pageId}`);

  // 1. Enable semua checkbox
 const checkboxes = page.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((cb, index) => {
    cb.disabled = false;
    cb.readOnly = false;
    cb.style.opacity = '1';
    cb.style.cursor = 'pointer';
    cb.style.pointerEvents = 'auto';

    // Tambah event listener langsung jika belum ada
    if (!cb.hasAttribute('data-listener-added')) {
      cb.addEventListener('change', function() {
        console.log(`Checkbox ${index} changed directly`);
        const label = this.closest('label');
        if (label) {
          if (this.checked) {
            label.classList.add('task-completed');
          } else {
            label.classList.remove('task-completed');
          }
        }
        updateProgress(pageId);
      });
      cb.setAttribute('data-listener-added', 'true');
    }
  });

  // 2. Enable tombol state
  const stateButtons = page.querySelectorAll('.state-btn, .system-btn, .tiles-btn, .table-btn');
  stateButtons.forEach((btn, index) => {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    btn.style.pointerEvents = 'auto';

    if (!btn.hasAttribute('data-listener-added')) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log(`State button ${index} clicked directly`);

        if (this.classList.contains('system-btn')) {
          toggleSystemButton(this, this.getAttribute('data-state'));
        } else if (this.classList.contains('tiles-btn')) {
          toggleTilesButton(this, this.getAttribute('data-state'));
        } else if (this.classList.contains('table-btn')) {
          toggleTableButton(this, this.getAttribute('data-state'));
        }
      });
      btn.setAttribute('data-listener-added', 'true');
    }
  });

  // 3. Enable input text/date/textarea
  const textInputs = page.querySelectorAll('input[type="text"], input[type="date"], textarea');
  textInputs.forEach(input => {
    input.disabled = false;
    input.readOnly = false;
    input.style.opacity = '1';
    input.style.cursor = 'text';
    input.style.pointerEvents = 'auto';

    // Tambahkan listener untuk input agar update progress saat mengetik/memilih tanggal
    if (!input.hasAttribute('data-listener-added')) {
      const updateFn = () => {
        console.log(`Input ${input.id || input.getAttribute('data-task')} changed`);
        updateProgress(pageId);
      };
      input.addEventListener('input', updateFn);
      input.addEventListener('change', updateFn);
      input.setAttribute('data-listener-added', 'true');
    }
  });

    // 4. Enable tombol save
    const saveButtons = page.querySelectorAll('.btn-save-section');
    saveButtons.forEach(btn => {
      if (btn.id === 'btnSaveUtility') return; // Skip specialized admin buttons
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.style.pointerEvents = 'auto';
    });

  console.log(`✅ Enabled: ${checkboxes.length} checkboxes, ${stateButtons.length} state buttons, ${saveButtons.length} save buttons`);

  // Debug output
  debugInputStatus();
}

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
       // Periksa data sebelum memuat
       console.log('Data dari server:', {
            sistemPembuangan: data.data?.tahap1?.['SISTEM PEMBUANGAN'],
            corMejaDapur: data.data?.tahap1?.['COR MEJA DAPUR'],
            keramikDinding: data.data?.tahap2?.['KERAMIK DINDING TOILET & DAPUR']
        });
      selectedKavling = kavlingName;
      updateTabsState(); // Enable tabs when kavling is loaded

      // Ambil data progres dari server
      let serverProgress = data.totalAH || '0%';

      // Konversi desimal (misal 0.14) ke persen (14%) jika perlu
      if (typeof serverProgress === 'number') {
        serverProgress = (serverProgress <= 1 ? Math.round(serverProgress * 100) : Math.round(serverProgress)) + '%';
      } else if (typeof serverProgress === 'string' && !serverProgress.includes('%')) {
        const num = parseFloat(serverProgress);
        if (!isNaN(num)) {
          serverProgress = (num <= 1 ? Math.round(num * 100) : Math.round(num)) + '%';
        }
      }

      // ✅ Simpan SEMUA data dari server dengan struktur yang benar
      currentKavlingData = {
        kavling: data.kavling || kavlingName,
        type: data.type || '-', 
        lt: data.lt || '-',
        lb: data.lb || '-',
        propertyNotes: data.propertyNotes || '',
        totalAH: serverProgress, // Gunakan nilai yang sudah diformat
        data: data.data || {}
      };

      setSelectedKavlingInDropdowns(kavlingName);
      updateKavlingInfo(currentKavlingData, rolePage);

      // LANGSUNG UPDATE PROGRESS DARI SERVER AGAR TIDAK MUNCUL 0%
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
        updateUtilitasProgressDisplay(currentKavlingData.totalAH);

        // Load additional data from Admin Utilitas Apps Script
        if (typeof loadAdminUtilitasData === 'function') {
            loadAdminUtilitasData(kavlingName);
        }

        // TAMBAHAN: Update Property Notes khusus untuk user4
        // Logic will now use loadProgressData since we added .tahap-comments class
      }

     // ⚡ Aktifkan semua input setelah data dimuat
            setTimeout(() => {
        enableAllInputs();

        // Tambahkan event listener untuk checkbox
        setupCheckboxListeners(rolePage);

        // Update tabs state
        updateTabsState();
      }, 100);

      // Tampilkan sukses dan auto close setelah 1.5 detik
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

// Fungsi baru untuk load property notes dari data
function setupCheckboxListeners(pageId) {
  const page = document.getElementById(pageId);
  if (!page) return;

  console.log(`Setting up checkbox listeners for ${pageId}`);

  // Hanya ambil checkbox yang ada di progress sections
  const checkboxes = page.querySelectorAll('.progress-section input[type="checkbox"].sub-task');

  checkboxes.forEach(checkbox => {
    // Clone untuk hapus event listener lama
    const newCheckbox = checkbox.cloneNode(true);
    checkbox.parentNode.replaceChild(newCheckbox, checkbox);

    // Setup event listener untuk checkbox baru
    newCheckbox.addEventListener('change', function() {
      console.log(`Checkbox changed: ${this.id || this.name || 'unnamed'}`, this.checked);

      const label = this.closest('label');
      if (label) {
        if (this.checked) {
          label.classList.add('task-completed');
        } else {
          label.classList.remove('task-completed');
        }
      }

      // Update progress
      updateProgress(pageId);
    });

    // Pastikan checkbox enabled
    newCheckbox.disabled = false;
    newCheckbox.style.pointerEvents = 'auto';
    newCheckbox.style.opacity = '1';
    newCheckbox.style.cursor = 'pointer';
  });

  console.log(`✅ Setup ${checkboxes.length} checkbox listeners for ${pageId}`);
}

// Fungsi toggle untuk tombol pilihan
function toggleSystemButton(button, state) {
  const parent = button.closest('.task-item') || button.closest('.task-item-standalone');
  if (!parent) return;
  const buttons = parent.querySelectorAll('.system-btn');
  const idSuffix = (currentRole === 'user1' || currentRole === 'user2' || currentRole === 'user3' || currentRole === 'user4' || currentRole === 'user5') ? `User${currentRole.slice(-1)}` : '';
  const hiddenInput = parent.querySelector(`#wasteSystemInput${idSuffix}`) || parent.querySelector('#wasteSystemInput') || parent.querySelector('input[type="hidden"]');

  const wasActive = button.classList.contains('active');

  buttons.forEach(btn => {
    btn.setAttribute('data-active', 'false');
    btn.classList.remove('active');
  });

  if (!wasActive) {
    button.setAttribute('data-active', 'true');
    button.classList.add('active');
    if (hiddenInput) {
      hiddenInput.value = state;
    }
  } else {
    if (hiddenInput) {
      hiddenInput.value = '';
    }
  }

  // Update progress calculation
  const pageId = currentRole + 'Page';
  updateProgress(pageId);
}

function toggleTilesButton(button, state) {
  const parent = button.closest('.task-item') || button.closest('.task-item-standalone');
  if (!parent) return;
  const buttons = parent.querySelectorAll('.tiles-btn');
  const idSuffix = (currentRole === 'user1' || currentRole === 'user2' || currentRole === 'user3' || currentRole === 'user4' || currentRole === 'user5') ? `User${currentRole.slice(-1)}` : '';
  const hiddenInput = parent.querySelector(`#bathroomTilesInput${idSuffix}`) || parent.querySelector('#bathroomTilesInput') || parent.querySelector('input[type="hidden"]');

  const wasActive = button.classList.contains('active');

  buttons.forEach(btn => {
    btn.setAttribute('data-active', 'false');
    btn.classList.remove('active');
  });

  if (!wasActive) {
    button.setAttribute('data-active', 'true');
    button.classList.add('active');
    if (hiddenInput) {
      hiddenInput.value = state === 'include' ? 'Dengan Keramik Dinding' : 'Tanpa Keramik Dinding';
    }
  } else {
    if (hiddenInput) {
      hiddenInput.value = '';
    }
  }

  // Update progress calculation
  const pageId = currentRole + 'Page';
  updateProgress(pageId);
}

function toggleTableButton(button, state) {
  const parent = button.closest('.task-item') || button.closest('.task-item-standalone');
  if (!parent) return;
  const buttons = parent.querySelectorAll('.table-btn');
  const idSuffix = (currentRole === 'user1' || currentRole === 'user2' || currentRole === 'user3' || currentRole === 'user4' || currentRole === 'user5') ? `User${currentRole.slice(-1)}` : '';
  const hiddenInput = parent.querySelector(`#tableKitchenInput${idSuffix}`) || parent.querySelector('#tableKitchenInput') || parent.querySelector('input[type="hidden"]');

  const wasActive = button.classList.contains('active');

  buttons.forEach(btn => {
    btn.setAttribute('data-active', 'false');
    btn.classList.remove('active');
  });

  if (!wasActive) {
    button.setAttribute('data-active', 'true');
    button.classList.add('active');
    if (hiddenInput) {
      hiddenInput.value = state === 'include' ? 'Dengan Cor Meja Dapur' : 'Tanpa Cor Meja Dapur';
    }
  } else {
    if (hiddenInput) {
      hiddenInput.value = '';
    }
  }

  // Update progress calculation
  const pageId = currentRole + 'Page';
  updateProgress(pageId);
}

function setupStateButtons(pageId) {
  const page = document.getElementById(pageId);
  if (!page) return;

  console.log(`Setting up state buttons for ${pageId}`);

  // 1. Sistem Pembuangan
  const systemBtns = page.querySelectorAll('.system-btn');
  systemBtns.forEach(btn => {
    btn.onclick = function(e) {
      e.preventDefault();
      toggleSystemButton(this, this.getAttribute('data-state'));
    };
  });

  // 2. Keramik Dinding
  const tilesBtns = page.querySelectorAll('.tiles-btn');
  tilesBtns.forEach(btn => {
    btn.onclick = function(e) {
      e.preventDefault();
      toggleTilesButton(this, this.getAttribute('data-state'));
    };
  });

  // 3. Cor Meja Dapur
  const tableBtns = page.querySelectorAll('.table-btn');
  tableBtns.forEach(btn => {
    btn.onclick = function(e) {
      e.preventDefault();
      toggleTableButton(this, this.getAttribute('data-state'));
    };
  });
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
function setupRoleButtons() {
  console.log("=== DEBUG SETUP ROLE BUTTONS ===");

  const roleButtons = document.querySelectorAll('.role-btn');
  console.log(`Found ${roleButtons.length} role buttons`);

  if (roleButtons.length === 0) {
    console.error("❌ No role buttons found! Check HTML structure.");

    // Coba cari dengan cara lain
    const allButtons = document.querySelectorAll('button');
    console.log(`Total buttons on page: ${allButtons.length}`);
    allButtons.forEach((btn, i) => {
      console.log(`Button ${i}:`, {
        text: btn.textContent,
        classes: btn.className,
        dataRole: btn.getAttribute('data-role')
      });
    });

    return;
  }

  roleButtons.forEach((btn, index) => {
    console.log(`Role button ${index + 1}:`, {
      role: btn.getAttribute('data-role'),
      text: btn.querySelector('h3')?.textContent || btn.textContent,
      id: btn.id || 'no-id'
    });

    // Hapus event listener lama
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    // Tambah event listener baru dengan logging
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      console.log('✅ Role button clicked successfully!');
      console.log('Button data-role:', this.getAttribute('data-role'));
      console.log('Button text:', this.textContent);

      currentRole = this.getAttribute('data-role');
      console.log('Current role set to:', currentRole);

      // Reset modal
      const errorMsg = document.getElementById('errorMessage');
      const passwordInput = document.getElementById('passwordInput');

      if (errorMsg) errorMsg.textContent = '';
      if (passwordInput) passwordInput.value = '';

      // Show modal
      const modal = document.getElementById('passwordModal');
      if (modal) {
        modal.style.display = 'flex';
        console.log('✅ Password modal shown');

        // Update modal title
        const roleNames = {
          'user1': 'Pelaksana 1',
          'user2': 'Pelaksana 2', 
          'user3': 'Pelaksana 3',
          'user4': 'Admin Utilitas',
          'manager': 'Supervisor',
          'admin': 'Admin System'
        };

        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
          modalTitle.textContent = `Login sebagai ${roleNames[currentRole] || currentRole}`;
        }

        // Focus on password input
        setTimeout(() => {
          if (passwordInput) {
            passwordInput.focus();
            console.log('✅ Password input focused');
          }
        }, 100);
      } else {
        console.error('❌ Password modal not found!');
      }
    });

    console.log(`✅ Event listener added to role button ${index + 1}`);
  });

  console.log("=== ROLE BUTTONS SETUP COMPLETE ===");
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

function loadProgressData(progressData) {
  if (!progressData) return;

  const rolePage = currentRole + 'Page';
  const pageElement = document.getElementById(rolePage);
  if (!pageElement) return;

  // Tentukan suffix ID berdasarkan role
  let idSuffix = '';
  if (currentRole === 'user2') idSuffix = '2';
  else if (currentRole === 'user3') idSuffix = '3';

  // ===== Tahap 1 =====
  if (progressData.tahap1) {
    // SISTEM PEMBUANGAN
    const sistemPembuanganValue = progressData.tahap1['SISTEM PEMBUANGAN'];
    const taskItem = pageElement.querySelector('.waste-system');
    if (taskItem) {
      const buttons = taskItem.querySelectorAll('.system-btn');

      // PERBAIKAN: Cari hidden input berdasarkan role
      let hiddenInput;
      if (currentRole === 'user1') {
        hiddenInput = taskItem.querySelector('#wasteSystemInputUser1');
      } else if (currentRole === 'user2') {
        hiddenInput = taskItem.querySelector('#wasteSystemInputUser2');
      } else if (currentRole === 'user3') {
        hiddenInput = taskItem.querySelector('#wasteSystemInputUser3');
      } else if (currentRole === 'user4') {
        hiddenInput = taskItem.querySelector('#wasteSystemInputUser4');
      } else if (currentRole === 'user5') {
        hiddenInput = taskItem.querySelector('#wasteSystemInputUser5');
      }

      // ✅ Reset dulu
      buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('data-active', 'false');
      });

      // Apply kalau ada value
      if (sistemPembuanganValue) {
        buttons.forEach(btn => {
          if (btn.getAttribute('data-state') === sistemPembuanganValue.toLowerCase()) {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          }
        });
        if (hiddenInput) hiddenInput.value = sistemPembuanganValue;
      }
    }

    // COR MEJA DAPUR
    const corMejaDapurValue = progressData.tahap1['COR MEJA DAPUR'];
    const kitchenItem = pageElement.querySelector('.table-kitchen');
    if (kitchenItem) {
      const buttons = kitchenItem.querySelectorAll('.table-btn');

      // PERBAIKAN: Cari hidden input berdasarkan role
      let hiddenInput;
      if (currentRole === 'user1') {
        hiddenInput = kitchenItem.querySelector('#tableKitchenInputUser1');
      } else if (currentRole === 'user2') {
        hiddenInput = kitchenItem.querySelector('#tableKitchenInputUser2');
      } else if (currentRole === 'user3') {
        hiddenInput = kitchenItem.querySelector('#tableKitchenInputUser3');
      } else if (currentRole === 'user4') {
        hiddenInput = kitchenItem.querySelector('#tableKitchenInputUser4');
      } else if (currentRole === 'user5') {
        hiddenInput = kitchenItem.querySelector('#tableKitchenInputUser5');
      }

      // ✅ Reset dulu
      buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('data-active', 'false');
      });

      // Apply kalau ada value
      if (corMejaDapurValue) {
        buttons.forEach(btn => {
          if (btn.getAttribute('data-state') === 'include' && corMejaDapurValue === 'Dengan Cor Meja Dapur') {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          } else if (btn.getAttribute('data-state') === 'exclude' && corMejaDapurValue === 'Tanpa Cor Meja Dapur') {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          }
        });
        if (hiddenInput) hiddenInput.value = corMejaDapurValue;
      }
    }

    // Checkbox biasa Tahap 1
    const checkboxTasks1 = [
      'LAND CLEARING', 'PONDASI', 'SLOOF', 'PAS.DDG S/D2 CANOPY',
      'PAS.DDG S/D RING BLK', 'CONDUIT+INBOW DOOS', 'PIPA AIR KOTOR',
      'PIPA AIR BERSIH', 'PLESTER', 'ACIAN & BENANGAN'
    ];
    checkboxTasks1.forEach(taskName => {
      const isChecked = progressData.tahap1[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 1, rolePage);
      if (checkbox) {
        checkbox.checked = !!isChecked;
        const label = checkbox.closest('label');
        if (label) {
          if (isChecked) label.classList.add('task-completed');
          else label.classList.remove('task-completed');
        }
      }
    });
  }

  // ===== Tahap 2 =====
  if (progressData.tahap2) {
    // KERAMIK DINDING TOILET & DAPUR
    const keramikDindingValue = progressData.tahap2['KERAMIK DINDING TOILET & DAPUR'];
    const bathroomItem = pageElement.querySelector('.bathroom-tiles');
    if (bathroomItem) {
      const buttons = bathroomItem.querySelectorAll('.tiles-btn');

      // PERBAIKAN: Cari hidden input berdasarkan role
      let hiddenInput;
      if (currentRole === 'user1') {
        hiddenInput = bathroomItem.querySelector('#bathroomTilesInputUser1');
      } else if (currentRole === 'user2') {
        hiddenInput = bathroomItem.querySelector('#bathroomTilesInputUser2');
      } else if (currentRole === 'user3') {
        hiddenInput = bathroomItem.querySelector('#bathroomTilesInputUser3');
      } else if (currentRole === 'user4') {
        hiddenInput = bathroomItem.querySelector('#bathroomTilesInputUser4');
      } else if (currentRole === 'user5') {
        hiddenInput = bathroomItem.querySelector('#bathroomTilesInputUser5');
      }

      // ✅ Reset dulu
      buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('data-active', 'false');
      });

      // Apply kalau ada value
      if (keramikDindingValue) {
        buttons.forEach(btn => {
          if (btn.getAttribute('data-state') === 'include' && keramikDindingValue === 'Dengan Keramik Dinding') {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          } else if (btn.getAttribute('data-state') === 'exclude' && keramikDindingValue === 'Tanpa Keramik Dinding') {
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
          }
        });
        if (hiddenInput) hiddenInput.value = keramikDindingValue;
      }
    }

    // Checkbox biasa Tahap 2
    const checkboxTasks2 = ['RANGKA ATAP', 'GENTENG', 'PLAFOND', 'INSTALASI LISTRIK', 'KERAMIK LANTAI'];
    checkboxTasks2.forEach(taskName => {
      const isChecked = progressData.tahap2[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 2, rolePage);
      if (checkbox) {
        checkbox.checked = !!isChecked;
        const label = checkbox.closest('label');
        if (label) {
          if (isChecked) label.classList.add('task-completed');
          else label.classList.remove('task-completed');
        }
      }
    });
  }

  // ===== Tahap 3 =====
  if (progressData.tahap3) {
    Object.keys(progressData.tahap3).forEach(taskName => {
      const isChecked = progressData.tahap3[taskName];
      const checkbox = findCheckboxByTaskName(taskName, 3, rolePage);
      if (checkbox) {
        checkbox.checked = !!isChecked;
        const label = checkbox.closest('label');
        if (label) {
          if (isChecked) label.classList.add('task-completed');
          else label.classList.remove('task-completed');
        }
      }
    });
  }

  // ===== Tahap 4 =====
  if (progressData.tahap4) {
    // Keterangan
    if (progressData.tahap4['KETERANGAN']) {
      const commentEl = pageElement.querySelector('.tahap-comments');
      if (commentEl) commentEl.value = progressData.tahap4['KETERANGAN'];
    }

    // Penyerahan Kunci
    if (progressData.tahap4['PENYERAHAN KUNCI']) {
      const deliveryEl = pageElement.querySelector('.key-delivery-input');
      if (deliveryEl) deliveryEl.value = progressData.tahap4['PENYERAHAN KUNCI'];
    }

    // Tanggal Penyerahan Kunci
    if (progressData.tahap4['TANGGAL_PENYERAHAN_KUNCI']) {
      const dateEl = pageElement.querySelector('.key-delivery-date');
      if (dateEl) {
        const rawDate = progressData.tahap4['TANGGAL_PENYERAHAN_KUNCI'];

        // ⚠️ PERUBAHAN: Konversi ke yyyy-MM-dd untuk input date
        let formattedDate = '';

        if (rawDate) {
          // 1. Jika sudah format dd/mm/yyyy, konversi ke yyyy-MM-dd
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
            const [day, month, year] = rawDate.split('/');
            formattedDate = `${year}-${month}-${day}`;
          }
          // 2. Jika sudah format yyyy-MM-dd, langsung pakai
          else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
            formattedDate = rawDate;
          }
          // 3. Format lain, coba parse
          else {
            formattedDate = formatDateForInput(rawDate);
          }
        }

        dateEl.value = formattedDate;
        console.log(`Loaded date for ${selectedKavling}: ${rawDate} → ${formattedDate}`);
      }
    }
    setupTodayButtons();

    // Completion
    if (progressData.tahap4['COMPLETION / Penyelesaian akhir']) {
      const completionCheckbox = findCheckboxByTaskName('COMPLETION / Penyelesaian akhir', 4, rolePage);
      if (completionCheckbox) {
        completionCheckbox.checked = true;
        const label = completionCheckbox.closest('label');
        if (label) label.classList.add('task-completed');
      }
    }

    // Total progress
    if (progressData.tahap4['TOTAL']) {
      updateTotalProgressDisplay(progressData.tahap4['TOTAL'] || '0%', rolePage);
    }
  }

  updateProgress(rolePage);
}
function debugStateButtonsStatus() {
  if (!currentRole) return;

  const pageId = currentRole + 'Page';
  const page = document.getElementById(pageId);
  if (!page) return;

  // Sistem Pembuangan
  const wasteSystemInput = page.querySelector(`#wasteSystemInputUser${currentRole.slice(-1)}`) || page.querySelector('#wasteSystemInput');
  const wasteButtons = page.querySelectorAll('.system-btn');

  // Cor Meja Dapur
  const tableKitchenInput = page.querySelector(`#tableKitchenInputUser${currentRole.slice(-1)}`) || page.querySelector('#tableKitchenInput');
  const tableButtons = page.querySelectorAll('.table-btn');

  // Keramik Dinding
  const bathroomTilesInput = page.querySelector(`#bathroomTilesInputUser${currentRole.slice(-1)}`) || page.querySelector('#bathroomTilesInput');
  const tilesButtons = page.querySelectorAll('.tiles-btn');

  console.log('State Buttons Status:');
  console.log('1. Sistem Pembuangan:', {
    inputValue: wasteSystemInput ? wasteSystemInput.value : 'null',
    activeButtons: Array.from(wasteButtons).filter(btn => btn.classList.contains('active')).length
  });

  console.log('2. Cor Meja Dapur:', {
    inputValue: tableKitchenInput ? tableKitchenInput.value : 'null',
    activeButtons: Array.from(tableButtons).filter(btn => btn.classList.contains('active')).length
  });

  console.log('3. Keramik Dinding:', {
    inputValue: bathroomTilesInput ? bathroomTilesInput.value : 'null',
    activeButtons: Array.from(tilesButtons).filter(btn => btn.classList.contains('active')).length
  });
}

// ===== FUNGSI TAMBAHAN =====

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

    // Test click event
    const testClick = new Event('click', { bubbles: true });
    btn.dispatchEvent(testClick);
  });
  console.log(`State buttons: ${enabledButtons}/${stateBtns.length} enabled`);

  // Simpan buttons
  const saveBtns = page.querySelectorAll('.btn-save-section');
  console.log(`Save buttons: ${saveBtns.length} found`);

  // Test tombol pertama secara manual
  if (stateBtns.length > 0) {
    console.log('🔧 To test manually from console:');
    console.log('1. document.querySelector(".system-btn").click()');
    console.log('2. document.querySelectorAll(".system-btn")[0].click()');
    console.log('3. forceTestButtons()');
  }
}

// Fungsi untuk test tombol secara manual
function testStateButtonsManually() {
  console.log('=== MANUAL STATE BUTTONS TEST ===');

  if (!currentRole) {
    console.log('No current role selected');
    return;
  }

  const pageId = currentRole + 'Page';
  const page = document.getElementById(pageId);

  if (!page) {
    console.log(`Page ${pageId} not found`);
    return;
  }

  // Test Sistem Pembuangan
  const wasteButtons = page.querySelectorAll('.system-btn');
  console.log(`Found ${wasteButtons.length} system buttons`);

  wasteButtons.forEach((btn, index) => {
    console.log(`System button ${index}:`, {
      text: btn.textContent.trim(),
      dataState: btn.getAttribute('data-state'),
      isActive: btn.classList.contains('active')
    });
  });

  // Test Cor Meja Dapur
  const tableButtons = page.querySelectorAll('.table-btn');
  console.log(`Found ${tableButtons.length} table buttons`);

  tableButtons.forEach((btn, index) => {
    console.log(`Table button ${index}:`, {
      text: btn.textContent.trim(),
      dataState: btn.getAttribute('data-state'),
      isActive: btn.classList.contains('active')
    });
  });

  // Test Keramik Dinding
  const tilesButtons = page.querySelectorAll('.tiles-btn');
  console.log(`Found ${tilesButtons.length} tiles buttons`);

  tilesButtons.forEach((btn, index) => {
    console.log(`Tiles button ${index}:`, {
      text: btn.textContent.trim(),
      dataState: btn.getAttribute('data-state'),
      isActive: btn.classList.contains('active')
    });
  });
}

// Fungsi untuk testing manual dari console
function forceTestButtons() {
  const pageId = currentRole + 'Page';
  const page = document.getElementById(pageId);
  if (!page) return;

  console.log('🧪 FORCE TESTING BUTTONS...');

  const stateBtns = page.querySelectorAll('.system-btn, .tiles-btn, .table-btn');

  stateBtns.forEach((btn, index) => {
    console.log(`Testing button ${index}: ${btn.textContent.trim()}`);

    // Simulate click
    btn.click();

    // Check if click worked
    setTimeout(() => {
      const isActive = btn.classList.contains('active');
      console.log(`  Button ${index} active after click: ${isActive}`);
    }, 100);
  });

  console.log('✅ Force testing complete. Check console for results.');
}

// Perbaiki fungsi enableAllInputs untuk lebih agresif
function enableAllInputs() {
  const pageId = currentRole + 'Page';
  const page = document.getElementById(pageId);
  if (!page) {
    console.error(`❌ Page ${pageId} not found for enableAllInputs`);
    return;
  }

  console.log(`🔓 FORCE ENABLING ALL INPUTS for ${pageId}`);

  // 1. Enable semua checkbox dengan cara paksa
  const checkboxes = page.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((cb, index) => {
    // Hapus semua atribut disabled
    cb.removeAttribute('disabled');
    cb.disabled = false;
    cb.readOnly = false;

    // Force styling
    cb.style.opacity = '1';
    cb.style.cursor = 'pointer';
    cb.style.pointerEvents = 'auto';

    // Force event listener
    const newCb = cb.cloneNode(true);
    cb.parentNode.replaceChild(newCb, cb);

    newCb.addEventListener('change', function() {
      console.log(`📝 Checkbox ${index} changed:`, this.checked);
      const label = this.closest('label');
      if (label) {
        if (this.checked) {
          label.classList.add('task-completed');
        } else {
          label.classList.remove('task-completed');
        }
      }
      updateProgress(pageId);
    });
  });

  // 2. Enable tombol state dengan cara paksa
  const stateButtons = page.querySelectorAll('.state-btn, .system-btn, .tiles-btn, .table-btn');
  stateButtons.forEach((btn, index) => {
    // Force enable
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    btn.style.pointerEvents = 'auto';
    // Hapus inline styles yang memaksa warna putih/abu-abu
    btn.style.backgroundColor = '';
    btn.style.color = '';

    // Force event dengan .onclick
    btn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log(`🖱️ Button ${index} clicked via .onclick:`, this.textContent);

      if (this.classList.contains('system-btn')) {
        toggleSystemButton(this, this.getAttribute('data-state'));
      } else if (this.classList.contains('tiles-btn')) {
        toggleTilesButton(this, this.getAttribute('data-state'));
      } else if (this.classList.contains('table-btn')) {
        toggleTableButton(this, this.getAttribute('data-state'));
      }

      return false;
    };
  });

  console.log(`✅ Force enabled: ${checkboxes.length} checkboxes, ${stateButtons.length} state buttons`);
}

// ===== FUNGSI TAMBAHAN UNTUK FORMAT TANGGAL =====
function formatDateForInput(dateValue) {
  if (!dateValue) return '';

  let date;
  if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string') {
    const dateStr = dateValue.trim();
    // Jika sudah format dd/mm/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;

    // Jika format yyyy-mm-dd (dari DB/Spreadsheet ISO)
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const parts = dateStr.split('T')[0].split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    date = new Date(dateStr);
  } else {
    date = new Date(dateValue);
  }

  if (isNaN(date.getTime())) return String(dateValue);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

//
function findCheckboxByTaskName(taskName, tahap, pageId) {
  const pageElement = document.getElementById(pageId);
  if (!pageElement) return null;

  const cleanTaskName = taskName.toUpperCase().trim();

  // Cari semua checkbox di tahap yang sesuai
  const progressSection = pageElement.querySelector(`.progress-section[data-tahap="${tahap}"]`);
  if (!progressSection) return null;

  const checkboxes = progressSection.querySelectorAll('.sub-task[type="checkbox"]');

  for (let cb of checkboxes) {
    // Coba dengan data-task attribute
    if (cb.getAttribute('data-task') === cleanTaskName) {
      return cb;
    }

    // Coba dengan mencari di label text
    const label = cb.closest('label');
    if (label) {
      const labelText = label.textContent.toUpperCase().trim();
      const cleanSearch = cleanTaskName.replace(/[^A-Z0-9]/g, '');
      const cleanLabel = labelText.replace(/[^A-Z0-9]/g, '');

      if (cleanLabel.includes(cleanSearch) || cleanSearch.includes(cleanLabel)) {
        return cb;
      }
    }
  }

  return null;
}

// ========== FUNGSI saveTahap1 (PERBAIKAN untuk HTML) ==========
// ========== FUNGSI saveTahap1 (PERBAIKAN LENGKAP) ==========
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
  let wasteSystemInput, tableKitchenInput;

  if (currentRole === 'user1') {
    wasteSystemInput = tahap1Section.querySelector('#wasteSystemInputUser1');
    tableKitchenInput = tahap1Section.querySelector('#tableKitchenInputUser1');
  } else if (currentRole === 'user2') {
    wasteSystemInput = tahap1Section.querySelector('#wasteSystemInputUser2');
    tableKitchenInput = tahap1Section.querySelector('#tableKitchenInputUser2');
  } else if (currentRole === 'user3') {
    wasteSystemInput = tahap1Section.querySelector('#wasteSystemInputUser3');
    tableKitchenInput = tahap1Section.querySelector('#tableKitchenInputUser3');
  } else if (currentRole === 'user4') {
    wasteSystemInput = tahap1Section.querySelector('#wasteSystemInputUser4');
    tableKitchenInput = tahap1Section.querySelector('#tableKitchenInputUser4');
  } else if (currentRole === 'user5') {
    wasteSystemInput = tahap1Section.querySelector('#wasteSystemInputUser5');
    tableKitchenInput = tahap1Section.querySelector('#tableKitchenInputUser5');
  } else {
    // Fallback untuk role lain
    wasteSystemInput = tahap1Section.querySelector('#wasteSystemInput');
    tableKitchenInput = tahap1Section.querySelector('#tableKitchenInput');
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

  // PERBAIKAN: Handle Sistem Pembuangan dengan nilai yang benar
  if (wasteSystemInput) {
    const wasteValue = wasteSystemInput.value;
    console.log('Sistem Pembuangan value:', wasteValue);

    if (wasteValue === 'septictank') {
      tahapData['SISTEM PEMBUANGAN'] = 'Septictank';
    } else if (wasteValue === 'biotank') {
      tahapData['SISTEM PEMBUANGAN'] = 'Biotank';
    } else if (wasteValue === 'ipal') {
      tahapData['SISTEM PEMBUANGAN'] = 'Ipal';
    } else if (wasteValue === 'Septictank' || wasteValue === 'Biotank' || wasteValue === 'Ipal') {
      // Jika nilai sudah dalam format yang benar
      tahapData['SISTEM PEMBUANGAN'] = wasteValue;
    } else {
      tahapData['SISTEM PEMBUANGAN'] = ''; // Kosong jika tidak ada pilihan
    }
  }

  // PERBAIKAN: Handle Cor Meja Dapur dengan nilai yang benar
  if (tableKitchenInput) {
    const tableValue = tableKitchenInput.value;
    console.log('Cor Meja Dapur value:', tableValue);

    if (tableValue === 'include' || tableValue === 'Dengan Cor Meja Dapur') {
      tahapData['COR MEJA DAPUR'] = 'Dengan Cor Meja Dapur';
    } else if (tableValue === 'exclude' || tableValue === 'Tanpa Cor Meja Dapur') {
      tahapData['COR MEJA DAPUR'] = 'Tanpa Cor Meja Dapur';
    } else {
      tahapData['COR MEJA DAPUR'] = ''; // Kosong jika tidak ada pilihan
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

// ========== FUNGSI saveTahap2 (PERBAIKAN LENGKAP) ==========
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

// ========== FUNGSI saveTahap3 (PERBAIKAN LENGKAP) ==========
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

// ========== FUNGSI saveTahap4 (PERBAIKAN LENGKAP) ==========
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

    // Load script admin
    loadAdminUtilitasScript().then(() => {
        // Setup tabs
        setupUser4Tabs();

        // Setup event listeners
        setupUser4EventListeners();

        // Setup mutasi buttons
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

        console.log('User4 page setup complete with Admin Utilitas');
    }).catch(error => {
        console.error('Failed to load Admin Utilitas, using fallback:', error);
        // Fallback setup tanpa admin utilities
        setupUser4Tabs();
        setupUser4EventListeners();
        setupMutasiButtons();
    });
}
// ========== FUNGSI YANG DIBUTUHKAN OLEH SCRIPTADMIN.JS ==========

// Fungsi ini akan di-override oleh scriptadmin.js
function setupAdminUtilitasMutation(pageElement) {
    console.log('setupAdminUtilitasMutation called (from script.js)');
    // Placeholder - akan di-override oleh scriptadmin.js
}

// Fungsi ini akan di-override
function loadAdminUtilitasData(kavlingName) {
    console.log('loadAdminUtilitasData called (from script.js):', kavlingName);
    // Placeholder - akan di-override oleh scriptadmin.js
}

// Pastikan fungsi ini ada untuk dipanggil dari scriptadmin.js
function debugKeyDeliveryStructure() {
    console.log('=== DEBUG KEY DELIVERY STRUCTURE ===');
    const user4Page = document.getElementById('user4Page');
    if (!user4Page) {
        console.log('❌ user4Page not found');
        return;
    }

    const deliveryTab = user4Page.querySelector('#tab-delivery');
    if (!deliveryTab) {
        console.log('❌ tab-delivery not found in HTML');
        return;
    }

    console.log('✅ tab-delivery found');
}

// Modifikasi fungsi loadUtilitasDataFromData
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

    // Panggil admin utilitas jika tersedia
    if (currentRole === 'user4' && window.adminUtilitas && window.adminUtilitas.loadData) {
        setTimeout(() => {
            window.adminUtilitas.loadData(selectedKavling);
        }, 300);
    }
}

// ========== FUNGSI SETUP KEY DELIVERY BUTTON ==========
function setupKeyDeliveryButton() {
  const btnSaveKeyDelivery = document.querySelector('#tab-delivery .btn-save-section');
  if (btnSaveKeyDelivery) {
    // Hapus listener lama jika ada
    const newBtn = btnSaveKeyDelivery.cloneNode(true);
    btnSaveKeyDelivery.parentNode.replaceChild(newBtn, btnSaveKeyDelivery);

    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      saveKeyDelivery();
    });
  }
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

// ========== LOGIN & SESSION ==========
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

      // ===== TAMBAHAN: Load data awal setelah login pelaksana =====
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

  // Clear all kavling selections including custom search inputs
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

        // ===== TAMBAHAN: Load data ketika tab diaktifkan =====
        if (tabId === 'delivery' && selectedKavling) {
          setTimeout(() => {
            loadKeyDeliveryData();
          }, 200);
        }
      }
    });
  });
}
// Fungsi untuk load kavling list dengan loading
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

    // ⚡ RESET: Nonaktifkan semua input terlebih dahulu
    disableAllInputs();
   // ⚡ Aktifkan hanya input pencarian
    enableSearchInputs();

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
    } else if (role === 'user1' || role === 'user2' || role === 'user3') {
      setTimeout(() => {
        loadKavlingList();
        setupPelaksanaTabs();

        // Setup awal untuk checkbox di halaman pelaksana
        setTimeout(() => {
          setupCheckboxListeners(role + 'Page');
          setupStateButtons(role + 'Page');
        }, 800);
      }, 500);
    } else if (role === 'user4') {
      setTimeout(() => {
        loadKavlingList();
        setupUser4Tabs();
        setupUser4EventListeners();
      }, 500);
    } else {
      setTimeout(loadKavlingList, 500);
    }
  }
}
// ========== FUNGSI BARU: Aktifkan Input Pencarian Saja ==========
function enableSearchInputs() {
  const pageId = currentRole + 'Page';
  const page = document.getElementById(pageId);
  if (!page) return;

  // Aktifkan semua input pencarian
  const searchInputs = page.querySelectorAll('.search-input-custom, input[id*="searchKavling"]');
  searchInputs.forEach(input => {
    input.disabled = false;
    input.style.opacity = '1';
    input.style.pointerEvents = 'auto';
    input.style.cursor = 'text';
  });

  // Aktifkan dropdown list jika ada
  const dropdownLists = page.querySelectorAll('.custom-dropdown-list');
  dropdownLists.forEach(list => {
    list.style.pointerEvents = 'auto';
  });
}

function setupPelaksanaTabs() {
  const roles = ['user1', 'user2', 'user3'];

  roles.forEach(role => {
    const pageId = role + 'Page';
    const page = document.getElementById(pageId);
    if (!page) return;

    const tabBtns = page.querySelectorAll('.admin-tab-btn');
    const tabContents = page.querySelectorAll('.tab-content-item');

    console.log(`Setting up tabs for ${role}, found ${tabBtns.length} buttons`);

    tabBtns.forEach(btn => {
      // Clone untuk hapus event listener lama
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        console.log(`Tab clicked in ${pageId}: ${tabId}`);

        // Hapus active dari semua tombol dan konten di halaman ini
        const allBtns = page.querySelectorAll('.admin-tab-btn');
        const allContents = page.querySelectorAll('.tab-content-item');

        allBtns.forEach(b => b.classList.remove('active'));
        allContents.forEach(c => c.classList.remove('active'));

        // Tambah active ke yang dipilih
        this.classList.add('active');

        // PERBAIKAN: Cari tab dengan ID eksak sesuai data-tab
        const targetTab = page.querySelector(`#tab-${tabId}`);
        if (targetTab) {
          targetTab.classList.add('active');
          console.log(`✅ Tab ${tabId} activated`);
        } else {
          console.error(`❌ Tab #tab-${tabId} not found in ${pageId}`);
        }
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

   // 15. Setup tombol save key delivery untuk user4
  const saveKeyDeliveryBtn = document.querySelector('#tab-delivery .btn-save-section');
  if (saveKeyDeliveryBtn) {
    const newBtn = saveKeyDeliveryBtn.cloneNode(true);
    saveKeyDeliveryBtn.parentNode.replaceChild(newBtn, saveKeyDeliveryBtn);

    newBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Save key delivery button clicked');
      await saveKeyDelivery();
    });
  }

  console.log('Dynamic event listeners setup complete');
}

// ========== INITIALIZING DATEPICKERS ==========
function initDatePickers() {
  console.log('Initializing Flatpickr...');
  const config = {
    dateFormat: "d/m/Y",
    allowInput: true,
    locale: "id",
    theme: "dark",
    disableMobile: true
  };

  // Initialize all date inputs
  const dateInputs = document.querySelectorAll('.key-delivery-date, .input-mutasi-masuk-tgl, .input-mutasi-keluar-tgl, .input-mutasi-ho-tgl, .utility-date-input');
  dateInputs.forEach(input => {
    const fp = flatpickr(input, config);

    // Find associated "Hari Ini" button
    // The button could be a sibling or inside a parent div
    let parent = input.parentElement;
    if (parent) {
      let todayBtn = parent.querySelector('.btn-today, .btn-today-admin');
      if (!todayBtn && parent.parentElement) {
        todayBtn = parent.parentElement.querySelector('.btn-today, .btn-today-admin');
      }

      if (todayBtn) {
        todayBtn.addEventListener('click', (e) => {
          e.preventDefault();
          fp.setDate(new Date());
        });
      }
    }
  });
}

function initApp() {
  console.log('=== INITIALIZING APP ===');

  // Initialize DatePickers
  initDatePickers();

  console.log('DOM ready state:', document.readyState);

  // 1. Setup dasar yang tidak bergantung pada DOM kompleks
  const submitPasswordBtn = document.getElementById('submitPassword');
  if (submitPasswordBtn) {
    submitPasswordBtn.addEventListener('click', handleLogin);
  }

  const passwordInput = document.getElementById('passwordInput');
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleLogin();
      }
    });
  }

  // 2. Setup role buttons (hanya sekali)
  console.log('Setting up role buttons...');
  setupRoleButtons();

  // 3. Event delegation (global)
  setupGlobalEventDelegation();

  // 4. Setup dynamic listeners
  console.log('Setting up dynamic event listeners...');
  setupDynamicEventListeners();

  // 5. Setup edit kavling
  console.log('Setting up edit kavling...');
  setupEditKavling();

  // 6. Setup delete kavling
  console.log('Setting up delete kavling...');
  setupDeleteKavling();

  // 7. TUNGGU DOM SELESAI LOAD untuk setup yang kompleks
  setTimeout(() => {
    console.log('Delayed setup after DOM ready...');

    // Setup tombol hari ini (setelah semua element ada)
    console.log('Setting up today buttons...');
    setupTodayButtons();

    // Setup date inputs (setelah semua element ada)
    console.log('Setting up date inputs...');
    setupAllDateInputs();

    // Setup key delivery button (khusus user4)
    console.log('Setting up key delivery button...');
    setupKeyDeliveryButton();

   // Setup tombol view mutation history
    setupViewMutationButton();

    // Debug untuk memastikan tombol ditemukan
    const todayBtns = document.querySelectorAll('.btn-today');
    console.log(`Found ${todayBtns.length} "Hari Ini" buttons`);

    todayBtns.forEach((btn, index) => {
      console.log(`Button ${index + 1}:`, {
        text: btn.textContent.trim(),
        parent: btn.parentElement?.className || 'no-parent',
        hasClick: btn.hasAttribute('onclick') || btn.onclick ? 'yes' : 'no'
      });
    });

    // Test satu tombol untuk memastikan bekerja
    if (todayBtns.length > 0) {
      console.log('✅ Ready to test "Hari Ini" button');

      // Simpan referensi untuk testing
      window.debugTodayBtn = todayBtns[0];
    }

  }, 500); // Delay 500ms untuk memastikan DOM siap

  // 8. Cek session login
  const savedRole = sessionStorage.getItem('loggedRole');
  if (savedRole) {
    currentRole = savedRole;
    showPage(savedRole);
  }

  console.log('=== APP INITIALIZED ===');
}

function setupGlobalEventDelegation() {
  console.log('Setting up global event delegation...');

  // Event delegation untuk checkbox
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('sub-task') && e.target.type === 'checkbox') {
      const page = e.target.closest('.page-content');
      if (page) {
        const pageId = page.id;
        updateProgress(pageId);
      }
    }
  });

  // Event delegation untuk tombol state
  document.addEventListener('click', function(e) {
    if (e.target && (e.target.classList.contains('system-btn') || 
                     e.target.classList.contains('tiles-btn') || 
                     e.target.classList.contains('table-btn'))) {
      console.log('State button clicked via global event delegation:', e.target);

      const type = e.target.classList.contains('system-btn') ? 'system' : 
                   e.target.classList.contains('tiles-btn') ? 'tiles' : 'table';

      if (type === 'system') {
        toggleSystemButton(e.target, e.target.getAttribute('data-state'));
      } else if (type === 'tiles') {
        toggleTilesButton(e.target, e.target.getAttribute('data-state'));
      } else if (type === 'table') {
        toggleTableButton(e.target, e.target.getAttribute('data-state'));
      }
    }
  });

  // Event delegation untuk tombol hari ini (fallback)
  document.addEventListener('click', function(e) {
    const target = e.target.closest('.btn-today');
    if (target) {
      console.log('Global event delegation caught btn-today click');
      e.preventDefault();
      e.stopPropagation();

      // Cari input tanggal terdekat
      let dateInput = target.previousElementSibling;

      if (!dateInput || !dateInput.classList.contains('key-delivery-date')) {
        // Cari dengan cara lain
        const container = target.closest('div');
        if (container) {
          dateInput = container.querySelector('.key-delivery-date, input[type="date"], .date-input');
        }
      }

      if (dateInput) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();

        // Set format dd/mm/yyyy
        dateInput.value = `${day}/${month}/${year}`;

        // Feedback
        target.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        target.innerHTML = '<i class="fas fa-check"></i> Terisi!';

        setTimeout(() => {
          target.style.background = 'linear-gradient(135deg, #38bdf8, #0ea5e9)';
          target.innerHTML = '<i class="fas fa-calendar-check"></i> Hari Ini';
        }, 800);

        console.log(`Set today's date: ${dateInput.value}`);
      }
    }
  });
}

// ========== FUNGSI VIEW MUTATION HISTORY ==========
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

function displayMutationHistory(mutasiData) {
  const container = document.getElementById('mutasiHistoryContainer');
  if (!container) return;

  let html = `
    <div class="mutasi-history-list">
      <h5>Total ${mutasiData.length} Riwayat Mutasi</h5>
  `;

  mutasiData.forEach((mutasi, index) => {
    html += `
      <div class="mutasi-history-item">
        <div class="mutasi-no">${index + 1}</div>
        <div class="mutasi-info">
          <div class="mutasi-tanggal">
            <i class="far fa-calendar"></i> ${mutasi.tanggal || '-'}
          </div>
          <div class="mutasi-transfer">
            <span class="mutasi-dari">${mutasi.dari || '-'}</span>
            <i class="fas fa-arrow-right"></i>
            <span class="mutasi-ke">${mutasi.ke || '-'}</span>
          </div>
          <div class="mutasi-kolom">
            <small>Kolom: ${mutasi.kolomExcel || 'N/A'}</small>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
  container.style.display = 'block';
}

// Setup tombol View Mutation History
function setupViewMutationButton() {
  const btnViewMutation = document.getElementById('btnViewMutationHistory');
  if (btnViewMutation) {
    btnViewMutation.addEventListener('click', function(e) {
      e.preventDefault();
      const container = document.getElementById('mutasiHistoryContainer');
      if (!container) return;

      if (container.style.display === 'none' || container.style.display === '') {
        if (typeof loadMutationHistory === 'function') {
          loadMutationHistory();
        } else if (typeof loadAdminUtilitasData === 'function') {
          const kavling = selectedKavling || (document.querySelector('#kavlingInfoUser4 .val-name')?.textContent !== '-' ? document.querySelector('#kavlingInfoUser4 .val-name')?.textContent : null);
          if (kavling) {
             loadAdminUtilitasData(kavling);
             container.style.display = 'block';
          } else {
             showToast('warning', 'Pilih kavling terlebih dahulu!');
          }
        }
      } else {
        container.style.display = 'none';
      }
    });
  }
}

// ========== FUNGSI LOAD UTILITAS DATA ==========
async function loadUtilitasData() {
  if (!selectedKavling) return;

  try {
    showGlobalLoading('Memuat data utilitas...');

    const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getUtilitasData',
      kavling: selectedKavling
    });

    if (result.success) {
      // Update input fields
      const listrikDateInput = document.getElementById('listrikInstallDate');
      const airDateInput = document.getElementById('airInstallDate');
      const propertyNotesInput = document.getElementById('utilityPropertyNotes');

      if (listrikDateInput) listrikDateInput.value = result.listrikDate || '';
      if (airDateInput) airDateInput.value = result.airDate || '';
      if (propertyNotesInput) propertyNotesInput.value = result.propertyNotes || '';

      // Update total progress jika ada
      if (result.totalProgress) {
        updateUtilitasProgressDisplay(result.totalProgress);
      }
    } else {
      showToast('warning', 'Belum ada data utilitas untuk kavling ini');
    }
  } catch (error) {
    console.error('Error loading utilitas data:', error);
    showToast('error', 'Gagal memuat data utilitas');
  } finally {
    hideGlobalLoading();
  }
}

function debugInputStatus() {
  if (!currentRole) return;

  const pageId = currentRole + 'Page';
  const page = document.getElementById(pageId);
  if (!page) return;

  console.log(`🔍 DEBUG INPUT STATUS untuk ${pageId}:`);

  // Checkboxes
  const checkboxes = page.querySelectorAll('input[type="checkbox"]');
  console.log(`Total checkbox: ${checkboxes.length}`);
  checkboxes.forEach((cb, index) => {
    console.log(`Checkbox ${index + 1}:`, {
      id: cb.id || 'no-id',
      checked: cb.checked,
      disabled: cb.disabled,
      style: {
        opacity: cb.style.opacity,
        cursor: cb.style.cursor,
        pointerEvents: cb.style.pointerEvents
      }
    });
  });

  // State buttons
  const stateButtons = page.querySelectorAll('.state-btn, .system-btn, .tiles-btn, .table-btn');
  console.log(`Total state buttons: ${stateButtons.length}`);

  // Save buttons
  const saveButtons = page.querySelectorAll('.btn-save-section');
  console.log(`Total save buttons: ${saveButtons.length}`);
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

function fixFontStyles() {
    console.log('Applying font style fixes...');
}

// ========== START APPLICATION ==========
if (document.readyState === 'loading') {
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

function toggleSystemButton(button, systemType) {
  console.log('toggleSystemButton called:', systemType);

  const taskItem = button.closest('.task-item') || button.closest('.task-item-standalone');
  if (!taskItem) return;

  const buttons = taskItem.querySelectorAll('.system-btn');

  // PERBAIKAN: Cari hidden input berdasarkan role
  let hiddenInput = null;
  if (currentRole === 'user1') {
    hiddenInput = taskItem.querySelector('#wasteSystemInputUser1');
  } else if (currentRole === 'user2') {
    hiddenInput = taskItem.querySelector('#wasteSystemInputUser2');
  } else if (currentRole === 'user3') {
    hiddenInput = taskItem.querySelector('#wasteSystemInputUser3');
  }

  // PERBAIKAN: Cek apakah tombol sudah aktif
  const isAlreadyActive = button.classList.contains('active');

  console.log(`Tombol ${systemType} sebelumnya aktif: ${isAlreadyActive}`);
  console.log(`Nilai hidden input: ${hiddenInput ? hiddenInput.id : 'tidak ditemukan'}`);

  // Reset semua tombol
  buttons.forEach(btn => {
    btn.classList.remove('active');
    btn.removeAttribute('style');
    btn.setAttribute('data-active', 'false');
  });

  // Jika tombol sudah aktif, reset ke kosong
  if (isAlreadyActive) {
    console.log('Mereset sistem pembuangan ke kosong');
    if (hiddenInput) {
      hiddenInput.value = '';
    }
  } else {
    // Aktifkan tombol yang diklik
    button.classList.add('active');
    button.setAttribute('data-active', 'true');

    // Set nilai sesuai systemType
    let displayValue = '';
    switch(systemType) {
      case 'septictank': displayValue = 'Septictank'; break;
      case 'biotank': displayValue = 'Biotank'; break;
      case 'ipal': displayValue = 'Ipal'; break;
      default: displayValue = systemType;
    }

    if (hiddenInput) {
      hiddenInput.value = displayValue;
      console.log(`Sistem Pembuangan diatur ke: "${displayValue}"`);
    }
  }

  // Update progress
  const rolePage = currentRole + 'Page';
  updateProgress(rolePage);
}
function toggleTilesButton(button, option) {
  console.log('toggleTilesButton called:', option);

  const taskItem = button.closest('.task-item') || button.closest('.task-item-standalone');
  if (!taskItem) return;

  const buttons = taskItem.querySelectorAll('.tiles-btn');
  const hiddenInput = taskItem.querySelector('#bathroomTilesInput');

  const isAlreadyActive = button.classList.contains('active');

  console.log(`Tombol Keramik Dinding "${option}" sebelumnya aktif: ${isAlreadyActive}`);
  console.log(`Nilai hidden input sebelum: "${hiddenInput ? hiddenInput.value : 'tidak ditemukan'}"`);

  // Reset semua tombol
  buttons.forEach(btn => {
    btn.classList.remove('active');
    btn.removeAttribute('style'); // Hapus inline styles agar menggunakan CSS
    btn.setAttribute('data-active', 'false');
  });

   if (isAlreadyActive) {
        console.log('Mereset Keramik Dinding ke kosong');
        if (hiddenInput) {
            hiddenInput.value = '';
        }
    } else {
        // Aktifkan tombol yang diklik
        button.classList.add('active');
        button.setAttribute('data-active', 'true');

        if (hiddenInput) {
            hiddenInput.value = option === 'include' ? 'Dengan Keramik Dinding' : 'Tanpa Keramik Dinding';
            console.log(`Keramik Dinding diatur ke: "${hiddenInput.value}"`);
        }
    }

    const rolePage = currentRole + 'Page';
    updateProgress(rolePage);
}
//----------------------

function toggleTableButton(button, option) {
  const taskItem = button.closest('.task-item') || button.closest('.task-item-standalone');
  if (!taskItem) return;

  const buttons = taskItem.querySelectorAll('.table-btn');
  const idSuffix = (currentRole === 'user1' || currentRole === 'user2' || currentRole === 'user3' || currentRole === 'user4' || currentRole === 'user5') ? `User${currentRole.slice(-1)}` : '';
  const hiddenInput = taskItem.querySelector(`#tableKitchenInput${idSuffix}`) || taskItem.querySelector('#tableKitchenInput');

  const wasActive = button.classList.contains('active');
// Cek apakah tombol sudah aktif
    const isAlreadyActive = button.classList.contains('active');

    console.log(`Tombol Cor Meja Dapur "${option}" sebelumnya aktif: ${isAlreadyActive}`);
    console.log(`Nilai hidden input sebelum: "${hiddenInput ? hiddenInput.value : 'tidak ditemukan'}"`);

    // Reset semua tombol
    buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.removeAttribute('style');
        btn.setAttribute('data-active', 'false');
    });

    // Jika tombol sudah aktif, reset ke kosong
    if (isAlreadyActive) {
        console.log('Mereset Cor Meja Dapur ke kosong');
        if (hiddenInput) {
            hiddenInput.value = '';
        }
    } else {
        // Aktifkan tombol yang diklik
        button.classList.add('active');
        button.setAttribute('data-active', 'true');

        if (hiddenInput) {
            hiddenInput.value = option === 'include' ? 'Dengan Cor Meja Dapur' : 'Tanpa Cor Meja Dapur';
            console.log(`Cor Meja Dapur diatur ke: "${hiddenInput.value}"`);
        }
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

function setupTodayButtons() {
  console.log('🔧 Setting up "Hari Ini" buttons...');

  const todayBtns = document.querySelectorAll('.btn-today');
  console.log(`Found ${todayBtns.length} buttons`);

  todayBtns.forEach((btn, index) => {
    console.log(`Button ${index + 1}:`, {
      text: btn.innerHTML,
      parentHTML: btn.parentElement?.outerHTML.substring(0, 100) + '...'
    });

    // Hapus event listener lama
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    // Tambah event listener baru dengan lebih robust
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      console.log(`✅ Tombol "Hari Ini" #${index + 1} diklik`);

      // Cari input tanggal dengan berbagai cara
      let dateInput = null;

      // Cara 1: Previous sibling
      if (this.previousElementSibling) {
        const prev = this.previousElementSibling;
        if (prev.matches('.key-delivery-date, input[type="date"], input[type="text"].date-input')) {
          dateInput = prev;
          console.log('Found input as previous sibling');
        }
      }

      // Cara 2: Cari di parent container
      if (!dateInput) {
        const parent = this.closest('div');
        if (parent) {
          const inputs = parent.querySelectorAll('.key-delivery-date, input[type="date"], .date-input');
          if (inputs.length > 0) {
            dateInput = inputs[0];
            console.log('Found input in parent container');
          }
        }
      }

      // Cara 3: Cari berdasarkan class
      if (!dateInput) {
        const inputs = document.querySelectorAll('.key-delivery-date, input[type="date"], .date-input');
        if (inputs.length > 0) {
          dateInput = inputs[0];
          console.log('Found first available date input');
        }
      }

      if (dateInput) {
        // Format hari ini
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();

        // Set nilai (dd/mm/yyyy untuk text input, yyyy-MM-dd untuk date input)
        if (dateInput.type === 'date') {
          dateInput.value = `${year}-${month}-${day}`;
        } else {
          dateInput.value = `${day}/${month}/${year}`;
        }

        console.log(`📅 Set tanggal: ${dateInput.value}`);

        // Feedback visual
        const originalHTML = this.innerHTML;
        const originalBG = this.style.background;

        this.innerHTML = '<i class="fas fa-check-circle"></i> Terisi!';
        this.style.background = 'linear-gradient(135deg, #10b981, #059669)';

        setTimeout(() => {
          this.innerHTML = originalHTML;
          this.style.background = originalBG;
        }, 1500);

        // Trigger events
        dateInput.dispatchEvent(new Event('input', { bubbles: true }));
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));

      } else {
        console.warn('❌ Tidak menemukan input tanggal untuk tombol ini');
        console.log('Button context:', {
          parent: this.parentElement,
          siblings: Array.from(this.parentElement.children).map(c => c.tagName + (c.className ? '.' + c.className : ''))
        });

        // Feedback error
        const originalHTML = this.innerHTML;
        this.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error!';
        this.style.background = 'linear-gradient(135deg, #f43f5e, #dc2626)';

        setTimeout(() => {
          this.innerHTML = originalHTML;
          this.style.background = 'linear-gradient(135deg, #38bdf8, #0ea5e9)';
        }, 2000);
      }
    });

    // Tambah juga mouse event untuk debugging
    newBtn.addEventListener('mouseover', function() {
      console.log(`Mouse over button ${index + 1}`);
    });
  });

  console.log('✅ Setup "Hari Ini" buttons completed');
}

// Fungsi untuk mengisi tanggal hari ini ke input
function fillTodayDate(inputElement) {
  if (!inputElement) return;

  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();

  // Format dd/mm/yyyy
  const formattedDate = `${day}/${month}/${year}`;

  // Set value
  inputElement.value = formattedDate;

  // Jika input type="date", perlu format yyyy-MM-dd
  if (inputElement.type === 'date') {
    inputElement.value = `${year}-${month}-${day}`;
  }

  // Trigger event
  const event = new Event('input', { bubbles: true });
  inputElement.dispatchEvent(event);

  return formattedDate;
}

// Fungsi untuk setup semua input tanggal
function setupAllDateInputs() {
  console.log('📅 Setting up all date inputs...');

  // Ubah placeholder untuk input type="date"
  document.querySelectorAll('input[type="date"]').forEach(input => {
    input.setAttribute('placeholder', 'dd/mm/yyyy');

    // Format ulang nilai yang ada
    if (input.value) {
      const currentValue = input.value;
      // Jika format yyyy-MM-dd, konversi ke dd/mm/yyyy
      if (/^\d{4}-\d{2}-\d{2}$/.test(currentValue)) {
        const [year, month, day] = currentValue.split('-');
        input.value = `${day}/${month}/${year}`;
      }
    }
  });

  // Event listener untuk validasi format
  document.addEventListener('input', function(e) {
    const input = e.target;

    if (input.classList.contains('key-delivery-date') || 
        input.type === 'date' ||
        input.classList.contains('date-input')) {

      let value = input.value;

      // Auto-format dd/mm/yyyy
      value = value.replace(/\D/g, ''); // Hapus non-digit

      if (value.length > 8) value = value.substring(0, 8);

      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
      }
      if (value.length >= 5) {
        value = value.substring(0, 5) + '/' + value.substring(5, 9);
      }

      input.value = value;

      // Validasi
      if (value.length === 10) {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          input.style.borderColor = '#10b981';
        } else {
          input.style.borderColor = '#f43f5e';
        }
      } else {
        input.style.borderColor = '#334155';
      }
    }
  });
}

function debugAllStateButtons() {
    console.log('=== DEBUG SEMUA STATE BUTTONS ===');

    const pageId = currentRole + 'Page';
    const page = document.getElementById(pageId);
    if (!page) {
        console.log('Halaman tidak ditemukan:', pageId);
        return;
    }

    // Sistem Pembuangan
    const idSuffix = (currentRole === 'user1' || currentRole === 'user2' || currentRole === 'user3' || currentRole === 'user4' || currentRole === 'user5') ? `User${currentRole.slice(-1)}` : '';
    const wasteSystem = page.querySelector(`#wasteSystemInput${idSuffix}`) || page.querySelector('#wasteSystemInput');
    const wasteButtons = page.querySelectorAll('.system-btn');
    console.log('1. SISTEM PEMBUANGAN:', {
        inputValue: wasteSystem ? `"${wasteSystem.value}"` : 'tidak ditemukan',
        aktif: wasteSystem && wasteSystem.value !== '' ? 'Ya' : 'Tidak',
        tombolAktif: Array.from(wasteButtons).filter(btn => btn.classList.contains('active')).map(btn => btn.textContent.trim())
    });

    // Cor Meja Dapur
    const tableKitchen = page.querySelector(`#tableKitchenInput${idSuffix}`) || page.querySelector('#tableKitchenInput');
    const tableButtons = page.querySelectorAll('.table-btn');
    console.log('2. COR MEJA DAPUR:', {
        inputValue: tableKitchen ? `"${tableKitchen.value}"` : 'tidak ditemukan',
        aktif: tableKitchen && tableKitchen.value !== '' ? 'Ya' : 'Tidak',
        tombolAktif: Array.from(tableButtons).filter(btn => btn.classList.contains('active')).map(btn => btn.textContent.trim())
    });

    // Keramik Dinding
    const bathroomTiles = page.querySelector(`#bathroomTilesInput${idSuffix}`) || page.querySelector('#bathroomTilesInput');
    const tilesButtons = page.querySelectorAll('.tiles-btn');
    console.log('3. KERAMIK DINDING:', {
        inputValue: bathroomTiles ? `"${bathroomTiles.value}"` : 'tidak ditemukan',
        aktif: bathroomTiles && bathroomTiles.value !== '' ? 'Ya' : 'Tidak',
        tombolAktif: Array.from(tilesButtons).filter(btn => btn.classList.contains('active')).map(btn => btn.textContent.trim())
    });

    console.log('=== SELESAI DEBUG ===');
}

// Panggil setelah memuat data kavling
setTimeout(debugAllStateButtons, 1000);

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
  const taskItem = button.closest('.task-item') || button.closest('.task-item-standalone');
  const buttons = taskItem.querySelectorAll('.system-btn');
  const idSuffix = (currentRole === 'user1' || currentRole === 'user2' || currentRole === 'user3' || currentRole === 'user4' || currentRole === 'user5') ? `User${currentRole.slice(-1)}` : '';
  const hiddenInput = taskItem.querySelector(`#wasteSystemInput${idSuffix}`) || taskItem.querySelector('#wasteSystemInput');

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
  const taskItem = button.closest('.task-item') || button.closest('.task-item-standalone');
  const buttons = taskItem.querySelectorAll('.tiles-btn');
  const idSuffix = (currentRole === 'user1' || currentRole === 'user2' || currentRole === 'user3' || currentRole === 'user4' || currentRole === 'user5') ? `User${currentRole.slice(-1)}` : '';
  const hiddenInput = taskItem.querySelector(`#bathroomTilesInput${idSuffix}`) || taskItem.querySelector('#bathroomTilesInput');

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
  const taskItem = button.closest('.task-item') || button.closest('.task-item-standalone');
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
// ========== FUNGSI SAVE KEY DELIVERY ==========
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

// Ganti semua versi updateProgress dengan ini:
function updateProgress(rolePage) {
  const pageElement = document.getElementById(rolePage);
  if (!pageElement) return;

  const progressSections = pageElement.querySelectorAll('.progress-section[data-tahap]');

  // Progress values for specific components
  let tahap1_3_Progress = 0; // Max 94
  let completionProgress = 0; // Max 5
  let deliveryDateProgress = 0; // Max 1

  // Tahap 1-3 tasks count
  let t13_total = 0;
  let t13_completed = 0;

  progressSections.forEach(section => {
    const tahap = section.getAttribute('data-tahap');
    const tasks = section.querySelectorAll('.sub-task, [data-task]');
    let sectionCompleted = 0;
    let sectionTotal = 0;

    tasks.forEach(task => {
      // Abaikan isian Kondisi Property / Keterangan Tambahan
      if (task.classList.contains('tahap-comments') || task.id === 'utilityPropertyNotes' || task.id === 'propertyNotesManager') {
        return;
      }

      sectionTotal++;

      let isCompleted = false;
      if (task.type === 'checkbox') {
        if (task.checked) isCompleted = true;
      } else if (task.type === 'hidden' || task.type === 'text') {
        if (task.value && task.value.trim() !== '') isCompleted = true;
      }

      if (isCompleted) {
        sectionCompleted++;
        if (tahap === '1' || tahap === '2' || tahap === '3') t13_completed++;
      }

      if (tahap === '1' || tahap === '2' || tahap === '3') t13_total++;
    });

    // Specific Tahap 4 components
    let sectionPercent = 0;
    if (tahap === '4') {
      const completionTask = section.querySelector('[data-task^="COMPLETION"]');
      const deliveryDateTask = section.querySelector('.key-delivery-date');

      if (completionTask && completionTask.checked) {
        completionProgress = 5;
      }
      if (deliveryDateTask && deliveryDateTask.value.trim() !== '') {
        deliveryDateProgress = 1;
      }

      let t4_p1 = (deliveryDateTask && (deliveryDateTask.value || '').trim() !== '') ? 50 : 0;
      let t4_p2 = (completionTask && completionTask.checked) ? 50 : 0;
      sectionPercent = t4_p1 + t4_p2;
    } else {
      sectionPercent = sectionTotal > 0 ? (sectionCompleted / sectionTotal) * 100 : 0;
    }

    const subPercentEl = section.querySelector('.sub-percent');
    if (subPercentEl) subPercentEl.textContent = Math.round(sectionPercent) + '%';

    const progressFill = section.querySelector('.progress-fill');
    if (progressFill) progressFill.style.width = sectionPercent + '%';
  });

  if (t13_total > 0) {
    tahap1_3_Progress = (t13_completed / t13_total) * 94;
  }

  const totalProgress = Math.round(tahap1_3_Progress + completionProgress + deliveryDateProgress);
  updateTotalProgressDisplay(totalProgress + '%', rolePage);

  return totalProgress;
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
    
    // Add color logic for manager progress bar and others
    const percentValue = parseInt(progress) || 0;
    totalBarEl.className = totalBarEl.className.replace(/\bbar-(high|medium|low|very-low)\b/g, '').trim(); // Reset classes
    if (percentValue >= 89) totalBarEl.classList.add('bar-high');
    else if (percentValue >= 60) totalBarEl.classList.add('bar-medium');
    else if (percentValue >= 10) totalBarEl.classList.add('bar-low');
    else totalBarEl.classList.add('bar-very-low');
  }
}



// Photo Upload variables for Revision
let selectedRevisionFile = null;
let compressedRevisionBase64 = null;

function handleRevisionPhotoSelect(input) {
  if (input.files && input.files[0]) {
    selectedRevisionFile = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max dimensions
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress and get base64
        compressedRevisionBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
        
        document.getElementById('imgPreviewRevision').src = compressedRevisionBase64;
        document.getElementById('revisionPhotoPreview').style.display = 'block';
        document.getElementById('btnCancelRevision').style.display = 'flex';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(selectedRevisionFile);
  }
}

function cancelRevisionPhoto() {
  selectedRevisionFile = null;
  compressedRevisionBase64 = null;
  document.getElementById('revisionPhotoInput').value = '';
  document.getElementById('revisionPhotoPreview').style.display = 'none';
  document.getElementById('btnCancelRevision').style.display = 'none';
  document.getElementById('imgPreviewRevision').src = '';
  showToast('info', 'Pilihan foto dibatalkan');
}

async function loadRevisionPhotosForPelaksana(kavling, role) {
  const galleryId = `revisionPhotoGallery${role.charAt(0).toUpperCase() + role.slice(1)}`;
  const gallery = document.getElementById(galleryId);
  if (!gallery) return;
  
  // Ambil ID pencarian (5 karakter pertama)
  const searchId = kavling.substring(0, 5).toUpperCase();
  console.log(`Loading revision photos for pelaksana. Search ID: ${searchId}`);
  
  gallery.innerHTML = '<div style="grid-column: span 2; text-align: center; color: #94a3b8; padding: 20px;">Memuat foto dari Google Drive...</div>';
  
  try {
    const response = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getRevisionPhotosBySearchId',
      searchId: searchId,
      kavling: kavling
    });
    
    gallery.innerHTML = '';
    
    if (response.success && response.photos && response.photos.length > 0) {
      response.photos.forEach(photo => {
        const item = document.createElement('div');
        item.style.cssText = 'border-radius: 12px; overflow: hidden; border: 2px solid #334155; position: relative; aspect-ratio: 1; background: #0f172a;';
        item.innerHTML = `
          <img src="${photo.url}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" onclick="window.open('${photo.url}', '_blank')">
          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; font-size: 0.75rem; padding: 5px; text-align: center;">
            ${photo.name}
          </div>
        `;
        gallery.appendChild(item);
      });
    } else {
      gallery.innerHTML = `
        <div style="grid-column: span 2; text-align: center; color: #94a3b8; padding: 20px; border: 2px dashed #334155; border-radius: 12px;">
          <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
          Tidak ada foto revisi yang cocok dengan ID "${searchId}"
        </div>`;
    }
  } catch (error) {
    console.error('Error loading photos for pelaksana:', error);
    gallery.innerHTML = '<div style="grid-column: span 2; text-align: center; color: #f43f5e; padding: 20px;">Gagal memuat foto dari Google Drive</div>';
  }
}

async function savePropertyDataManager() {
  if (!selectedKavling) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }

  const notesEl = document.getElementById('propertyNotesManager');
  const notes = notesEl ? notesEl.value.trim() : '';
  
  showGlobalLoading('Menyimpan data...');

  try {
    // 1. Simpan Catatan
    const notesResponse = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'savePropertyNotes',
      kavling: selectedKavling,
      notes: notes
    });

    if (!notesResponse.success) {
      hideGlobalLoading();
      showToast('error', 'Gagal menyimpan catatan: ' + notesResponse.message);
      return;
    }

    // Update local data
    if (currentKavlingData && currentKavlingData.kavling === selectedKavling) {
      currentKavlingData.propertyNotes = notes;
    }

    // 2. Simpan Foto jika ada
    if (compressedRevisionBase64) {
      const base64Data = compressedRevisionBase64.split(',')[1];
      const photoResponse = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
        action: 'uploadRevisionPhoto',
        kavling: selectedKavling,
        image: base64Data,
        filename: `revision_${selectedKavling}_${Date.now()}.jpg`
      });

      if (photoResponse.success) {
        // Reset photo controls
        document.getElementById('revisionPhotoPreview').style.display = 'none';
        document.getElementById('revisionPhotoInput').value = '';
        selectedRevisionFile = null;
        compressedRevisionBase64 = null;
        loadRevisionPhotos(selectedKavling);
      } else {
        showToast('warning', 'Catatan tersimpan, tapi gagal mengunggah foto');
      }
    }

    showStatusModal('success', 'Berhasil', 'Data dan foto berhasil diperbarui');
    setTimeout(() => {
      hideGlobalLoading();
      showToast('success', 'Data berhasil diperbarui');
    }, 1500);

  } catch (error) {
    console.error('Error saving data:', error);
    hideGlobalLoading();
    showToast('error', 'Terjadi kesalahan: ' + error.message);
  }
}

async function uploadRevisionPhoto() {
  // Deprecated in favor of savePropertyDataManager
  savePropertyDataManager();
}

async function loadRevisionPhotos(kavling) {
  const gallery = document.getElementById('revisionPhotoGallery');
  if (!gallery) return;
  
  // Clear gallery
  gallery.innerHTML = '<div style="grid-column: span 2; text-align: center; color: #94a3b8; padding: 10px;">Memuat foto...</div>';
  
  try {
    const response = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getRevisionPhotos',
      kavling: kavling
    });
    
    gallery.innerHTML = '';
    
    if (response.success && response.photos && response.photos.length > 0) {
      response.photos.forEach(photoUrl => {
        const item = document.createElement('div');
        item.style.cssText = 'border-radius: 8px; overflow: hidden; border: 1px solid #334155; position: relative; aspect-ratio: 1;';
        item.innerHTML = `
          <img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" onclick="window.open('${photoUrl}', '_blank')">
        `;
        gallery.appendChild(item);
      });
    } else {
      gallery.innerHTML = '<div style="grid-column: span 2; text-align: center; color: #94a3b8; padding: 10px;">Belum ada foto revisi</div>';
    }
  } catch (error) {
    console.error('Error loading photos:', error);
    gallery.innerHTML = '<div style="grid-column: span 2; text-align: center; color: #f43f5e; padding: 10px;">Gagal memuat foto</div>';
  }
}

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
// ========== INTEGRATION WITH ADMIN UTILITAS ==========
let adminUtilitasModule = null;
let isAdminUtilitasLoaded = false;

// Fungsi untuk memuat script admin utilitas
function loadAdminUtilitasScript() {
    return new Promise((resolve, reject) => {
        if (isAdminUtilitasLoaded && window.adminUtilitas) {
            resolve(window.adminUtilitas);
            return;
        }

        const script = document.createElement('script');
        script.id = 'admin-utilitas-script';
        script.src = 'scriptadmin.js';

        script.onload = function() {
            console.log('Admin Utilitas script loaded successfully');
            isAdminUtilitasLoaded = true;
            adminUtilitasModule = window.adminUtilitas;

            // Inisialisasi jika di halaman user4
            if (currentRole === 'user4' && adminUtilitasModule && adminUtilitasModule.init) {
                adminUtilitasModule.init();
            }
            resolve(window.adminUtilitas);
        };

        script.onerror = function(error) {
            console.error('Failed to load Admin Utilitas script:', error);
            reject(error);
        };

        document.head.appendChild(script);
    });
}

// Modifikasi fungsi showPage untuk load script admin
const originalShowPage = showPage;
showPage = function(role) {
    originalShowPage(role);

    // Load admin utilitas script jika role user4
    if (role === 'user4') {
        setTimeout(loadAdminUtilitasScript, 300);
    }
};

// Juga load jika sudah di halaman user4 saat refresh
if (window.currentRole === 'user4') {
    setTimeout(loadAdminUtilitasScript, 1000);
}
// Panggil setelah DOM siap
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(debugTahap4Structure, 1000);
});
