// versi 0.66 - Main Script
// File ini bergantung pada database-connection.js
// Pastikan database-connection.js di-load terlebih dahulu di HTML

// versi 0.66

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

// ========== IMAGE PROCESSING ==========
const MAX_REVISI_PHOTOS = 6;
let selectedRevisiPhotos = [];

function setupRevisiPhotoUpload() {
  const photoInput = document.getElementById('revisiPhotoInputUser1');
  const previewContainer = document.getElementById('revisiImagePreview1User1');

  if (!photoInput || !previewContainer) return;

  // Hapus event listener lama dengan clone
  const newPhotoInput = photoInput.cloneNode(true);
  photoInput.parentNode.replaceChild(newPhotoInput, photoInput);

  newPhotoInput.addEventListener('change', async function(e) {
    const files = Array.from(e.target.files);
    
    if (selectedRevisiPhotos.length + files.length > MAX_REVISI_PHOTOS) {
      showToast('warning', `Maksimal ${MAX_REVISI_PHOTOS} foto.`);
      return;
    }

    showGlobalLoading('Memproses foto...');

    try {
      // Tunggu semua file diproses
      const promises = files.map(file => {
        if (!file.type.startsWith('image/')) return null;
        return compressImage(file, 0.7);
      }).filter(p => p !== null);

      const results = await Promise.all(promises);
      results.forEach(base64 => {
        if (base64) selectedRevisiPhotos.push(base64);
      });

      renderRevisiPreviews();
    } catch (err) {
      console.error('Processing error:', err);
      showToast('error', 'Gagal memproses foto');
    } finally {
      hideGlobalLoading();
      // Reset input
      newPhotoInput.value = '';
    }
  });
}

function compressImage(file, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Optional: Resize if too large
        const MAX_WIDTH = 1200;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

function renderRevisiPreviews() {
  const previewContainer = document.getElementById('revisiImagePreview1User1');
  if (!previewContainer) return;

  if (selectedRevisiPhotos.length === 0) {
    previewContainer.innerHTML = `
      <div style="text-align: center;">
        <i class="fas fa-images" style="font-size: 2rem; display: block; margin-bottom: 10px; opacity: 0.5;"></i>
        <span>Belum ada foto yang dipilih</span>
      </div>
    `;
    return;
  }

  previewContainer.innerHTML = '';
  selectedRevisiPhotos.forEach((base64, index) => {
    const thumb = document.createElement('div');
    thumb.className = 'photo-thumb-wrapper';
    thumb.style.position = 'relative';
    thumb.style.width = '80px';
    thumb.style.height = '80px';
    thumb.style.borderRadius = '8px';
    thumb.style.overflow = 'hidden';
    thumb.style.border = '2px solid #334155';
    thumb.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';

    thumb.innerHTML = `
      <img src="${base64}" style="width: 100%; height: 100%; object-fit: cover;" />
      <button type="button" onclick="removeRevisiPhoto(${index})" style="position: absolute; top: 4px; right: 4px; background: #ef4444; color: white; border: none; width: 20px; height: 20px; border-radius: 50%; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">&times;</button>
    `;
    previewContainer.appendChild(thumb);
  });
}

function removeRevisiPhoto(index) {
  selectedRevisiPhotos.splice(index, 1);
  renderRevisiPreviews();
}


// Tambahkan inisialisasi di DOMContentLoaded atau fungsi init app
// search for APP INITIALIZED log to find where to add

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

function setupProgressButtons(page) {
  const progressBtns = page.querySelectorAll('.progress-btn');
  progressBtns.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const parent = this.closest('.progress-choice');
      if (!parent) return;

      const input = parent.querySelector('input[type="hidden"].sub-task');
      if (!input) return;

      // Reset active
      const siblings = parent.querySelectorAll('.progress-btn');
      siblings.forEach(s => s.classList.remove('active'));

      // Toggle value
      const value = this.getAttribute('data-value');
      if (input.value === value) {
        input.value = '';
      } else {
        input.value = value;
        this.classList.add('active');
      }

      console.log(`Progress button clicked: ${this.getAttribute('data-task')} = ${input.value}`);

      // Update UI sekali saja
      const tahapSection = this.closest('.progress-section');
      if (tahapSection) {
        const tahap = tahapSection.getAttribute('data-tahap');
        updateTahapProgressUI(tahapSection, tahap);
      }
    });
  });
}

function loadPropertyNotesFromData(data) {
    const notesEl = document.getElementById('propertyNotesManager');
    if (notesEl && data) {
        notesEl.value = data.propertyNotes || '';
    }
    
    // TAMBAHKAN: Load handover data untuk Supervisor
    if (selectedKavling && currentRole === 'manager') {
        console.log('🔄 Loading handover data for Supervisor...');
        setTimeout(() => {
            loadSupervisorHandoverData(selectedKavling);
        }, 300);
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

  // 6. Reset Supervisor HO Section
  if (typeof resetSupervisorHOSection === 'function') {
    resetSupervisorHOSection();
  }
  
  // 7. Reset Supervisor Mutation History Container
  const mutasiContainerSupervisor = document.getElementById('mutasiHistoryContainerSupervisor');
  if (mutasiContainerSupervisor) {
    mutasiContainerSupervisor.innerHTML = '';
    mutasiContainerSupervisor.style.display = 'none';
  }
  
  // 8. Reset Supervisor Mutation Visibility Flag
  window.supervisorMutationVisible = false;
  window.isLoadingSupervisorMutation = false;
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
          
          // Fix: Ensure notes are updated for manager (progress handled by updateSupervisorStagesUI)
          if (currentRole === 'manager') {
            loadPropertyNotesFromData(currentKavlingData);
            loadRevisionPhotos(selectedKavling);
            // Update supervisor stages UI with calculated progress
            const totalPercent = parseInt(currentKavlingData.totalAH) || 0;
            updateSupervisorStagesUI(totalPercent, data.data);
            setTimeout(() => {
                loadSupervisorHandoverData(selectedKavling);
                initSupervisorMutationButton(); // Ensure button is ready when data is loaded
            }, 500);
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

        // Update Supervisor Stages UI dengan progress data dari kavling
        const totalPercent = parseInt(currentKavlingData.totalAH) || 0;
        updateSupervisorStagesUI(totalPercent, data.data);

        // Load dan tampilkan data Hand Over Kunci ke User
        loadSupervisorHandoverData(kavlingName);

        // Auto load Riwayat Mutasi Kunci 3 detik setelah kavling dipilih
        setTimeout(async () => {
          if (selectedKavling === kavlingName) {
            console.log('⏰ Auto loading mutation history for:', kavlingName);
            // Non-blocking auto load attempt
            loadMutationHistoryForSupervisor(kavlingName).catch(err => console.error('Auto-load failed:', err));
          }
        }, 3000);

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

  // 4. Revisi Buttons (50%, 90%, 100%)
  const revisiBtns = page.querySelectorAll('.revisi-btn');
  revisiBtns.forEach(btn => {
    btn.onclick = function(e) {
      e.preventDefault();
      toggleRevisiButton(this);
    };
  });
}

// Toggle Revisi Button - similar to system button but for revisi inputs
function toggleRevisiButton(btn) {
  const revisiNum = btn.getAttribute('data-revisi');
  const stateValue = btn.getAttribute('data-state');
  const container = btn.closest('.revisi-item');
  
  if (!container) return;
  
  // Find all buttons in the same revisi group
  const allBtns = container.querySelectorAll('.revisi-btn');
  
  // Check if this button is already active
  const isActive = btn.getAttribute('data-active') === 'true';
  
  if (isActive) {
    // Deactivate this button
    btn.setAttribute('data-active', 'false');
    btn.classList.remove('active');
    
    // Clear the hidden input value
    const hiddenInput = container.querySelector('input[type="hidden"]');
    if (hiddenInput) {
      hiddenInput.value = '';
    }
  } else {
    // Deactivate all buttons in this group first
    allBtns.forEach(b => {
      b.setAttribute('data-active', 'false');
      b.classList.remove('active');
    });
    
    // Activate this button
    btn.setAttribute('data-active', 'true');
    btn.classList.add('active');
    
    // Set the hidden input value to the percentage
    const hiddenInput = container.querySelector('input[type="hidden"]');
    if (hiddenInput) {
      hiddenInput.value = stateValue + '%';
    }
  }
  
  console.log(`Revisi ${revisiNum} set to: ${stateValue}%`);
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

  const getHoDateText = (data) => {
    const hoDate = data.tglHandover || (data.data && data.data.handoverDate);
    if (hoDate && hoDate !== '-') return hoDate;
    if (hoDate === '-') return '-';
    return 'tidak diketahui, cek ulang data';
  };

  const hoDateText = getHoDateText(data);
  const hoDateColor = hoDateText === '-' ? '' : (hoDateText === 'tidak diketahui, cek ulang data' ? '#f43f5e' : '#10b981');
  const hoDateWeight = hoDateText === '-' ? '' : 'bold';

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
      <div class="info-item">
        <span class="info-label">Tanggal HandOver ke User:</span>
        <span class="info-value val-ho-date" style="color: ${hoDateColor}; font-weight: ${hoDateWeight}">${hoDateText}</span>
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
      <div class="info-item">
        <span class="info-label">Tanggal HandOver ke User:</span>
        <span class="info-value val-ho-date" style="color: ${hoDateColor}; font-weight: ${hoDateWeight}">${hoDateText}</span>
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

  // Aktifkan Tanggal Handover jika ada
  const hoContainers = pageElement.querySelectorAll('.info-item');
  hoContainers.forEach(container => {
    const label = container.querySelector('.info-label');
    if (label && label.textContent.includes('Tanggal HandOver')) {
      container.style.display = 'flex';
      const input = container.querySelector('input');
      if (input) {
        input.disabled = false;
        input.style.opacity = '1';
        input.style.pointerEvents = 'auto';
      }
    }
  });

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
    
    // Load User2 sliders from database data
    if (currentRole === 'user2') {
      const sliderTasks = ['LAND CLEARING', 'PONDASI', 'SLOOF'];
      sliderTasks.forEach(taskName => {
        const value = progressData.tahap1[taskName];
        if (value !== undefined && typeof updateUser2SliderFromDB === 'function') {
          updateUser2SliderFromDB(taskName, value);
        }
      });
    }
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

// ========== FUNGSI saveTahap2 (PERBAIKAN LENGKAP) ==========

// ========== FUNGSI saveTahap3 (PERBAIKAN LENGKAP) ==========

// ========== FUNGSI saveTahap4 (PERBAIKAN LENGKAP) ==========

// ========== SUMMARY REPORT FUNCTIONS ==========
function showProcessingProgress(duration = 3500) {
  return new Promise((resolve) => {
    const modal = document.getElementById('loadingModal');
    const modalContent = modal.querySelector('.modal-content');
    
    if (!modalContent) {
      resolve();
      return;
    }
    
    modalContent.innerHTML = `
      <i class="fas fa-cogs fa-spin" style="font-size: 3rem; color: #38bdf8; margin-bottom: 20px;"></i>
      <h2 style="font-size: 1.25rem; margin-top: 10px;">Mohon Tunggu</h2>
      <p style="color: #94a3b8; margin-top: 5px;">Sedang memproses data</p>
      <div style="width: 100%; max-width: 300px; margin: 20px auto 0; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; height: 20px;">
        <div id="processingProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #38bdf8, #10b981); border-radius: 10px; transition: width 0.05s linear;"></div>
      </div>
      <p id="processingProgressText" style="color: #38bdf8; margin-top: 10px; font-weight: bold;">0%</p>
    `;
    
    modal.style.display = 'flex';
    
    const progressBar = document.getElementById('processingProgressBar');
    const progressText = document.getElementById('processingProgressText');
    const startTime = Date.now();
    const interval = 50;
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      
      if (progressBar) progressBar.style.width = progress + '%';
      if (progressText) progressText.textContent = Math.round(progress) + '%';
      
      if (progress < 100) {
        setTimeout(updateProgress, interval);
      } else {
        setTimeout(() => {
          resolve();
        }, 200);
      }
    };
    
    updateProgress();
  });
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
                         summaryData.items?.filter(k => {
                           const progress = parseProgressValue(k.totalProgress || k.aj);
                           return progress >= 89;
                         }).length || 0;

  const almostCount = summaryData.categories?.almostCompleted?.count || 
                      summaryData.almostCompletedKavlings?.length || 
                      summaryData.items?.filter(k => {
                        const progress = parseProgressValue(k.totalProgress || k.aj);
                        return progress >= 60 && progress < 89;
                      }).length || 0;

  const progressCount = summaryData.categories?.inProgress?.count || 
                        summaryData.inProgressKavlings?.length || 
                        summaryData.items?.filter(k => {
                          const progress = parseProgressValue(k.totalProgress || k.aj);
                          return progress >= 10 && progress < 60;
                        }).length || 0;

  const lowCount = summaryData.categories?.lowProgress?.count || 
                   summaryData.lowProgressKavlings?.length || 
                   summaryData.items?.filter(k => {
                     const progress = parseProgressValue(k.totalProgress || k.aj);
                     return progress < 10;
                   }).length || 0;

  let html = `
    <div class="summary-header" style="margin-top: 25px; margin-bottom: 30px; border-bottom: 2px solid rgba(255, 255, 255, 0.1); padding-bottom: 20px;">
      <h3><i class="fas fa-chart-bar"></i> Laporan Summary Progress Kavling</h3>
      <p class="summary-timestamp">Diperbarui: ${timestamp}</p>
    </div>

    <div class="summary-stats" style="margin-bottom: 35px; padding-bottom: 25px; border-bottom: 2px dashed rgba(255, 255, 255, 0.1);">
      <div class="stat-card stat-total" onclick="filterKavlingByProgress('all')" style="cursor: pointer; margin-bottom: 10px;" onmouseover="this.style.filter='brightness(1.2)';" onmouseout="this.style.filter='brightness(1)';" title="Klik untuk melihat semua">
        <div class="stat-icon">
          <i class="fas fa-home"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${totalCount}</div>
          <div class="stat-label">Total Kavling</div>
        </div>
      </div>

      <div class="stat-card stat-completed" onclick="filterKavlingByProgress('completed')" style="cursor: pointer; margin-bottom: 10px;" onmouseover="this.style.filter='brightness(1.2)';" onmouseout="this.style.filter='brightness(1)';" title="Klik untuk melihat detail selesai">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${completedCount}</div>
          <div class="stat-label">Selesai (89-100%)</div>
          <div class="stat-percent">${totalCount > 0 ? Math.round((completedCount/totalCount)*100) : 0}%</div>
        </div>
      </div>

      <div class="stat-card stat-almost" onclick="filterKavlingByProgress('almostCompleted')" style="cursor: pointer; margin-bottom: 10px;" onmouseover="this.style.filter='brightness(1.2)';" onmouseout="this.style.filter='brightness(1)';" title="Klik untuk melihat detail hampir selesai">
        <div class="stat-icon">
          <i class="fas fa-hourglass-half"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${almostCount}</div>
          <div class="stat-label">Hampir Selesai (60-88%)</div>
          <div class="stat-percent">${totalCount > 0 ? Math.round((almostCount/totalCount)*100) : 0}%</div>
        </div>
      </div>

      <div class="stat-card stat-progress" onclick="filterKavlingByProgress('inProgress')" style="cursor: pointer; margin-bottom: 10px;" onmouseover="this.style.filter='brightness(1.2)';" onmouseout="this.style.filter='brightness(1)';" title="Klik untuk melihat detail sedang berjalan">
        <div class="stat-icon">
          <i class="fas fa-tools"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${progressCount}</div>
          <div class="stat-label">Sedang Berjalan (10-59%)</div>
          <div class="stat-percent">${totalCount > 0 ? Math.round((progressCount/totalCount)*100) : 0}%</div>
        </div>
      </div>

      <div class="stat-card stat-low" onclick="filterKavlingByProgress('lowProgress')" style="cursor: pointer; margin-bottom: 10px;" onmouseover="this.style.filter='brightness(1.2)';" onmouseout="this.style.filter='brightness(1)';" title="Klik untuk melihat detail progress rendah">
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

  // Tambahkan styles untuk table
  addTableStyles();
}

function parseProgressValue(progressStr) {
  if (!progressStr && progressStr !== 0) return 0;

  if (typeof progressStr === 'number') {
    // Angka dalam bentuk desimal (0-1) atau persentase (0-100)
    if (progressStr <= 1) {
      // Desimal, konversi ke persentase
      return Math.round(progressStr * 10000) / 100;
    } else {
      // Sudah persentase, bulatkan ke 1 digit
      return Math.round(progressStr * 10) / 10;
    }
  }

  if (typeof progressStr === 'string') {
    const match = progressStr.match(/(\d+(\.\d+)?)%?/);
    if (match) {
      let num = parseFloat(match[1]);
      
      // Jika string mengandung %, artinya sudah dalam bentuk persentase
      // Tapi masih dalam format string dengan %
      if (progressStr.includes('%')) {
        // num sudah dalam 0-100
        if (num < 1) {
          // Contoh: "0.06%" → 0.06 → 6
          return Math.round(num * 10000) / 100;
        }
        // Contoh: "99.56%" → 99.6
        return Math.round(num * 10) / 10;
      } else {
        // Tanpa %, bisa desimal atau sudah persentase
        if (num <= 1) {
          // Desimal, konversi ke persentase
          return Math.round(num * 10000) / 100;
        } else {
          // Sudah persentase
          return Math.round(num * 10) / 10;
        }
      }
    }
  }

  return 0;
}

// Test cases
console.log(parseProgressValue('0.06%'));   // 6
console.log(parseProgressValue('1%'));      // 100
console.log(parseProgressValue('0.99%'));   // 99
console.log(parseProgressValue('99.56%'));  // 99.6
console.log(parseProgressValue('99.52%'));  // 99.5
console.log(parseProgressValue('100%'));    // 100
console.log(parseProgressValue('6.23333')); // 6.2

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

  // Header dengan nama tugas yang sebenarnya
  const headers = [
    { key: 'kavling', label: 'BLOK', width: '100px' },
    { key: 'total_progress', label: 'TOTAL', width: '80px' },
    { key: 'lt', label: 'LT', width: '60px' },
    { key: 'lb', label: 'LB', width: '60px' },
    { key: 'type', label: 'Type', width: '80px' },

    // Tahap 1
    { key: 'land_clearing', label: 'LAND CLEARING', width: '120px' },
    { key: 'pondasi', label: 'PONDASI', width: '90px' },
    { key: 'sloof', label: 'SLOOF', width: '80px' },
    { key: 'pas_ddg_sd2_canopy', label: 'PAS.DDG S/D2 CANOPY', width: '140px' },
    { key: 'pas_ddg_sd_ring_blk', label: 'PAS.DDG S/D RING BLK', width: '140px' },
    { key: 'conduit_inbow_doos', label: 'CONDUIT+INBOW DOOS', width: '140px' },
    { key: 'pipa_air_kotor', label: 'PIPA AIR KOTOR', width: '120px' },
    { key: 'pipa_air_bersih', label: 'PIPA AIR BERSIH', width: '120px' },
    { key: 'sistem_pembuangan', label: 'Sistem Pembuangan', width: '130px' },
    { key: 'plester', label: 'PLESTER', width: '80px' },
    { key: 'acian_benangan', label: 'ACIAN & BENANGAN', width: '130px' },
    { key: 'cor_meja_dapur', label: 'COR MEJA DAPUR', width: '120px' },

    // Tahap 2
    { key: 'rangka_atap', label: 'RANGKA ATAP', width: '110px' },
    { key: 'genteng', label: 'GENTENG', width: '80px' },
    { key: 'plafond', label: 'PLAFOND', width: '80px' },
    { key: 'keramik_dinding_toilet_dapur', label: 'KERAMIK DINDING TOILET & DAPUR', width: '180px' },
    { key: 'instalasi_listrik', label: 'INSTS LISTRIK', width: '110px' },
    { key: 'keramik_lantai', label: 'KERAMIK LANTAI', width: '110px' },

    // Tahap 3
    { key: 'kusen_pintu_jendela', label: 'KUSEN PINTU & JENDELA', width: '160px' },
    { key: 'daun_pintu_jendela', label: 'DAUN PINTU & JENDELA', width: '150px' },
    { key: 'cat_dasar_lapis_awal', label: 'CAT DASAR + LAPIS AWAL', width: '150px' },
    { key: 'fitting_lampu', label: 'FITTING LAMPU', width: '100px' },
    { key: 'fixture_saniter', label: 'FIXTURE & SANITER', width: '130px' },
    { key: 'cat_finish_interior', label: 'CAT FINISH INTERIOR', width: '140px' },
    { key: 'cat_finish_exterior', label: 'CAT FINISH EXTERIOR', width: '140px' },
    { key: 'bak_kontrol_batas_carport', label: 'BAK KONTROL & BATAS CARPORT', width: '180px' },
    { key: 'paving_halaman', label: 'PAVING HALAMAN', width: '120px' },
    { key: 'meteran_listrik', label: 'Meteran Listrik', width: '110px' },
    { key: 'meteran_air', label: 'Meteran Air', width: '100px' },
    { key: 'general_cleaning', label: 'GENERAL CLEANING', width: '120px' },

    // Tahap 4
    { key: 'completion_penyelesaian_akhir', label: 'COMPLETION / Penyelesaian akhir', width: '180px' },
    { key: 'keterangan', label: 'Keterangan', width: '150px' },
    { key: 'penyerahan_kunci_dari_pelaksana_ke', label: 'Penyerahan Kunci dari Pelaksana Ke', width: '200px' },
    { key: 'tanggal_penyerahan_kunci_dari_pelaksana', label: 'Tanggal Penyerahan Kunci dari Pelaksana', width: '180px' }
  ];

  let html = `
    <div class="summary-section">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h4><i class="fas fa-list"></i> ${title} (${kavlings.length} kavling)</h4>
        <div style="display: flex; align-items: center; gap: 0;">
          <button onclick="showDownloadCategoryPopup()" class="btn-save-section" style="width: auto; margin-top: 0; padding: 8px 15px; font-size: 0.9rem; background: linear-gradient(135deg, #10b981, #059669); border-radius: 8px 0 0 8px;">
            <i class="fas fa-file-excel"></i> Download Excel
          </button>
          <div style="width: 2px; height: 36px; background: rgba(255,255,255,0.3);"></div>
          <button onclick="showDownloadPDFCategoryPopup()" class="btn-save-section" style="width: auto; margin-top: 0; padding: 8px 15px; font-size: 0.9rem; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 0 8px 8px 0;">
            <i class="fas fa-file-pdf"></i> Download PDF
          </button>
        </div>
      </div>

      <div class="kavling-table-container">
        <table class="kavling-summary-table">
          <thead>
            <tr>
              <th style="width: 60px;">No</th>
  `;

  // Generate header columns
  headers.forEach(header => {
    html += `<th style="width: ${header.width};">${header.label}</th>`;
  });

  html += `
            </tr>
          </thead>
          <tbody>
  `;

  kavlings.forEach((kavling, index) => {
    // Parse progress untuk styling
    const totalProgress = parseProgressValue(kavling.total_progress || kavling.total || kavling.aj);
    const progressClass = totalProgress >= 89 ? 'progress-high' : 
                         (totalProgress >= 60 ? 'progress-medium' : 
                         (totalProgress >= 10 ? 'progress-low' : 'progress-very-low'));

    html += `
      <tr>
        <td class="text-center">${index + 1}</td>
    `;

    // Generate data cells berdasarkan header
    headers.forEach(header => {
      let rawValue = null;
      
      // 1. Coba mapping manual berdasarkan label (ini yang paling akurat dari Spreadsheet)
      const label = header.label.toUpperCase();
      if (kavling[label] !== undefined && kavling[label] !== null) {
        rawValue = kavling[label];
      }
      
      // 2. Jika tidak ada, coba mapping berdasarkan key
      if (rawValue === null || rawValue === undefined) {
        // Cek label asli tanpa Uppercase jika label di headers mengandung karakter khusus
        if (kavling[header.label] !== undefined && kavling[header.label] !== null) {
            rawValue = kavling[header.label];
        } else {
            const possibleKeys = [
              header.key,
              header.key.replace(/_/g, ' '),
              header.key.toUpperCase(),
              header.label // Coba label apa adanya
            ];
            
            for (const k of possibleKeys) {
              if (kavling[k] !== undefined && kavling[k] !== null) {
                rawValue = kavling[k];
                break;
              }
            }
        }
      }

      // Formatting khusus untuk kolom tertentu
      let cellContent = '';
      if (header.key === 'kavling') {
        cellContent = `<td class="kavling-name">${rawValue || '-'}</td>`;
      } else if (header.key === 'total_progress') {
        const val = parseProgressValue(rawValue || 0);
        cellContent = `<td class="text-center ${progressClass}"><strong>${val}%</strong></td>`;
      } else {
        // TAMPILKAN APA ADANYA (Sesuai request: Munculkan saja apapun yang tertulis)
        // Cek apakah nilainya 100% atau mengandung %
        const strVal = String(rawValue || '');
        if (strVal.includes('%') || strVal.toLowerCase() === 'v') {
          cellContent = `<td class="text-center">${rawValue}</td>`;
        } else if (rawValue === true || rawValue === 'TRUE') {
          cellContent = `<td class="text-center status-check"><i class="fas fa-check-circle" style="color: #10b981;"></i></td>`;
        } else if (rawValue === false || rawValue === 'FALSE') {
          cellContent = `<td class="text-center status-uncheck"><i class="far fa-circle" style="color: #e2e8f0;"></i></td>`;
        } else {
          // Tampilkan teks asli (misal: 100%, v, V, atau keterangan lainnya)
          cellContent = `<td class="text-center">${rawValue !== null && rawValue !== undefined ? rawValue : '-'}</td>`;
        }
      }
      
      html += cellContent;
    });

    html += `</tr>`;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  return html;
}

// Global variable to store current filtered kavlings for download
window.currentFilteredKavlings = [];

function filterKavlingByProgress(filter) {
  const summaryData = window.lastSummaryData;
  if (!summaryData) {
    console.log('filterKavlingByProgress: No summary data available');
    return;
  }

  let kavlings = [];
  let title = '';

  const allItems = summaryData.items || summaryData.allKavlings || [];
  console.log('filterKavlingByProgress: filter =', filter, ', allItems count =', allItems.length);

  switch(filter) {
    case 'all':
      kavlings = allItems;
      title = 'Semua Data Kavling';
      break;
    case 'completed':
      kavlings = allItems.filter(k => {
        const p = parseProgressValue(k.total_progress || k.total || k.aj);
        return p >= 89;
      });
      title = 'Kavling Selesai (89-100%)';
      break;
    case 'almostCompleted':
      kavlings = allItems.filter(k => {
        const p = parseProgressValue(k.total_progress || k.total || k.aj);
        return p >= 60 && p < 89;
      });
      title = 'Kavling Hampir Selesai (60-88%)';
      break;
    case 'inProgress':
      kavlings = allItems.filter(k => {
        const p = parseProgressValue(k.total_progress || k.total || k.aj);
        return p >= 10 && p < 60;
      });
      title = 'Kavling Sedang Berjalan (10-59%)';
      break;
    case 'lowProgress':
      kavlings = allItems.filter(k => {
        const p = parseProgressValue(k.total_progress || k.total || k.aj);
        return p < 10;
      });
      title = 'Kavling Progress Rendah (0-9%)';
      break;
  }

  window.currentFilteredKavlings = kavlings;
  window.currentFilteredTitle = title;
  console.log('filterKavlingByProgress: Set currentFilteredKavlings count =', kavlings.length);
  
  const filteredSection = document.getElementById('filteredKavlingSection');
  if (filteredSection) {
    filteredSection.innerHTML = renderKavlingSection(title, kavlings);
  }
}

function showDownloadCategoryPopup() {
  const popupHtml = `
    <div id="downloadCategoryPopup" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 9999;">
      <div style="background: #1e293b; border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <h3 style="color: #f1f5f9; margin: 0 0 20px 0; text-align: center; font-size: 1.2rem;">
          <i class="fas fa-file-excel" style="color: #10b981; margin-right: 8px;"></i>
          Pilih Kategori Download
        </h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button onclick="downloadByCategory('all')" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-th-large"></i> Semua Kavling
          </button>
          <button onclick="downloadByCategory('completed')" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-check-circle"></i> Selesai (89-100%)
          </button>
          <button onclick="downloadByCategory('almostCompleted')" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-clock"></i> Hampir Selesai (60-88%)
          </button>
          <button onclick="downloadByCategory('inProgress')" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-spinner"></i> Sedang Berjalan (10-59%)
          </button>
          <button onclick="downloadByCategory('lowProgress')" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-exclamation-triangle"></i> Progress Rendah (&lt;60%)
          </button>
        </div>
        <button onclick="closeDownloadCategoryPopup()" style="background: #475569; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; width: 100%; margin-top: 16px;">
          <i class="fas fa-times"></i> Batal
        </button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', popupHtml);
}

function closeDownloadCategoryPopup() {
  const popup = document.getElementById('downloadCategoryPopup');
  if (popup) popup.remove();
}

function downloadByCategory(category) {
  closeDownloadCategoryPopup();
  
  if (!window.lastSummaryData) {
    showToast('warning', 'Tidak ada data. Silakan muat ulang halaman.');
    return;
  }
  
  const summaryData = window.lastSummaryData;
  const categories = summaryData.categories || {};
  let kavlings = [];
  let title = '';
  
  function getCategoryItems(cat) {
    if (!cat) return [];
    return cat.items || cat.kavlings || [];
  }
  
  switch(category) {
    case 'all':
      kavlings = summaryData.items || summaryData.allKavlings || [
        ...getCategoryItems(categories.completed),
        ...getCategoryItems(categories.almostCompleted),
        ...getCategoryItems(categories.inProgress),
        ...getCategoryItems(categories.lowProgress)
      ];
      title = 'Semua_Kavling';
      break;
    case 'completed':
      kavlings = getCategoryItems(categories.completed) || summaryData.topCompleted || [];
      title = 'Sudah_Selesai';
      break;
    case 'almostCompleted':
      kavlings = getCategoryItems(categories.almostCompleted) || summaryData.topAlmost || [];
      title = 'Hampir_Selesai';
      break;
    case 'inProgress':
      kavlings = getCategoryItems(categories.inProgress) || [];
      title = 'Sedang_Berjalan';
      break;
    case 'lowProgress':
      kavlings = getCategoryItems(categories.lowProgress) || summaryData.needAttention || [];
      title = 'Progress_Rendah';
      break;
    default:
      kavlings = summaryData.items || summaryData.allKavlings || [];
      title = 'Data_Kavling';
  }
  
  console.log('Download category:', category, 'Count:', kavlings.length);
  
  if (!kavlings || kavlings.length === 0) {
    showToast('warning', 'Tidak ada data untuk kategori ini.');
    return;
  }
  
  downloadSummaryToExcelWithData(title, kavlings);
}

// ========== PDF DOWNLOAD FUNCTIONS ==========
function showDownloadPDFCategoryPopup() {
  const popupHtml = `
    <div id="downloadPDFCategoryPopup" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 9999;">
      <div style="background: #1e293b; border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <h3 style="color: #f1f5f9; margin: 0 0 20px 0; text-align: center; font-size: 1.2rem;">
          <i class="fas fa-file-pdf" style="color: #ef4444; margin-right: 8px;"></i>
          Pilih Kategori Download PDF
        </h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button onclick="downloadPDFByCategory('all')" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-th-large"></i> Semua Kavling
          </button>
          <button onclick="downloadPDFByCategory('completed')" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-check-circle"></i> Selesai (89-100%)
          </button>
          <button onclick="downloadPDFByCategory('almostCompleted')" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-clock"></i> Hampir Selesai (60-88%)
          </button>
          <button onclick="downloadPDFByCategory('inProgress')" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-spinner"></i> Sedang Berjalan (10-59%)
          </button>
          <button onclick="downloadPDFByCategory('lowProgress')" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-exclamation-triangle"></i> Progress Rendah (&lt;60%)
          </button>
        </div>
        <button onclick="closeDownloadPDFCategoryPopup()" style="background: #475569; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; width: 100%; margin-top: 16px;">
          <i class="fas fa-times"></i> Batal
        </button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', popupHtml);
}

function closeDownloadPDFCategoryPopup() {
  const popup = document.getElementById('downloadPDFCategoryPopup');
  if (popup) popup.remove();
}

function downloadPDFByCategory(category) {
  closeDownloadPDFCategoryPopup();
  
  if (!window.lastSummaryData) {
    showToast('warning', 'Tidak ada data. Silakan muat ulang halaman.');
    return;
  }
  
  const summaryData = window.lastSummaryData;
  const categories = summaryData.categories || {};
  let kavlings = [];
  let title = '';
  let categoryLabel = '';
  
  function getCategoryItems(cat) {
    if (!cat) return [];
    return cat.items || cat.kavlings || [];
  }
  
  switch(category) {
    case 'all':
      kavlings = summaryData.items || summaryData.allKavlings || [
        ...getCategoryItems(categories.completed),
        ...getCategoryItems(categories.almostCompleted),
        ...getCategoryItems(categories.inProgress),
        ...getCategoryItems(categories.lowProgress)
      ];
      title = 'Semua_Kavling';
      categoryLabel = 'Semua Kavling';
      break;
    case 'completed':
      kavlings = getCategoryItems(categories.completed) || summaryData.topCompleted || [];
      title = 'Sudah_Selesai';
      categoryLabel = 'Selesai (89-100%)';
      break;
    case 'almostCompleted':
      kavlings = getCategoryItems(categories.almostCompleted) || summaryData.topAlmost || [];
      title = 'Hampir_Selesai';
      categoryLabel = 'Hampir Selesai (60-88%)';
      break;
    case 'inProgress':
      kavlings = getCategoryItems(categories.inProgress) || [];
      title = 'Sedang_Berjalan';
      categoryLabel = 'Sedang Berjalan (10-59%)';
      break;
    case 'lowProgress':
      kavlings = getCategoryItems(categories.lowProgress) || summaryData.needAttention || [];
      title = 'Progress_Rendah';
      categoryLabel = 'Progress Rendah (0-9%)';
      break;
    default:
      kavlings = summaryData.items || summaryData.allKavlings || [];
      title = 'Data_Kavling';
      categoryLabel = 'Data Kavling';
  }
  
  console.log('Download PDF category:', category, 'Count:', kavlings.length);
  
  if (!kavlings || kavlings.length === 0) {
    showToast('warning', 'Tidak ada data untuk kategori ini.');
    return;
  }
  
  generateAndDownloadPDF(title, categoryLabel, kavlings);
}

function generateAndDownloadPDF(title, categoryLabel, kavlings) {
  showGlobalLoading('Membuat file PDF...');
  
  const dateStr = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  const timeStr = new Date().toLocaleTimeString('id-ID');
  
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laporan ${categoryLabel}</title>
      <style>
        @media print {
          @page { size: landscape; margin: 10mm; }
        }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 9px; 
          margin: 0; 
          padding: 15px;
          background: white;
        }
        .header { 
          text-align: center; 
          margin-bottom: 15px; 
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .header h1 { 
          margin: 0; 
          font-size: 16px; 
          color: #1a365d;
        }
        .header h2 { 
          margin: 5px 0; 
          font-size: 12px; 
          color: #2d3748;
        }
        .header p { 
          margin: 3px 0; 
          font-size: 10px; 
          color: #718096;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 8px;
        }
        th { 
          background: #2d3748; 
          color: white; 
          padding: 6px 3px; 
          text-align: center; 
          border: 1px solid #1a202c;
          font-size: 7px;
        }
        td { 
          padding: 4px 3px; 
          border: 1px solid #cbd5e0; 
          text-align: center;
        }
        tr:nth-child(even) { background: #f7fafc; }
        tr:hover { background: #edf2f7; }
        .progress-high { background: #c6f6d5 !important; color: #22543d; font-weight: bold; }
        .progress-medium { background: #fefcbf !important; color: #744210; }
        .progress-low { background: #fed7d7 !important; color: #742a2a; }
        .footer { 
          margin-top: 15px; 
          text-align: center; 
          font-size: 9px; 
          color: #718096;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
        }
        .summary-box {
          display: inline-block;
          padding: 5px 15px;
          background: #ebf8ff;
          border: 1px solid #90cdf4;
          border-radius: 5px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DATA PROGRES & KONDISI KAVLING BTU KNC</h1>
        <h2>Laporan: ${categoryLabel}</h2>
        <p>Tanggal: ${dateStr} | Jam: ${timeStr}</p>
        <div class="summary-box">
          <strong>Total Data: ${kavlings.length} Kavling</strong>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>BLOK</th>
            <th>TOTAL</th>
            <th>LT</th>
            <th>LB</th>
            <th>Type</th>
            <th>Keterangan</th>
            <th>Penyerahan Kunci dari Pelaksana Ke</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  kavlings.forEach((kavling, index) => {
    const totalProgress = parseProgressValue(kavling.total_progress || kavling.total || kavling.aj);
    const progressClass = totalProgress >= 89 ? 'progress-high' : 
                         (totalProgress >= 60 ? 'progress-medium' : 'progress-low');
    
    let totalValue = kavling.total_progress || kavling.total || kavling.aj || '0';
    if (totalValue && !String(totalValue).includes('%')) {
      totalValue = totalValue + '%';
    }
    
    const getValue = (keys) => {
      for (const key of keys) {
        if (kavling[key] !== undefined && kavling[key] !== null && kavling[key] !== '') {
          return kavling[key];
        }
      }
      return '-';
    };
    
    htmlContent += `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${kavling.kavling || '-'}</strong></td>
        <td class="${progressClass}">${totalValue}</td>
        <td>${kavling.lt || '-'}</td>
        <td>${kavling.lb || '-'}</td>
        <td>${kavling.type || '-'}</td>
        <td>${kavling.keterangan || '-'}</td>
      </tr>
    `;
  });
  
  htmlContent += `
        </tbody>
      </table>
      <div class="footer">
        <p>Dokumen ini digenerate secara otomatis oleh Sistem Monitoring Kavling BTU KNC</p>
        <p>© ${new Date().getFullYear()} - BTU KNC Property</p>
      </div>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    hideGlobalLoading();
    showToast('success', `PDF untuk ${kavlings.length} kavling siap dicetak`);
  } else {
    hideGlobalLoading();
    showToast('error', 'Popup diblokir. Silakan izinkan popup untuk download PDF.');
  }
}

function downloadSummaryToExcelWithData(title, kavlings) {
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

  kavlings.forEach((kavling) => {
    let totalValue = kavling.total_progress || kavling.total || kavling.aj || '0';
    if (totalValue && !String(totalValue).includes('%')) {
      totalValue = totalValue + '%';
    }
    const rowData = [
      kavling.kavling || '',
      totalValue,
      kavling.lt || '',
      kavling.lb || '',
      kavling.type || '',
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
      formatExcelValue(kavling['RANGKA ATAP'] || kavling.rangka_atap),
      formatExcelValue(kavling.GENTENG || kavling.genteng),
      formatExcelValue(kavling.PLAFOND || kavling.plafond),
      formatExcelValue(kavling['KERAMIK DINDING TOILET & DAPUR'] || kavling.keramik_dinding_toilet_dapur || kavling.keramikDinding),
      formatExcelValue(kavling['INSTALASI LISTRIK'] || kavling.instalasi_listrik),
      formatExcelValue(kavling['KERAMIK LANTAI'] || kavling.keramik_lantai),
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
      formatExcelValue(kavling['COMPLETION / Penyelesaian akhir'] || kavling.completion_penyelesaian_akhir),
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
  link.setAttribute("download", `${title}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('success', `Berhasil download ${kavlings.length} data kavling`);
}

// Update download function to use stored data

function formatExcelValue(value) {
  if (value === true || value === 'TRUE' || value === '✓' || value === 1) {
    return '✓';
  }
  if (value === false || value === 'FALSE' || value === '' || value === 0) {
    return '';
  }
  return value || '';
}

function formatExcelDate(value) {
  if (!value) return '';

  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // Jika parsing gagal, return as is
  }

  return value;
}

function formatCellValue(value) {
  if (value === null || value === undefined || value === '') return '-';

  // Jika boolean (checkbox)
  if (value === true || value === 'TRUE') return '✓';
  if (value === false || value === 'FALSE') return '';

  // Untuk nilai persentase atau teks lainnya, tampilkan apa adanya (raw)
  return value;
}

async function compressImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set max dimensions
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(base64.split(',')[1]); // Return only the base64 data part
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function addTableStyles() {
  if (!document.getElementById('summary-table-styles')) {
    const style = document.createElement('style');
    style.id = 'summary-table-styles';
    style.textContent = `
      .summary-actions {
        display: flex;
        justify-content: flex-end;
        margin: 20px 0;
        gap: 10px;
      }

      .kavling-table-container {
        overflow-x: auto;
        max-height: 500px;
        margin-top: 20px;
        border-radius: 8px;
        border: 1px solid #334155;
      }

      .kavling-summary-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
      }

      .kavling-summary-table th {
        background: linear-gradient(135deg, #1e293b, #334155);
        color: #e2e8f0;
        padding: 10px 8px;
        text-align: center;
        font-weight: 600;
        border: 1px solid #475569;
        white-space: nowrap;
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .kavling-summary-table td {
        padding: 8px;
        border: 1px solid #334155;
        text-align: center;
        background: #0f172a;
        color: #cbd5e1;
      }

      .kavling-summary-table tr:nth-child(even) td {
        background: #1e293b;
      }

      .kavling-summary-table tr:hover td {
        background: #2d3748;
      }

      .kavling-name {
        font-weight: 600;
        color: #38bdf8;
        min-width: 100px;
        position: sticky;
        left: 0;
        z-index: 5;
        background: inherit;
      }

      .kavling-summary-table th:first-child,
      .kavling-summary-table td:first-child {
        position: sticky;
        left: 0;
        z-index: 5;
        background: inherit;
      }

      .progress-high { color: #10b981; font-weight: bold; }
      .progress-medium { color: #f59e0b; font-weight: bold; }
      .progress-low { color: #f97316; font-weight: bold; }
      .progress-very-low { color: #f43f5e; font-weight: bold; }

      .text-center { text-align: center; }

      .stat-card.active-filter {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        border: 2px solid #38bdf8;
      }
    `;
    document.head.appendChild(style);
  }
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

  switch(category) {
    case 'completed':
      title = 'Data Kavling Selesai (89-100%)';
      kavlings = summaryData.categories?.completed?.items || 
                 summaryData.categories?.completed?.kavlings || 
                 summaryData.completedKavlings || 
                 summaryData.topCompleted ||
                 (summaryData.items || []).filter(k => {
                   const progress = parseProgressValue(k.totalProgress || k.aj);
                   return progress >= 89;
                 }) || [];
      break;
    case 'almostCompleted':
      title = 'Data Kavling Hampir Selesai (60-88%)';
      kavlings = summaryData.categories?.almostCompleted?.items || 
                 summaryData.categories?.almostCompleted?.kavlings || 
                 summaryData.almostCompletedKavlings || 
                 summaryData.topAlmost ||
                 (summaryData.items || []).filter(k => {
                   const progress = parseProgressValue(k.totalProgress || k.aj);
                   return progress >= 60 && progress < 89;
                 }) || [];
      break;
    case 'inProgress':
      title = 'Data Kavling Sedang Berjalan (10-59%)';
      kavlings = summaryData.categories?.inProgress?.items || 
                 summaryData.categories?.inProgress?.kavlings || 
                 summaryData.inProgressKavlings || 
                 (summaryData.items || []).filter(k => {
                   const progress = parseProgressValue(k.totalProgress || k.aj);
                   return progress >= 10 && progress < 60;
                 }) || [];
      break;
    case 'lowProgress':
      title = 'Data Kavling Progress Rendah (0-9%)';
      kavlings = summaryData.categories?.lowProgress?.items || 
                 summaryData.categories?.lowProgress?.kavlings || 
                 summaryData.lowProgressKavlings || 
                 summaryData.needAttention ||
                 (summaryData.items || []).filter(k => {
                   const progress = parseProgressValue(k.totalProgress || k.aj);
                   return progress < 10;
                 }) || [];
      break;
    case 'all':
      title = 'Seluruh Data Kavling';
      kavlings = summaryData.allKavlings || summaryData.items || [];
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





// ========== ADMIN FUNCTIONS ==========

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

function loadTahapDataSection(section, tahap, data) {
  const subTasks = section.querySelectorAll('.sub-task');
  subTasks.forEach(input => {
    const taskName = input.getAttribute('data-task');
    const value = (data && data[taskName]) ? data[taskName] : '';

    if (input.type === 'checkbox') {
      input.checked = (value === '100%' || value === true || value === 'TRUE');
    } else {
      input.value = value;
      // Add visual feedback for progress buttons
      const parent = input.closest('.progress-choice');
      if (parent) {
        const btns = parent.querySelectorAll('.progress-btn');
        btns.forEach(b => {
          if (b.getAttribute('data-value') === value) b.classList.add('active');
          else b.classList.remove('active');
        });
      }
    }
  });

  // Special logic for Pelaksana 2 Land Clearing DB display
  if (currentRole === 'user2' && tahap === '1') {
    const dbDisplay = document.getElementById('landClearingDBProgressUser2');
    if (dbDisplay) {
      const lcValue = (data && data['LAND CLEARING']) ? data['LAND CLEARING'] : '0%';
      dbDisplay.value = lcValue;
    }
  }

  updateTahapProgressUI(section, tahap);
}
// Hitung progress dari sebuah tahapSection
function calculateProgress(tahapSection) {
  let percent = 0;

  // Contoh: hitung dari input hidden sub-task
  const inputs = tahapSection.querySelectorAll('input.sub-task');
  if (inputs.length > 0) {
    let completed = 0;
    inputs.forEach(input => {
      if (input.value && input.value !== '') {
        completed++;
      }
    });
    percent = Math.round((completed / inputs.length) * 100);
  }

  return percent;
}
function updateTahapProgressUI(tahapSection, tahap) {
  const percent = calculateProgress(tahapSection);

  // Update bar dan teks
  const bar = tahapSection.querySelector('.progress-fill');
  const text = tahapSection.querySelector('.sub-percent-tahap');

  if (bar) bar.style.width = percent + '%';
  if (text) text.textContent = percent + '%';

  console.log(`UI updated for tahap ${tahap}: ${percent}%`);
}

// ========== FUNGSI LOAD KAVLING DATA (MODIFIKASI) ==========

function updateKavlingInfoDisplay(data) {
  const pageId = currentRole + 'Page';
  const page = document.getElementById(pageId);
  if (!page) return;

  const infoSection = page.querySelector('.kavling-info-display');
  if (!infoSection) return;

  const valName = infoSection.querySelector('.val-name');
  const valType = infoSection.querySelector('.val-type');
  const valLt = infoSection.querySelector('.val-lt');
  const valLb = infoSection.querySelector('.val-lb');

  if (valName) valName.textContent = data.kavling || selectedKavling;
  if (valType) valType.textContent = data.type || '-';
  if (valLt) valLt.textContent = data.lt || '-';
  if (valLb) valLb.textContent = data.lb || '-';
}

// ========== FUNGSI searchKavling DIPERBARUI ==========
async function searchKavling(isSync = false) {
  const selectId = getRoleSelectId(currentRole);
  const select = document.getElementById(selectId);
  if (!select) return;

  const kavlingName = select.value;
  if (!kavlingName) return;

  await loadKavlingData(kavlingName);
}

function getRoleSelectId(role) {
  const selectIds = {
    'user1': 'searchKavlingUser1',
    'user2': 'searchKavlingUser2', 
    'user3': 'searchKavlingUser3',
    'user4': 'searchKavlingUser4',
    'manager': 'searchKavlingManager'
  };
  return selectIds[role] || `searchKavling${role.charAt(0).toUpperCase() + role.slice(1)}`;
}

// Fungsi untuk load kavling list dengan loading

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
        } else if (tahap === 'revisi') {
          console.log('Calling saveTahapRevisi');
          saveTahapRevisi();
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

    // Setup progress buttons untuk semua user pages
    console.log('Setting up progress buttons...');
    ['user1Page', 'user2Page', 'user3Page'].forEach(pageId => {
      const page = document.getElementById(pageId);
      if (page) {
        setupProgressButtons(page);
      }
    });

    // Setup tombol hari ini (setelah semua element ada)
    console.log('Setting up today buttons...');
    setupTodayButtons();

    // Setup date inputs (setelah semua element ada)
    console.log('Setting up date inputs...');
    setupAllDateInputs();

    // Setup key delivery button (khusus user4)
    console.log('Setting up key delivery button...');
    setupKeyDeliveryButton();

    // Setup photo upload listeners
    console.log('Setting up photo upload listeners...');
    setupPhotoUploadListeners();

    // ===== TAMBAHAN: Setup khusus untuk tombol save di tab notes manager =====
    console.log('Setting up manager save button for notes tab...');
    setupManagerNotesSaveButton();

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
      window.debugTodayBtn = todayBtns[0];
    }

  }, 500); // Delay 500ms untuk memastikan DOM siap

  // 8. Cek session login
  const savedRole = sessionStorage.getItem('loggedRole');
  if (savedRole) {
    currentRole = savedRole;
    showPage(savedRole);
  }

  // Inisialisasi upload foto revisi
  setupRevisiPhotoUpload();

  console.log('=== APP INITIALIZED ===');
}

// ===== FUNGSI BARU: Setup khusus tombol save di tab notes manager =====
function setupManagerNotesSaveButton() {
  console.log('🔧 Setting up manager notes save button...');

  // Cari tombol save di tab notes manager
  const managerSaveBtn = document.querySelector('#tab-notes .btn-save-section');

  if (managerSaveBtn) {
    console.log('✅ Found manager notes save button');

    // Hapus event listener lama jika ada (clone untuk reset)
    const newBtn = managerSaveBtn.cloneNode(true);
    managerSaveBtn.parentNode.replaceChild(newBtn, managerSaveBtn);

    // Tambah event listener baru
    newBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      console.log('🎯 Manager notes save button clicked');

      // Pastikan fungsi savePropertyDataManager ada
      if (typeof savePropertyDataManager === 'function') {
        console.log('📝 Calling savePropertyDataManager()...');
        await savePropertyDataManager();
      } else {
        console.error('❌ savePropertyDataManager function not found!');
        showToast('error', 'Fungsi penyimpanan tidak tersedia');

        // Fallback ke fungsi lama jika ada
        if (typeof savePropertyNotes === 'function') {
          console.log('⚠️ Falling back to savePropertyNotes()');
          await savePropertyNotes();
        }
      }
    });

    console.log(`✅ Manager notes save button setup complete (id: ${newBtn.id || 'no-id'})`);
  } else {
    console.log('ℹ️ Manager notes save button not found yet (may be lazy-loaded)');

    // Setup observer untuk menangani jika button muncul nanti
    setupManagerNotesObserver();
  }
}

// ===== FUNGSI TAMBAHAN: Observer untuk tombol yang lazy-loaded =====
function setupManagerNotesObserver() {
  // Observer untuk mendeteksi ketika tab notes manager dibuka
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const managerSaveBtn = document.querySelector('#tab-notes .btn-save-section');
        if (managerSaveBtn) {
          console.log('🎯 Manager notes save button appeared via mutation');
          setupManagerNotesSaveButton(); // Setup sekarang
          observer.disconnect(); // Stop observing
        }
      }
    });
  });

  // Mulai observe pada container tab notes
  const notesTab = document.getElementById('tab-notes');
  if (notesTab) {
    observer.observe(notesTab, { childList: true, subtree: true });
    console.log('👀 Observer started for manager notes tab');
  }
}

// ===== FUNGSI PERBAIKAN: setupPhotoUploadListeners =====
function setupPhotoUploadListeners() {
  console.log('Setting up photo upload listeners...');

  // Photo input change event
  const photoInput = document.getElementById('revisionPhotoInput');
  if (photoInput) {
    // Clone to remove old listeners
    const newPhotoInput = photoInput.cloneNode(true);
    photoInput.parentNode.replaceChild(newPhotoInput, photoInput);

    newPhotoInput.addEventListener('change', function(e) {
      console.log('📸 Photo input changed');
      if (this.files && this.files[0]) {
        handleRevisionPhotoSelect(this);
      }
    });
  }

  // Cancel photo button
  const cancelBtn = document.getElementById('btnCancelRevision');
  if (cancelBtn) {
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', cancelRevisionPhoto);
  }

  // NOTICE: Tombol save di tab notes manager sekarang di-handle oleh setupManagerNotesSaveButton()
  // di atas, jadi kita tidak perlu setup ulang di sini

  console.log('✅ Photo upload listeners setup complete');
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

  // Setup tombol View Mutation History untuk Supervisor (sama seperti Admin Utilitas)
  const btnViewMutationSupervisor = document.getElementById('btnViewMutationHistorySupervisor');
  console.log('🔧 Setup Supervisor Mutation Button:', btnViewMutationSupervisor ? 'FOUND' : 'NOT FOUND');
  
  // Flag untuk mencegah double-click saat loading (global)
  window.isLoadingSupervisorMutation = false;
  // Flag untuk tracking status toggle (true = data visible, false = hidden) - GLOBAL
  window.supervisorMutationVisible = false;
  
  if (btnViewMutationSupervisor) {
    btnViewMutationSupervisor.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('📋 Supervisor Mutation Button clicked!');
      console.log('📍 Current visibility flag:', window.supervisorMutationVisible);
      
      // Cegah double-click saat sedang loading
      if (window.isLoadingSupervisorMutation) {
        console.log('⏳ Masih loading, mohon tunggu...');
        return;
      }
      
      const container = document.getElementById('mutasiHistoryContainerSupervisor');
      if (!container) {
        console.error('❌ Container mutasiHistoryContainerSupervisor tidak ditemukan!');
        return;
      }
      
      // Ambil kavling yang dipilih (sama seperti admin)
      const kavling = selectedKavling || (document.querySelector('#kavlingInfoManager .val-name')?.textContent !== '-' ? document.querySelector('#kavlingInfoManager .val-name')?.textContent : null);
      
      console.log('📍 Kavling terpilih:', kavling);
      
      // Toggle logic menggunakan FLAG, bukan CSS display
      if (!window.supervisorMutationVisible) {
        // Tampilkan data
        if (kavling) {
          console.log('🔄 Loading mutation history untuk:', kavling);
          window.isLoadingSupervisorMutation = true;
          
          try {
            await loadMutationHistoryForSupervisor(kavling);
            window.supervisorMutationVisible = true;
            console.log('✅ Container now visible, flag set to true');
          } finally {
            window.isLoadingSupervisorMutation = false;
          }
        } else {
          showToast('warning', 'Pilih kavling terlebih dahulu!');
        }
      } else {
        // Sembunyikan data
        console.log('👁️ Hiding mutation history container');
        container.style.display = 'none';
        window.supervisorMutationVisible = false;
        console.log('✅ Container hidden, flag set to false');
      }
    });
    // Event listener untuk tombol mutasi supervisor
    const btnMutation = document.getElementById('btnShowMutationSupervisor');
    if (btnMutation) {
      console.log('🔧 Setting up manual mutation button...');
      // Re-attach to avoid any issues with multiple setups
      btnMutation.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔘 Mutasi HO button clicked!');
        
        const container = document.getElementById('mutasiHistoryContainerSupervisor');
        if (!container) {
            console.error('❌ Container mutasiHistoryContainerSupervisor tidak ditemukan!');
            return;
        }
        
        const kavling = selectedKavling || (document.querySelector('#kavlingInfoManager .val-name')?.textContent !== '-' ? document.querySelector('#kavlingInfoManager .val-name')?.textContent : null);
        
        console.log('📍 Current kavling for mutation:', kavling);
        
        if (!kavling || kavling === '-') {
            showToast('warning', 'Pilih kavling terlebih dahulu!');
            return;
        }

        // Always show and load when button is clicked to ensure it works
        if (container.style.display === 'none') {
            container.style.display = 'block';
            window.supervisorMutationVisible = true;
            await loadMutationHistoryForSupervisor(kavling);
        } else {
            container.style.display = 'none';
            window.supervisorMutationVisible = false;
        }
      };
    } else {
      console.log('⚠️ Tombol btnShowMutationSupervisor tidak ditemukan di DOM');
    }
  }
}

// Function to initialize mutation button separately to ensure it's ready
function initSupervisorMutationButton() {
    const btnMutation = document.getElementById('btnShowMutationSupervisor');
    if (btnMutation && !btnMutation.dataset.setupDone) {
        console.log('🚀 Manually initializing Supervisor Mutation Button');
        btnMutation.dataset.setupDone = 'true';
        btnMutation.onclick = async (e) => {
            e.preventDefault();
            const container = document.getElementById('mutasiHistoryContainerSupervisor');
            const kavling = selectedKavling || (document.querySelector('#kavlingInfoManager .val-name')?.textContent !== '-' ? document.querySelector('#kavlingInfoManager .val-name')?.textContent : null);
            
            if (!kavling || kavling === '-') {
                showToast('warning', 'Pilih kavling terlebih dahulu!');
                return;
            }

            if (container.style.display === 'none') {
                container.style.display = 'block';
                window.supervisorMutationVisible = true;
                await loadMutationHistoryForSupervisor(kavling);
            } else {
                container.style.display = 'none';
                window.supervisorMutationVisible = false;
            }
        };
    }
}

// Global initialization check
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initSupervisorMutationButton, 1000);
});

// Fungsi untuk parse mutasi data dari string (sama seperti di Admin Utilitas)
function parseMutasiDataFromStringSupervisor(mutasiString) {
  if (!mutasiString || mutasiString.trim() === '') {
    return [];
  }
  
  const entries = [];
  const entryStrings = mutasiString.split('|').map(entry => entry.trim());
  
  entryStrings.forEach((entryStr, index) => {
    if (entryStr.trim() === '') return;
    
    const parts = entryStr.split(',');
    
    if (parts.length >= 3) {
      entries.push({
        dari: parts[0]?.trim() || '',
        ke: parts[1]?.trim() || '',
        tanggal: parts[2]?.trim() || '',
        jenis: ''
      });
    }
  });
  
  return entries;
}

// URL Admin Utilitas untuk Supervisor (sama dengan Admin Utilitas)
const ADMIN_UTILITAS_URL_SUPERVISOR = 'https://script.google.com/macros/s/AKfycbxdn4gEn2DdgLYRyVy8QVfF4QMVwL2gs7O7cFIfisvKdfFCPkiOlLTYpJpVGt-w3-q4Vg/exec';

// Fungsi untuk load mutation history di Supervisor (sama seperti Admin Utilitas)

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


// ===== FUNGSI UNTUK VALIDASI BASE64 =====
function isValidBase64(str) {
  try {
    // Check if string contains only valid base64 characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) return false;

    // Try to decode
    const decoded = Utilities.base64Decode(str);
    return decoded !== null;
  } catch (e) {
    return false;
  }
}

// ===== FUNGSI UNTUK MENDAPATKAN FOTO REVISI BERDASARKAN SEARCH ID =====
function getRevisionPhotosBySearchIdFromSheet(searchId, kavlingName = '') {
  try {
    console.log('=== GET REVISION PHOTOS BY SEARCH ID FROM SHEET ===');
    console.log('Search ID:', searchId);
    console.log('Kavling:', kavlingName);

    if (!searchId) {
      return { 
        success: false, 
        message: 'Parameter searchId diperlukan' 
      };
    }

    const sheet = initializeFotoRevisiSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      return {
        success: true,
        searchId: searchId,
        kavling: kavlingName,
        photos: [],
        count: 0
      };
    }

    const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
    const photos = [];
    const searchIdUpper = searchId.toUpperCase();
    const kavlingUpper = kavlingName.toUpperCase();

    data.forEach((row, index) => {
      const rowSearchId = String(row[7] || '').trim().toUpperCase();
      const rowKavling = String(row[1] || '').trim().toUpperCase();
      let matches = false;

      // Check search ID match
      if (rowSearchId === searchIdUpper) {
        matches = true;
      }
      // If no search ID match but kavling name provided, check kavling name
      else if (kavlingName && rowKavling === kavlingUpper) {
        matches = true;
      }
      // Check if search ID is part of kavling name
      else if (rowKavling.includes(searchIdUpper)) {
        matches = true;
      }

      if (matches) {
        const timestamp = row[0];
        const fileName = row[2];
        const base64Data = row[3];
        const uploadedBy = row[4];
        const fileSizeKB = row[5];

        // Create data URL for frontend
        const dataUrl = `data:image/jpeg;base64,${base64Data}`;

        photos.push({
          id: index + 2,
          name: fileName,
          url: dataUrl,
          base64: base64Data.substring(0, 100) + '...',
          timestamp: timestamp,
          uploadedBy: uploadedBy,
          size: fileSizeKB + ' KB',
          searchId: rowSearchId,
          kavling: rowKavling,
          rowNumber: index + 2,
          matchesSearchId: rowSearchId === searchIdUpper
        });
      }
    });

    // Sort by timestamp (newest first)
    photos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    console.log(`Found ${photos.length} photos matching search ID: ${searchId}`);

    return {
      success: true,
      searchId: searchId,
      kavling: kavlingName,
      photos: photos,
      count: photos.length,
      exactMatchCount: photos.filter(p => p.matchesSearchId).length
    };

  } catch (error) {
    console.error('❌ Error getting revision photos by search ID from sheet:', error);
    logError('getRevisionPhotosBySearchIdFromSheet', error.toString(), { 
      searchId: searchId,
      kavling: kavlingName
    });
    return { 
      success: false, 
      message: 'Error: ' + error.toString() 
    };
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
  const idSuffix = (currentRole === 'user1' || currentRole === 'user2' || currentRole === 'user3' || currentRole === 'user4' || currentRole === 'user5') ? `User${currentRole.slice(-1)}` : '';
  const hiddenInput = taskItem.querySelector(`#tableKitchenInput${idSuffix}`) || taskItem.querySelector('#tableKitchenInput');

  const wasActive = button.classList.contains('active');

  // Reset semua tombol
  buttons.forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('data-active', 'false');
  });

  if (wasActive) {
    if (hiddenInput) hiddenInput.value = '';
  } else {
    // Aktifkan tombol yang diklik
    button.classList.add('active');
    button.setAttribute('data-active', 'true');
    if (hiddenInput) hiddenInput.value = option;
  }

  const rolePage = currentRole + 'Page';
  updateProgress(rolePage);
}

// ========== FUNGSI SAVE KEY DELIVERY ==========
function updateProgress(tahapSection) {
  const percent = calculateProgress(tahapSection);
  return percent;
}

function updateProgress(rolePage) {
    const pageElement = document.getElementById(rolePage);
    if (!pageElement) return;

    const progressSections = pageElement.querySelectorAll('.progress-section[data-tahap]');
    
    let totalWeight = 0;
    let completedWeight = 0;
    
    progressSections.forEach(section => {
        const tahap = section.getAttribute('data-tahap');
        const subTasks = section.querySelectorAll('.sub-task');
        
        subTasks.forEach(task => {
            // Skip hidden inputs dan textarea
            if (task.type === 'hidden' && !task.hasAttribute('data-weight') || 
                task.tagName === 'TEXTAREA' || 
                task.classList.contains('tahap-comments')) {
                return;
            }
            
            // Get weight (default = 1)
            const weight = parseFloat(task.getAttribute('data-weight')) || 1;
            
            // Count task
            totalWeight += weight;
            
            // Check completion
            let isCompleted = false;
            
            if (task.classList.contains('progress-slider')) {
                // Slider: dianggap complete jika >= 100%
                const value = parseInt(task.value) || 0;
                isCompleted = (value >= 100);
             }
            else if (task.type === 'checkbox') {
                // Checkbox: checked = complete
                isCompleted = task.checked;
            }
            else if (task.type === 'hidden' || task.type === 'text') {
                // Hidden/Text: ada value = complete
                isCompleted = (task.value && task.value.trim() !== '');
            }
            
            if (isCompleted) {
                completedWeight += weight;
            }
        });
    });
    
    // Hitung persentase overall
    let totalPercent = 0;
    if (totalWeight > 0) {
        totalPercent = Math.round((completedWeight / totalWeight) * 100);
    }
    
     // Update overall progress display
    updateTotalProgressDisplay(totalPercent + '%', rolePage);
    
    // Update setiap tahap progress bar
    progressSections.forEach(section => {
        const tahap = section.getAttribute('data-tahap');
        updateTahapProgressUI(section, tahap);
    });
    
    return totalPercent;
}

// ========== FUNGSI UPDATE TOTAL PROGRESS DISPLAY ==========
function updateTotalProgressDisplay(progress, pageId) {
    const pageElement = document.getElementById(pageId);
    if (!pageElement) return;

    const totalPercentEl = pageElement.querySelector('.total-percent');
    const totalBarEl = pageElement.querySelector('.total-bar');

    if (totalPercentEl) {
        totalPercentEl.textContent = progress;
    }

    if (totalBarEl) {
        // Parse persentase dari string
        let percentValue = 0;
        if (typeof progress === 'string') {
            const match = progress.match(/(\d+)%/);
            if (match) {
                percentValue = parseInt(match[1]);
            } else {
                percentValue = parseInt(progress) || 0;
            }
        } else if (typeof progress === 'number') {
            percentValue = progress;
        }
        
        totalBarEl.style.width = percentValue + '%';
        
        // Update color
        totalBarEl.className = 'total-bar';
        if (percentValue >= 89) totalBarEl.classList.add('bar-high');
        else if (percentValue >= 60) totalBarEl.classList.add('bar-medium');
        else if (percentValue >= 10) totalBarEl.classList.add('bar-low');
        else totalBarEl.classList.add('bar-very-low');
        
        console.log(`Total progress updated: ${percentValue}%`);
    }
}
function setupSliderProgressListeners() {
    console.log('🎯 Setting up slider progress listeners...');
    
    const user2Page = document.getElementById('user2Page');
    if (!user2Page) return;
    
    const sliders = user2Page.querySelectorAll('.progress-slider');
    
    sliders.forEach(slider => {
        // Hapus listener lama jika ada
        const newSlider = slider.cloneNode(true);
        slider.parentNode.replaceChild(newSlider, slider);
        
        newSlider.addEventListener('input', function() {
            //////console.log(`Slider ${this.getAttribute('data-task')} changed to ${this.value}%`);
            
            const tahapSection = this.closest('.progress-section');
            if (tahapSection) {
                const tahap = tahapSection.getAttribute('data-tahap');
                updateTahapProgressUI(tahapSection, tahap);
            }
        });
        
        newSlider.addEventListener('change', function() {
            ////console.log(`Slider ${this.getAttribute('data-task')} final value: ${this.value}%`);
        });
    });
    
    console.log(`✅ Setup ${sliders.length} slider listeners`);
}
// ========== FUNGSI WEIGHT DISTRIBUTION UNTUK USER2 ==========
function setupTaskWeightsForUser2() {
    console.log('⚖️ Setting up task weights for User2...');
    
    // Berikan weight yang berbeda untuk setiap task
    const weightMapping = {
        // === TAHAP 1 ===
        'LAND CLEARING': 2,
        'PONDASI': 3,
        'SLOOF': 3,
        'PAS.DDG S/D2 CANOPY': 2,
        'PAS.DDG S/D RING BLK': 2,
        'CONDUIT+INBOW DOOS': 1,
        'PIPA AIR KOTOR': 1,
        'PIPA AIR BERSIH': 1,
        'SISTEM PEMBUANGAN': 1,
        'PLESTER': 2,
        'ACIAN & BENANGAN': 2,
        'COR MEJA DAPUR': 1,
        
        // === TAHAP 2 ===
        'RANGKA ATAP': 3,
        'GENTENG': 2,
        'PLAFOND': 2,
        'KERAMIK DINDING TOILET & DAPUR': 1,
        'INSTALASI LISTRIK': 3,
        'KERAMIK LANTAI': 3,
        
        // === TAHAP 3 ===
        'KUSEN PINTU & JENDELA': 2,
        'DAUN PINTU & JENDELA': 2,
        'CAT DASAR + LAPIS AWAL': 2,
        'FITTING LAMPU': 1,
        'FIXTURE & SANITER': 2,
        'CAT FINISH INTERIOR': 2,
        'CAT FINISH EXTERIOR': 2,
        'BAK KONTROL & BATAS CARPORT': 1,
        'PAVING HALAMAN': 2,
        'METERAN LISTRIK': 1,
        'METERAN AIR': 1,
        'Konekting Air Bersih': 1,
        
        // === TAHAP 4 ===
        'Konekting Air Kotor': 1,
        'Gorong-gorong': 1,
        'Akses Jalan': 2,
        'GENERAL CLEANING': 3,
        'COMPLETION / Penyelesaian akhir': 5
    };
    
    // Apply weights ke semua tasks
    const user2Page = document.getElementById('user2Page');
    if (!user2Page) return;
    
    const allTasks = user2Page.querySelectorAll('.sub-task');
    
    allTasks.forEach(task => {
        const taskName = task.getAttribute('data-task');
        if (taskName && weightMapping[taskName]) {
            task.setAttribute('data-weight', weightMapping[taskName]);
            console.log(`Set weight for ${taskName}: ${weightMapping[taskName]}`);
        } else {
            // Default weight = 1
            task.setAttribute('data-weight', '1');
        }
    });
    
    console.log('✅ Task weights setup complete');
}

function calculateTahap4Progress() {
    const tahap4Section = document.querySelector('#user2Page .progress-section[data-tahap="4"]');
    if (!tahap4Section) return 0;
    
    const sliders = tahap4Section.querySelectorAll('.progress-slider');
    const completionCheckbox = tahap4Section.querySelector('input[type="checkbox"][data-task="COMPLETION / Penyelesaian akhir"]');
    const keyReturnRecipient = document.getElementById('keyReturnRecipientUser2');
    const keyReturnDate = document.getElementById('keyReturnDateUser2');
    
    let totalWeight = 0;
    let completedWeight = 0;
    
    // Sliders (weight = 1 each)
    sliders.forEach(slider => {
        totalWeight += 1;
        const value = parseInt(slider.value) || 0;
        completedWeight += (value / 100); // Convert % to decimal
    });
    
    // Completion checkbox (weight = 5)
    if (completionCheckbox) {
        totalWeight += 5;
        if (completionCheckbox.checked) {
            completedWeight += 5;
        }
    }
    
    // Key return info (weight = 2 each)
    if (keyReturnRecipient) {
        totalWeight += 2;
        if (keyReturnRecipient.value && keyReturnRecipient.value.trim() !== '') {
            completedWeight += 2;
        }
    }
    
    if (keyReturnDate) {
        totalWeight += 2;
        if (keyReturnDate.value) {
            completedWeight += 2;
        }
    }
    
    if (totalWeight > 0) {
        return Math.round((completedWeight / totalWeight) * 100);
    }
    
    return 0;
}
// ========== INTEGRASI DENGAN FUNGSI LAIN ==========
function setupUser2Complete() {
    console.log('🚀 Setting up complete User2 interface...');
    
    // Setup task weights
    setupTaskWeightsForUser2();
    
    // Setup sliders
    setupUser2ProgressSliders();
    
    // Setup slider progress listeners
    setupSliderProgressListeners();
    
    // Setup save buttons
    setupUser2SaveButtons();
    
    // Setup state buttons
    setupStateButtons('user2Page');
    
    // Setup checkbox listeners
    setupCheckboxListeners('user2Page');
    
    // Setup today buttons
    setupTodayButtons();
    
    // Setup auto progress update ketika slider berubah
    const user2Page = document.getElementById('user2Page');
    if (user2Page) {
        user2Page.addEventListener('input', function(e) {
            if (e.target.classList.contains('progress-slider') || 
                e.target.type === 'checkbox' || 
                e.target.classList.contains('sub-task')) {
                
                setTimeout(() => {
                    const tahapSection = e.target.closest('.progress-section');
                    if (tahapSection) {
                        const tahap = tahapSection.getAttribute('data-tahap');
                        updateTahapProgressUI(tahapSection, tahap);
                    }
                }, 100);
            }
        });
    }
    
    console.log('✅ User2 interface setup complete');
}

function updateSupervisorStagesUI(totalPercent, progressData = null) {
  const stages = [
    { id: 1, gridId: 'gridTahap1', tasks: ['LAND CLEARING', 'PONDASI', 'SLOOF', 'PAS.DDG S/D2 CANOPY', 'PAS.DDG S/D RING BLK', 'CONDUIT+INBOW DOOS', 'PIPA AIR KOTOR', 'PIPA AIR BERSIH', 'SISTEM PEMBUANGAN', 'PLESTER', 'ACIAN & BENANGAN', 'COR MEJA DAPUR'] },
    { id: 2, gridId: 'gridTahap2', tasks: ['RANGKA ATAP', 'GENTENG', 'PLAFOND', 'KERAMIK DINDING TOILET & DAPUR', 'INSTALASI LISTRIK', 'KERAMIK LANTAI'] },
    { id: 3, gridId: 'gridTahap3', tasks: ['KUSEN PINTU & JENDELA', 'DAUN PINTU & JENDELA', 'CAT DASAR + LAPIS AWAL', 'FITTING LAMPU', 'FIXTURE & SANITER', 'CAT FINISH INTERIOR', 'CAT FINISH EXTERIOR', 'BAK KONTROL & BATAS CARPORT', 'PAVING HALAMAN', 'METERAN LISTRIK', 'METERAN AIR', 'GENERAL CLEANING'] },
    { id: 4, gridId: 'gridTahap4', tasks: ['COMPLETION / Penyelesaian akhir'] }
  ];

  const taskDisplayNames = {
    'LAND CLEARING': 'Land Clearing',
    'PONDASI': 'Pondasi',
    'SLOOF': 'Sloof',
    'PAS.DDG S/D2 CANOPY': 'Pas.Ddg S/D Canopy',
    'PAS.DDG S/D RING BLK': 'Pas.Ddg S/D Ring Blk',
    'CONDUIT+INBOW DOOS': 'Conduit + Inbow Doos',
    'PIPA AIR KOTOR': 'Pipa Air Kotor',
    'PIPA AIR BERSIH': 'Pipa Air Bersih',
    'SISTEM PEMBUANGAN': 'Sistem Pembuangan',
    'PLESTER': 'Plester',
    'ACIAN & BENANGAN': 'Acian & Benangan',
    'COR MEJA DAPUR': 'Cor Meja Dapur',
    'RANGKA ATAP': 'Rangka Atap',
    'GENTENG': 'Genteng',
    'PLAFOND': 'Plafond',
    'KERAMIK DINDING TOILET & DAPUR': 'Keramik Dinding Toilet & Dapur',
    'INSTALASI LISTRIK': 'Instalasi Listrik',
    'KERAMIK LANTAI': 'Keramik Lantai',
    'KUSEN PINTU & JENDELA': 'Kusen Pintu & Jendela',
    'DAUN PINTU & JENDELA': 'Daun Pintu & Jendela',
    'CAT DASAR + LAPIS AWAL': 'Cat Dasar + Lapis Awal',
    'FITTING LAMPU': 'Fitting Lampu',
    'FIXTURE & SANITER': 'Fixture & Saniter',
    'CAT FINISH INTERIOR': 'Cat Finish Interior',
    'CAT FINISH EXTERIOR': 'Cat Finish Exterior',
    'BAK KONTROL & BATAS CARPORT': 'Bak Kontrol & Batas Carport',
    'PAVING HALAMAN': 'Paving Halaman',
    'METERAN LISTRIK': 'Meteran Listrik',
    'METERAN AIR': 'Meteran Air',
    'GENERAL CLEANING': 'General Cleaning',
    'COMPLETION / Penyelesaian akhir': 'Completion / Penyelesaian Akhir'
  };

  let t13_total = 0;
  let t13_completed = 0;
  let completionProgress = 0;
  let deliveryDateProgress = 0;

  stages.forEach(stage => {
    const gridEl = document.getElementById(stage.gridId);
    if (!gridEl) return;
    
    gridEl.innerHTML = '';
    
    let completedCount = 0;
    
    const specialTasks = ['SISTEM PEMBUANGAN', 'COR MEJA DAPUR', 'KERAMIK DINDING TOILET & DAPUR'];
    
    stage.tasks.forEach(taskName => {
      let taskValue = null;
      let isCompleted = false;
      
      if (progressData && progressData[`tahap${stage.id}`]) {
        taskValue = progressData[`tahap${stage.id}`][taskName];
        isCompleted = (taskValue === 'Selesai' || taskValue === true || taskValue === '100%' || 
                       (taskValue && taskValue !== '' && specialTasks.includes(taskName)));
      }
      
      if (isCompleted) completedCount++;
      
      if (stage.id === 1 || stage.id === 2 || stage.id === 3) {
        t13_total++;
        if (isCompleted) t13_completed++;
      }
      
      if (stage.id === 4 && taskName === 'COMPLETION / Penyelesaian akhir' && isCompleted) {
        completionProgress = 5;
      }
      
      const isSpecialTask = specialTasks.includes(taskName);
      
      if (isSpecialTask) {
        const taskContainer = document.createElement('div');
        taskContainer.className = 'supervisor-task-item-special' + (isCompleted ? ' task-completed' : '');
        taskContainer.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 6px 8px;
          background: ${isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(51, 65, 85, 0.5)'};
          border-radius: 4px;
          border: 1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'};
          font-size: 0.7rem;
          grid-column: span 2;
        `;
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'item-title';
        titleSpan.textContent = (taskDisplayNames[taskName] || taskName) + ' =';
        titleSpan.style.cssText = `
          color: #94a3b8;
          font-weight: 600;
        `;
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'item-value';
        valueSpan.style.cssText = `
          color: ${isCompleted ? '#10b981' : '#64748b'};
          font-weight: 500;
          padding: 3px 8px;
          background: rgba(0,0,0,0.2);
          border-radius: 3px;
          text-align: center;
        `;
        
        if (taskValue && taskValue !== '' && taskValue !== true && taskValue !== 'Selesai') {
          valueSpan.textContent = taskValue;
        } else {
          valueSpan.textContent = '- Belum dipilih -';
          valueSpan.style.color = '#64748b';
          valueSpan.style.fontStyle = 'italic';
        }
        
        taskContainer.appendChild(titleSpan);
        taskContainer.appendChild(valueSpan);
        gridEl.appendChild(taskContainer);
      } else {
        const taskLabel = document.createElement('label');
        taskLabel.className = 'supervisor-task-item' + (isCompleted ? ' task-completed' : '');
        taskLabel.style.cssText = `
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 6px;
          background: ${isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(51, 65, 85, 0.5)'};
          border-radius: 4px;
          border: 1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'};
          cursor: default;
          font-size: 0.7rem;
          color: ${isCompleted ? '#10b981' : '#94a3b8'};
          transition: all 0.2s ease;
        `;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isCompleted;
        checkbox.disabled = true;
        checkbox.style.cssText = `
          width: 14px;
          height: 14px;
          accent-color: #10b981;
          cursor: default;
          flex-shrink: 0;
        `;
        
        const labelText = document.createElement('span');
        labelText.textContent = taskDisplayNames[taskName] || taskName;
        labelText.style.cssText = `
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `;
        
        taskLabel.appendChild(checkbox);
        taskLabel.appendChild(labelText);
        gridEl.appendChild(taskLabel);
      }
    });
    
    const stagePercent = stage.tasks.length > 0 ? Math.round((completedCount / stage.tasks.length) * 100) : 0;
    const percentEl = document.getElementById(`supervisorTahap${stage.id}Percent`);
    if (percentEl) percentEl.textContent = stagePercent + '%';
    
    const checkEl = document.getElementById(`checkTahap${stage.id}`);
    if (checkEl) {
      checkEl.checked = stagePercent === 100;
      checkEl.disabled = true;
    }
  });
  
  if (progressData && progressData.tahap4 && progressData.tahap4['PENYERAHAN KUNCI'] && progressData.tahap4['PENYERAHAN KUNCI'].trim() !== '') {
    deliveryDateProgress = 1;
  }
  
  const gridTahap4 = document.getElementById('gridTahap4');
  if (gridTahap4 && progressData && progressData.tahap4) {
    const penyerahanKunci = progressData.tahap4['PENYERAHAN KUNCI'] || '';
    const tanggalPenyerahan = progressData.tahap4['TANGGAL_PENYERAHAN_KUNCI'] || '';
    
    const keyInfoContainer = document.createElement('div');
    keyInfoContainer.style.cssText = `
      grid-column: span 2;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px;
      background: rgba(56, 189, 248, 0.1);
      border-radius: 6px;
      border: 1px solid rgba(56, 189, 248, 0.3);
      margin-top: 6px;
    `;
    
    const keyTitle = document.createElement('div');
    keyTitle.style.cssText = 'font-size: 0.75rem; color: #38bdf8; font-weight: 600; margin-bottom: 4px;';
    keyTitle.innerHTML = '<i class="fas fa-key" style="margin-right: 6px;"></i>Info Penyerahan Kunci';
    keyInfoContainer.appendChild(keyTitle);
    
    const penyerahanRow = document.createElement('div');
    penyerahanRow.style.cssText = 'display: flex; justify-content: space-between; font-size: 0.7rem;';
    penyerahanRow.innerHTML = `
      <span style="color: #94a3b8;">Diserahkan Ke:</span>
      <span style="color: ${penyerahanKunci ? '#10b981' : '#64748b'}; font-weight: 500;">${penyerahanKunci || '- Belum diisi -'}</span>
    `;
    keyInfoContainer.appendChild(penyerahanRow);
    
    const tanggalRow = document.createElement('div');
    tanggalRow.style.cssText = 'display: flex; justify-content: space-between; font-size: 0.7rem;';
    let formattedDate = '- Belum diisi -';
    if (tanggalPenyerahan) {
      try {
        const dateObj = new Date(tanggalPenyerahan);
        formattedDate = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch(e) {
        formattedDate = tanggalPenyerahan;
      }
    }
    tanggalRow.innerHTML = `
      <span style="color: #94a3b8;">Tanggal Penyerahan Kunci dari Pelaksana:</span>
      <span style="color: ${tanggalPenyerahan ? '#10b981' : '#64748b'}; font-weight: 500;">${formattedDate}</span>
    `;
    keyInfoContainer.appendChild(tanggalRow);
    
    gridTahap4.appendChild(keyInfoContainer);
  }
  
  let tahap1_3_Progress = 0;
  if (t13_total > 0) {
    tahap1_3_Progress = (t13_completed / t13_total) * 94;
  }
  
  const supervisorTotalProgress = Math.round(tahap1_3_Progress + completionProgress + deliveryDateProgress);
  updateTotalProgressDisplay(supervisorTotalProgress + '%', 'managerPage');
}

// Update loadProgressData to also pass data to Supervisor UI
const originalLoadProgressData = loadProgressData;
loadProgressData = function(data) {
  originalLoadProgressData(data);
  if (currentRole === 'manager') {
    const totalPercent = parseInt(currentKavlingData.totalAH) || 0;
    updateSupervisorStagesUI(totalPercent, data);
  }
};

// Initial setup for supervisor stage checks
document.addEventListener('change', function(e) {
  if (e.target.classList.contains('supervisor-stage-check')) {
    calculateSupervisorOverallFromChecks();
  }
});

function calculateSupervisorOverallFromChecks() {
  const checks = [
    document.getElementById('checkTahap1'),
    document.getElementById('checkTahap2'),
    document.getElementById('checkTahap3'),
    document.getElementById('checkTahap4')
  ];
  let checkedCount = 0;
  checks.forEach(c => { if (c && c.checked) checkedCount++; });
  
  const newTotal = (checkedCount / checks.length) * 100;
  updateTotalProgressDisplay(newTotal + '%', 'managerPage');
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
console.log(`Image compressed: ${width}x${height}, Size: ${Math.round(compressedRevisionBase64.length * 0.75 / 1024)}KB`);
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

// PERBAIKI fungsi loadRevisionPhotosForPelaksana:
async function loadRevisionPhotosForPelaksana(kavling, role) {
  const galleryId = `revisionPhotoGallery${role.charAt(0).toUpperCase() + role.slice(1)}`;
  const gallery = document.getElementById(galleryId);
  if (!gallery) {
    console.error(`Gallery element ${galleryId} not found for role ${role}`);
    return;
  }

  // PERBAIKAN: Pattern matching yang lebih fleksibel
  let searchId = '';

  // Extract search ID dari nama kavling
  // Support berbagai format: M1_10, A2_25, BLOK M1, KAVLING A2, M1-10, dll
  const cleanKavling = kavling.replace(/\s+/g, '_').toUpperCase();

  // Cari pola angka dan huruf
  const pattern1 = /([A-Z]\d+)[_-]?(\d+)/i; // M1_10, A2-25, B3_100
  const pattern2 = /([A-Z]\d+)/i; // M1, A2, B3
  const pattern3 = /BLOK[_-]?([A-Z]\d+)/i; // BLOK M1, BLOK_A2
  const pattern4 = /KAVLING[_-]?([A-Z]\d+)/i; // KAVLING M1

  let match;
  if ((match = cleanKavling.match(pattern1))) {
    // Format: M1_10
    searchId = match[1] + '_' + match[2];
  } else if ((match = cleanKavling.match(pattern3))) {
    // Format: BLOK M1
    searchId = match[1];
  } else if ((match = cleanKavling.match(pattern4))) {
    // Format: KAVLING M1
    searchId = match[1];
  } else if ((match = cleanKavling.match(pattern2))) {
    // Format: M1
    searchId = match[1];
  } else {
    // Fallback: 5 karakter pertama
    searchId = kavling.substring(0, 5).toUpperCase();
  }

  console.log(`Loading revision photos for pelaksana: 
    Kavling: ${kavling}, 
    Clean: ${cleanKavling},
    Search ID: ${searchId}, 
    Role: ${role}`);

  // Tampilkan loading state
  gallery.innerHTML = `
    <div style="grid-column: span 2; text-align: center; color: #94a3b8; padding: 20px;">
      <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #334155; border-top: 4px solid #38bdf8; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
      <div>Memuat foto revisi untuk ${kavling}...</div>
      <div style="font-size: 0.8rem; color: #64748b; margin-top: 5px;">
        Search ID: "${searchId}"
      </div>
    </div>
  `;

  try {
    const response = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getRevisionPhotosBySearchId',
      searchId: searchId,
      kavling: kavling,
      role: role
    });

    gallery.innerHTML = '';

    if (response.success && response.photos && response.photos.length > 0) {
      // Tampilkan semua foto
      response.photos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'border-radius: 12px; overflow: hidden; border: 2px solid #334155; position: relative; aspect-ratio: 1; background: #0f172a; transition: transform 0.2s;';

        item.innerHTML = `
          <img src="${photo.url}" 
               style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" 
               onclick="window.open('${photo.viewUrl || photo.url}', '_blank')"
               loading="lazy"
               onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"300\" viewBox=\"0 0 400 300\"><rect width=\"400\" height=\"300\" fill=\"%231e293b\"/><text x=\"200\" y=\"150\" font-family=\"Arial\" font-size=\"16\" fill=\"%2394a3b8\" text-anchor=\"middle\" dy=\".3em\">Gambar tidak dapat dimuat</text></svg>';"
               alt="Foto revisi ${photo.name}">

          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; font-size: 0.75rem; padding: 5px; text-align: center; backdrop-filter: blur(4px);">
            ${photo.name}
          </div>

          <div style="position: absolute; top: 5px; right: 5px; background: rgba(59, 130, 246, 0.9); color: white; font-size: 0.65rem; padding: 2px 6px; border-radius: 10px; font-weight: bold;">
            ${index + 1}
          </div>

          <div style="position: absolute; bottom: 30px; right: 5px; background: rgba(0,0,0,0.6); color: #cbd5e1; font-size: 0.6rem; padding: 2px 5px; border-radius: 4px;">
            ${photo.size || 'N/A'}
          </div>
        `;

        // Hover effect
        item.addEventListener('mouseenter', () => {
          item.style.transform = 'scale(1.02)';
          item.style.borderColor = '#38bdf8';
        });

        item.addEventListener('mouseleave', () => {
          item.style.transform = 'scale(1)';
          item.style.borderColor = '#334155';
        });

        gallery.appendChild(item);
      });

      // Tambahkan info
      const infoDiv = document.createElement('div');
      infoDiv.style.cssText = 'grid-column: span 2; text-align: center; color: #38bdf8; padding: 10px; font-size: 0.9rem;';
      infoDiv.innerHTML = `<i class="fas fa-images"></i> Ditemukan ${response.count} foto untuk "${kavling}"`;
      gallery.appendChild(infoDiv);

    } else {
      // Tidak ada foto
      gallery.innerHTML = `
        <div style="grid-column: span 2; text-align: center; color: #94a3b8; padding: 20px; border: 2px dashed #334155; border-radius: 12px;">
          <i class="fas fa-images" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #64748b;"></i>
          <div style="margin-bottom: 10px; font-size: 0.9rem;">Tidak ada foto revisi untuk "${kavling}"</div>
          <div style="font-size: 0.8rem; color: #64748b;">
            <div>Search ID yang digunakan: "${searchId}"</div>
            <div style="margin-top: 5px;">Foto akan muncul setelah supervisor upload foto untuk kavling ini</div>
          </div>
        </div>`;
    }
  } catch (error) {
    console.error('Error loading photos for pelaksana:', error);
    gallery.innerHTML = `
      <div style="grid-column: span 2; text-align: center; color: #f43f5e; padding: 20px; border: 2px dashed #dc2626; border-radius: 12px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
        <div style="margin-bottom: 10px;">Gagal memuat foto</div>
        <div style="font-size: 0.8rem; color: #fca5a5;">Error: ${error.message || 'Tidak dapat terhubung ke server'}</div>
      </div>`;
  }
}

// GANTI fungsi savePropertyDataManager() dengan ini:
// Tambahkan fungsi compressImage:
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
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

        // Compress to JPEG with 70% quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


async function uploadRevisionPhoto() {
  if (!selectedKavling) {
    showToast('error', 'Pilih kavling terlebih dahulu');
    return;
  }

  if (!compressedRevisionBase64) {
    showToast('warning', 'Pilih dan kompres foto terlebih dahulu');
    return;
  }

  showGlobalLoading('Mengupload foto revisi...');

  try {
    // Ambil hanya data base64 tanpa header data:image/jpeg;base64,
    const base64Data = compressedRevisionBase64.split(',')[1];
    
    const response = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'uploadRevisionPhoto',
      kavlingName: selectedKavling,
      image: base64Data,
      uploadedBy: sessionStorage.getItem('loggedDisplayName') || currentRole || 'Supervisor'
    });

    if (response.success) {
      showToast('success', 'Foto revisi berhasil diupload ke Spreadsheet');
      cancelRevisionPhoto(); 
      
      // Refresh gallery
      if (typeof loadRevisionPhotosForPelaksana === 'function') {
        loadRevisionPhotosForPelaksana(selectedKavling, currentRole);
      }
    } else {
      showToast('error', 'Gagal upload: ' + (response.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error uploading revision photo:', error);
    showToast('error', 'Terjadi kesalahan saat upload: ' + error.message);
  } finally {
    hideGlobalLoading();
  }
}

async function getRevisionPhotosFromSheet(kavlingName) {
  try {
    const response = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getRevisionPhotos',
      kavlingName: kavlingName
    });
    return response;
  } catch (error) {
    console.error('Error fetching revision photos:', error);
    return { success: false, message: error.toString() };
  }
}

// Helper function untuk membuat gallery item
function createPhotoGalleryItem(photo, index, isExactMatch) {
  const item = document.createElement('div');
  item.style.cssText = 'border-radius: 12px; overflow: hidden; border: 2px solid #334155; position: relative; aspect-ratio: 1; background: #0f172a; transition: transform 0.2s, border-color 0.2s;';
  item.classList.add('photo-gallery-item');
  
  item.innerHTML = `
    <img src="${photo.url}" 
         style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" 
         onclick="window.open('${photo.viewUrl || photo.url}', '_blank')"
         loading="lazy"
         onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"300\" viewBox=\"0 0 400 300\"><rect width=\"400\" height=\"300\" fill=\"%231e293b\"/><text x=\"200\" y=\"150\" font-family=\"Arial\" font-size=\"16\" fill=\"%2394a3b8\" text-anchor=\"middle\" dy=\".3em\">Gambar tidak dapat dimuat</text></svg>';"
         alt="Foto revisi ${photo.name}">
    
    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; font-size: 0.75rem; padding: 5px; text-align: center; backdrop-filter: blur(4px);">
      ${photo.name}
    </div>
    
    <div style="position: absolute; top: 5px; right: 5px; background: ${isExactMatch ? 'rgba(34, 197, 94, 0.9)' : 'rgba(234, 179, 8, 0.9)'}; color: white; font-size: 0.65rem; padding: 2px 6px; border-radius: 10px; font-weight: bold;">
      ${index}
    </div>
    
    ${isExactMatch ? 
      `<div style="position: absolute; top: 5px; left: 5px; background: rgba(34, 197, 94, 0.9); color: white; font-size: 0.6rem; padding: 2px 5px; border-radius: 8px;">
        Exact
      </div>` : ''
    }
    
    <div style="position: absolute; bottom: 30px; right: 5px; background: rgba(0,0,0,0.6); color: #cbd5e1; font-size: 0.6rem; padding: 2px 5px; border-radius: 4px;">
      ${photo.size || 'N/A'}
    </div>
  `;
  
  // Tambahkan hover effect
  item.addEventListener('mouseenter', () => {
    item.style.transform = 'scale(1.02)';
    item.style.borderColor = isExactMatch ? '#22c55e' : '#eab308';
  });
  
  item.addEventListener('mouseleave', () => {
    item.style.transform = 'scale(1)';
    item.style.borderColor = '#334155';
  });
  
  return item;
}

// Fungsi load revision photos untuk manager
async function loadRevisionPhotos(kavling) {
  const gallery = document.getElementById('revisionPhotoGallery');
  if (!gallery) return;
  
  // Clear gallery dengan loading state
  gallery.innerHTML = `
    <div style="grid-column: span 2; text-align: center; color: #94a3b8; padding: 20px;">
      <div class="spinner" style="width: 30px; height: 30px; border: 3px solid #334155; border-top: 3px solid #38bdf8; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
      Memuat foto revisi...
    </div>
  `;
  
  try {
    const response = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
      action: 'getRevisionPhotos',
      kavling: kavling
    });
    
    gallery.innerHTML = '';
    
    if (response.success && response.photos && response.photos.length > 0) {
      // Sort by date (newest first)
      const sortedPhotos = response.photos.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      sortedPhotos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'border-radius: 8px; overflow: hidden; border: 1px solid #334155; position: relative; aspect-ratio: 1; transition: transform 0.2s;';
        item.classList.add('photo-item');
        
        item.innerHTML = `
          <img src="${photo.url}" 
               style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" 
               onclick="window.open('${photo.viewUrl || photo.url}', '_blank')"
               loading="lazy"
               onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"300\" viewBox=\"0 0 400 300\"><rect width=\"400\" height=\"300\" fill=\"%231e293b\"/><text x=\"200\" y=\"150\" font-family=\"Arial\" font-size=\"16\" fill=\"%2394a3b8\" text-anchor=\"middle\" dy=\".3em\">Gambar tidak dapat dimuat</text></svg>';"
               alt="Foto revisi ${photo.name}">
          
          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.5); color: white; font-size: 0.7rem; padding: 3px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${photo.name}
          </div>
          
          <div style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; font-size: 0.6rem; padding: 1px 4px; border-radius: 8px;">
            ${index + 1}
          </div>
        `;
        
        // Hover effect
        item.addEventListener('mouseenter', () => {
          item.style.transform = 'scale(1.03)';
          item.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        });
        
        item.addEventListener('mouseleave', () => {
          item.style.transform = 'scale(1)';
          item.style.boxShadow = 'none';
        });
        
        gallery.appendChild(item);
      });
    }
  } catch (error) {
    console.error('Error loading photos:', error);
    gallery.innerHTML = '<div style="grid-column: span 2; text-align: center; color: #f43f5e; padding: 10px;">Gagal memuat foto</div>';
  }
}

// Fungsi untuk refresh summary
async function refreshSummary() {
    await loadSummaryReport();
    showToast('success', 'Laporan berhasil direfresh');
}

// Fungsi untuk download full report
async function downloadFullReport() {
    showGlobalLoading('Menyiapkan laporan...');
    try {
        const response = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
            action: 'downloadFullReport'
        });
        // Implementasi download
    } catch (error) {
        showToast('error', 'Gagal download: ' + error.message);
    } finally {
        hideGlobalLoading();
    }
}

// Fungsi load utilitas data
async function loadUtilitasData() {
    if (!selectedKavling) return;

    try {
        const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
            action: 'getUtilitasData',
            kavling: selectedKavling
        });

        if (result.success) {
            // Update UI dengan data utilitas
            console.log('Utilitas data loaded:', result);
        }
    } catch (error) {
        console.error('Error loading utilitas:', error);
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

async function loadSupervisorHandoverData(kavlingName) {
    if (!kavlingName) return;
    
    try {
        // GUNAKAN URL YANG SUDAH ADA
        const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
            action: 'getHandoverData',
            kavling: kavlingName
        });
        
        if (result.success && result.handoverData) {
            const ho = result.handoverData;
            document.getElementById('supervisorHODari').textContent = ho.dariPelaksana || '-';
            document.getElementById('supervisorHOUser').textContent = ho.keUser || '-';
            document.getElementById('supervisorHOTanggal').textContent = ho.tanggal || '-';
            
            // Isi juga input edit
            document.getElementById('inputSupervisorHODari').value = ho.dariPelaksana || '';
            document.getElementById('inputSupervisorHOKe').value = ho.keUser || '';
            document.getElementById('inputSupervisorHOTgl').value = ho.tanggal || '';
            
            console.log('✅ Supervisor handover data loaded:', ho);
        } else {
            console.log('ℹ️ No handover data found for', kavlingName);
        }
    } catch (error) {
        console.error('❌ Error loading supervisor handover:', error);
    }
}

function toggleSupervisorHOEditMode(isEdit) {
    const displayMode = document.getElementById('supervisorHODisplayMode');
    const editMode = document.getElementById('supervisorHOEditMode');
    
    if (isEdit) {
        displayMode.style.display = 'none';
        editMode.style.display = 'block';
    } else {
        editMode.style.display = 'none';
        displayMode.style.display = 'block';
    }
}

async function saveSupervisorHandoverData() {
    if (!selectedKavling) {
        showToast('warning', 'Pilih kavling terlebih dahulu!');
        return;
    }
    
    const dari = document.getElementById('inputSupervisorHODari').value.trim();
    const ke = document.getElementById('inputSupervisorHOKe').value.trim();
    const tgl = document.getElementById('inputSupervisorHOTgl').value.trim();
    
    if (!dari || !ke) {
        showToast('warning', 'Nama pemberi dan penerima harus diisi!');
        return;
    }
    
    showGlobalLoading('Menyimpan data HandOver Kunci...');
    
    try {
        // GUNAKAN URL YANG SUDAH ADA
        const result = await getDataFromServer(PROGRESS_APPS_SCRIPT_URL, {
            action: 'saveHandoverKunci',
            kavling: selectedKavling,
            tglHandover: tgl,
            dariPelaksana: dari,
            keUser: ke
        });
        
        if (result.success) {
            showToast('success', 'Data HandOver Kunci berhasil disimpan!');
            
            // Refresh data handover
            await loadSupervisorHandoverData(selectedKavling);
            
            // Kembali ke mode display
            toggleSupervisorHOEditMode(false);
            
            console.log('✅ Supervisor handover saved:', { dari, ke, tgl });
        } else {
            showToast('error', 'Gagal menyimpan: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('❌ Error saving supervisor handover:', error);
        showToast('error', 'Error: ' + error.message);
    } finally {
        hideGlobalLoading();
    }
}

function resetSupervisorHOSection() {
  const btnContainer = document.getElementById('supervisorHOBtnContainer');
  const displayMode = document.getElementById('supervisorHODisplayMode');
  const editMode = document.getElementById('supervisorHOEditMode');
  const loadingEl = document.getElementById('supervisorHOLoading');
  
  if (btnContainer) btnContainer.style.display = 'block';
  if (displayMode) displayMode.style.display = 'none';
  if (editMode) editMode.style.display = 'none';
  if (loadingEl) loadingEl.style.display = 'none';
  
  // Clear values
  const hoUserEl = document.getElementById('supervisorHOUser');
  const hoDariEl = document.getElementById('supervisorHODari');
  const hoTanggalEl = document.getElementById('supervisorHOTanggal');
  if (hoUserEl) hoUserEl.textContent = '-';
  if (hoDariEl) hoDariEl.textContent = '-';
  if (hoTanggalEl) hoTanggalEl.textContent = '-';
  
  // Clear inputs
  const inputDari = document.getElementById('inputSupervisorHODari');
  const inputKe = document.getElementById('inputSupervisorHOKe');
  const inputTgl = document.getElementById('inputSupervisorHOTgl');
  if (inputDari) inputDari.value = '';
  if (inputKe) inputKe.value = '';
  if (inputTgl) inputTgl.value = '';
}

// ========== USER2 PROGRESS SLIDER FUNCTIONALITY ==========
const SNAP_POINTS = [30, 50, 70, 100];
const SNAP_THRESHOLD = 5;

function snapToPoint(value) {
  for (const point of SNAP_POINTS) {
    if (Math.abs(value - point) <= SNAP_THRESHOLD) {
      return point;
    }
  }
  return value;
}

function updateSnapMarkers(sliderContainer, value) {
  const markers = sliderContainer.querySelectorAll('.snap-marker');
  markers.forEach(marker => {
    const markerValue = parseInt(marker.getAttribute('data-value'));
    if (markerValue === value) {
      marker.classList.add('active');
    } else {
      marker.classList.remove('active');
    }
  });
}
// ========== FUNGSI SETUP SLIDER UNTUK USER2  ==========
function setupUser2ProgressSliders() {
    console.log('🎚️ Setting up ALL User2 progress sliders...');
    
    // Daftar SEMUA slider yang ada di HTML User2 (sesuai dengan ID di HTML)
    const sliders = [
        // === TAHAP 1 ===
        { sliderId: 'landClearingSliderUser2', percentId: 'landClearingPercentUser2', trackId: 'landClearingTrackUser2', hiddenId: 'landClearingInputUser2', task: 'LAND CLEARING' },
        { sliderId: 'pondasiSliderUser2', percentId: 'pondasiPercentUser2', trackId: 'pondasiTrackUser2', hiddenId: 'pondasiInputUser2', task: 'PONDASI' },
        { sliderId: 'sloofSliderUser2', percentId: 'sloofPercentUser2', trackId: 'sloofTrackUser2', hiddenId: 'sloofInputUser2', task: 'SLOOF' },
        { sliderId: 'pasDdgCanopySliderUser2', percentId: 'pasDdgCanopyPercentUser2', trackId: 'pasDdgCanopyTrackUser2', hiddenId: 'pasDdgCanopyInputUser2', task: 'PAS.DDG S/D2 CANOPY' },
        { sliderId: 'pasDdgRingBlkSliderUser2', percentId: 'pasDdgRingBlkPercentUser2', trackId: 'pasDdgRingBlkTrackUser2', hiddenId: 'pasDdgRingBlkInputUser2', task: 'PAS.DDG S/D RING BLK' },
        { sliderId: 'conduitSliderUser2', percentId: 'conduitPercentUser2', trackId: 'conduitTrackUser2', hiddenId: 'conduitInputUser2', task: 'CONDUIT+INBOW DOOS' },
        { sliderId: 'pipaAirKotorSliderUser2', percentId: 'pipaAirKotorPercentUser2', trackId: 'pipaAirKotorTrackUser2', hiddenId: 'pipaAirKotorInputUser2', task: 'PIPA AIR KOTOR' },
        { sliderId: 'pipaAirBersihSliderUser2', percentId: 'pipaAirBersihPercentUser2', trackId: 'pipaAirBersihTrackUser2', hiddenId: 'pipaAirBersihInputUser2', task: 'PIPA AIR BERSIH' },
        { sliderId: 'plesterSliderUser2', percentId: 'plesterPercentUser2', trackId: 'plesterTrackUser2', hiddenId: 'plesterInputUser2', task: 'PLESTER' },
        { sliderId: 'acianBenSliderUser2', percentId: 'acianBenPercentUser2', trackId: 'acianBenTrackUser2', hiddenId: 'acianBenInputUser2', task: 'ACIAN & BENANGAN' },
        
        // === TAHAP 2 ===
        { sliderId: 'rangkaAtapSliderUser2', percentId: 'rangkaAtapPercentUser2', trackId: 'rangkaAtapTrackUser2', hiddenId: 'rangkaAtapInputUser2', task: 'RANGKA ATAP' },
        { sliderId: 'gentengSliderUser2', percentId: 'gentengPercentUser2', trackId: 'gentengTrackUser2', hiddenId: 'gentengInputUser2', task: 'GENTENG' },
        { sliderId: 'plafondSliderUser2', percentId: 'plafondPercentUser2', trackId: 'plafondTrackUser2', hiddenId: 'plafondInputUser2', task: 'PLAFOND' },
        { sliderId: 'instalasiListrikSliderUser2', percentId: 'instalasiListrikPercentUser2', trackId: 'instalasiListrikTrackUser2', hiddenId: 'instalasiListrikInputUser2', task: 'INSTALASI LISTRIK' },
        { sliderId: 'keramikLantaiSliderUser2', percentId: 'keramikLantaiPercentUser2', trackId: 'keramikLantaiTrackUser2', hiddenId: 'keramikLantaiInputUser2', task: 'KERAMIK LANTAI' },
        
        // === TAHAP 3 ===
        { sliderId: 'kusenSliderUser2', percentId: 'kusenPercentUser2', trackId: 'kusenTrackUser2', hiddenId: 'kusenInputUser2', task: 'KUSEN PINTU & JENDELA' },
        { sliderId: 'daunPintuSliderUser2', percentId: 'daunPintuPercentUser2', trackId: 'daunPintuTrackUser2', hiddenId: 'daunPintuInputUser2', task: 'DAUN PINTU & JENDELA' },
        { sliderId: 'catDasarSliderUser2', percentId: 'catDasarPercentUser2', trackId: 'catDasarTrackUser2', hiddenId: 'catDasarInputUser2', task: 'CAT DASAR + LAPIS AWAL' },
        { sliderId: 'fittingLampuSliderUser2', percentId: 'fittingLampuPercentUser2', trackId: 'fittingLampuTrackUser2', hiddenId: 'fittingLampuInputUser2', task: 'FITTING LAMPU' },
        { sliderId: 'fixtureSaniterSliderUser2', percentId: 'fixtureSaniterPercentUser2', trackId: 'fixtureSaniterTrackUser2', hiddenId: 'fixtureSaniterInputUser2', task: 'FIXTURE & SANITER' },
        { sliderId: 'catInteriorSliderUser2', percentId: 'catInteriorPercentUser2', trackId: 'catInteriorTrackUser2', hiddenId: 'catInteriorInputUser2', task: 'CAT FINISH INTERIOR' },
        { sliderId: 'catExteriorSliderUser2', percentId: 'catExteriorPercentUser2', trackId: 'catExteriorTrackUser2', hiddenId: 'catExteriorInputUser2', task: 'CAT FINISH EXTERIOR' },
        { sliderId: 'bakKontrolSliderUser2', percentId: 'bakKontrolPercentUser2', trackId: 'bakKontrolTrackUser2', hiddenId: 'bakKontrolInputUser2', task: 'BAK KONTROL & BATAS CARPORT' },
        { sliderId: 'pavingHalamanSliderUser2', percentId: 'pavingHalamanPercentUser2', trackId: 'pavingHalamanTrackUser2', hiddenId: 'pavingHalamanInputUser2', task: 'PAVING HALAMAN' },
        { sliderId: 'meteranListrikSliderUser2', percentId: 'meteranListrikPercentUser2', trackId: 'meteranListrikTrackUser2', hiddenId: 'meteranListrikInputUser2', task: 'METERAN LISTRIK' },
        { sliderId: 'meteranAirSliderUser2', percentId: 'meteranAirPercentUser2', trackId: 'meteranAirTrackUser2', hiddenId: 'meteranAirInputUser2', task: 'METERAN AIR' },
        { sliderId: 'konektingBersihSliderUser2', percentId: 'konektingBersihPercentUser2', trackId: 'konektingBersihTrackUser2', hiddenId: 'konektingBersihInputUser2', task: 'Konekting Air Bersih' },
        
        // === TAHAP 4 ===
        { sliderId: 'konektingKotorSliderUser2', percentId: 'konektingKotorPercentUser2', trackId: 'konektingKotorTrackUser2', hiddenId: 'konektingKotorInputUser2', task: 'Konekting Air Kotor' },
        { sliderId: 'gorongGorongSliderUser2', percentId: 'gorongGorongPercentUser2', trackId: 'gorongGorongTrackUser2', hiddenId: 'gorongGorongInputUser2', task: 'Gorong-gorong' },
        { sliderId: 'aksesJalanSliderUser2', percentId: 'aksesJalanPercentUser2', trackId: 'aksesJalanTrackUser2', hiddenId: 'aksesJalanInputUser2', task: 'Akses Jalan' },
        { sliderId: 'generalCleaningSliderUser2', percentId: 'generalCleaningPercentUser2', trackId: 'generalCleaningTrackUser2', hiddenId: 'generalCleaningInputUser2', task: 'GENERAL CLEANING' }
    ];
    
    let setupCount = 0;
    let failedCount = 0;
    
    sliders.forEach(config => {
        const slider = document.getElementById(config.sliderId);
        const percentBox = document.getElementById(config.percentId);
        const trackFill = document.getElementById(config.trackId);
        const hiddenInput = document.getElementById(config.hiddenId);
        const sliderContainer = slider ? slider.closest('.slider-container') : null;
        const checkbox100 = document.querySelector(`input.check-100[data-slider="${config.sliderId}"]`);
        
        if (!slider || !percentBox || !trackFill) {
            console.log(`⚠️ Slider elements not found for ${config.task}: ${config.sliderId}, ${config.percentId}, ${config.trackId}`);
            failedCount++;
            return;
        }
        
        console.log(`✅ Setting up slider for ${config.task}: ${config.sliderId}`);
        
        const updateSliderUI = (value, updateCheckbox = true) => {
            const numValue = parseInt(value) || 0;
            percentBox.textContent = numValue + '%';
            trackFill.style.width = numValue + '%';
            
            if (hiddenInput) {
                hiddenInput.value = numValue > 0 ? numValue + '%' : '';
            }
            
            if (sliderContainer) {
                updateSnapMarkers(sliderContainer, numValue);
            }
            
            if (updateCheckbox && checkbox100) {
                checkbox100.checked = (numValue === 100);
            }
            
            // Update progress per tahap
            const tahapSection = slider.closest('.progress-section');
            if (tahapSection) {
                const tahap = tahapSection.getAttribute('data-tahap');
                updateTahapProgressUI(tahapSection, tahap);
            }
            
            // Update overall progress
            const pageId = currentRole + 'Page';
            updateProgress(pageId);
        };
        
        // Setup input event listener
        slider.addEventListener('input', function() {
            updateSliderUI(this.value);
        });
        
        // Setup change event listener for snap
        slider.addEventListener('change', function() {
            const snappedValue = snapToPoint(parseInt(this.value));
            if (snappedValue !== parseInt(this.value)) {
                this.value = snappedValue;
                updateSliderUI(snappedValue);
            }
        });
        
        // Setup checkbox 100% listener
        if (checkbox100) {
            checkbox100.addEventListener('change', function() {
                if (this.checked) {
                    slider.value = 100;
                    updateSliderUI(100, false);
                } else {
                    slider.value = 0;
                    updateSliderUI(0, false);
                }
            });
        }
        
        // Initialize UI dengan nilai default
        updateSliderUI(slider.value, false);
        setupCount++;
    });
    
    console.log(`✅ User2 sliders setup complete: ${setupCount} sliders setup, ${failedCount} failed`);
}

// ========== FUNGSI UPDATE SLIDER DARI DATABASE (DIPERBAIKI) ==========
function updateUser2SliderFromDB(task, value) {
    const sliderMapping = {
        // === TAHAP 1 ===
        'LAND CLEARING': { sliderId: 'landClearingSliderUser2', percentId: 'landClearingPercentUser2', trackId: 'landClearingTrackUser2', hiddenId: 'landClearingInputUser2' },
        'PONDASI': { sliderId: 'pondasiSliderUser2', percentId: 'pondasiPercentUser2', trackId: 'pondasiTrackUser2', hiddenId: 'pondasiInputUser2' },
        'SLOOF': { sliderId: 'sloofSliderUser2', percentId: 'sloofPercentUser2', trackId: 'sloofTrackUser2', hiddenId: 'sloofInputUser2' },
        'PAS.DDG S/D2 CANOPY': { sliderId: 'pasDdgCanopySliderUser2', percentId: 'pasDdgCanopyPercentUser2', trackId: 'pasDdgCanopyTrackUser2', hiddenId: 'pasDdgCanopyInputUser2' },
        'PAS.DDG S/D RING BLK': { sliderId: 'pasDdgRingBlkSliderUser2', percentId: 'pasDdgRingBlkPercentUser2', trackId: 'pasDdgRingBlkTrackUser2', hiddenId: 'pasDdgRingBlkInputUser2' },
        'CONDUIT+INBOW DOOS': { sliderId: 'conduitSliderUser2', percentId: 'conduitPercentUser2', trackId: 'conduitTrackUser2', hiddenId: 'conduitInputUser2' },
        'PIPA AIR KOTOR': { sliderId: 'pipaAirKotorSliderUser2', percentId: 'pipaAirKotorPercentUser2', trackId: 'pipaAirKotorTrackUser2', hiddenId: 'pipaAirKotorInputUser2' },
        'PIPA AIR BERSIH': { sliderId: 'pipaAirBersihSliderUser2', percentId: 'pipaAirBersihPercentUser2', trackId: 'pipaAirBersihTrackUser2', hiddenId: 'pipaAirBersihInputUser2' },
        'PLESTER': { sliderId: 'plesterSliderUser2', percentId: 'plesterPercentUser2', trackId: 'plesterTrackUser2', hiddenId: 'plesterInputUser2' },
        'ACIAN & BENANGAN': { sliderId: 'acianBenSliderUser2', percentId: 'acianBenPercentUser2', trackId: 'acianBenTrackUser2', hiddenId: 'acianBenInputUser2' },
        
        // === TAHAP 2 ===
        'RANGKA ATAP': { sliderId: 'rangkaAtapSliderUser2', percentId: 'rangkaAtapPercentUser2', trackId: 'rangkaAtapTrackUser2', hiddenId: 'rangkaAtapInputUser2' },
        'GENTENG': { sliderId: 'gentengSliderUser2', percentId: 'gentengPercentUser2', trackId: 'gentengTrackUser2', hiddenId: 'gentengInputUser2' },
        'PLAFOND': { sliderId: 'plafondSliderUser2', percentId: 'plafondPercentUser2', trackId: 'plafondTrackUser2', hiddenId: 'plafondInputUser2' },
        'INSTALASI LISTRIK': { sliderId: 'instalasiListrikSliderUser2', percentId: 'instalasiListrikPercentUser2', trackId: 'instalasiListrikTrackUser2', hiddenId: 'instalasiListrikInputUser2' },
        'KERAMIK LANTAI': { sliderId: 'keramikLantaiSliderUser2', percentId: 'keramikLantaiPercentUser2', trackId: 'keramikLantaiTrackUser2', hiddenId: 'keramikLantaiInputUser2' },
        
        // === TAHAP 3 ===
        'KUSEN PINTU & JENDELA': { sliderId: 'kusenSliderUser2', percentId: 'kusenPercentUser2', trackId: 'kusenTrackUser2', hiddenId: 'kusenInputUser2' },
        'DAUN PINTU & JENDELA': { sliderId: 'daunPintuSliderUser2', percentId: 'daunPintuPercentUser2', trackId: 'daunPintuTrackUser2', hiddenId: 'daunPintuInputUser2' },
        'CAT DASAR + LAPIS AWAL': { sliderId: 'catDasarSliderUser2', percentId: 'catDasarPercentUser2', trackId: 'catDasarTrackUser2', hiddenId: 'catDasarInputUser2' },
        'FITTING LAMPU': { sliderId: 'fittingLampuSliderUser2', percentId: 'fittingLampuPercentUser2', trackId: 'fittingLampuTrackUser2', hiddenId: 'fittingLampuInputUser2' },
        'FIXTURE & SANITER': { sliderId: 'fixtureSaniterSliderUser2', percentId: 'fixtureSaniterPercentUser2', trackId: 'fixtureSaniterTrackUser2', hiddenId: 'fixtureSaniterInputUser2' },
        'CAT FINISH INTERIOR': { sliderId: 'catInteriorSliderUser2', percentId: 'catInteriorPercentUser2', trackId: 'catInteriorTrackUser2', hiddenId: 'catInteriorInputUser2' },
        'CAT FINISH EXTERIOR': { sliderId: 'catExteriorSliderUser2', percentId: 'catExteriorPercentUser2', trackId: 'catExteriorTrackUser2', hiddenId: 'catExteriorInputUser2' },
        'BAK KONTROL & BATAS CARPORT': { sliderId: 'bakKontrolSliderUser2', percentId: 'bakKontrolPercentUser2', trackId: 'bakKontrolTrackUser2', hiddenId: 'bakKontrolInputUser2' },
        'PAVING HALAMAN': { sliderId: 'pavingHalamanSliderUser2', percentId: 'pavingHalamanPercentUser2', trackId: 'pavingHalamanTrackUser2', hiddenId: 'pavingHalamanInputUser2' },
        'METERAN LISTRIK': { sliderId: 'meteranListrikSliderUser2', percentId: 'meteranListrikPercentUser2', trackId: 'meteranListrikTrackUser2', hiddenId: 'meteranListrikInputUser2' },
        'METERAN AIR': { sliderId: 'meteranAirSliderUser2', percentId: 'meteranAirPercentUser2', trackId: 'meteranAirTrackUser2', hiddenId: 'meteranAirInputUser2' },
        'Konekting Air Bersih': { sliderId: 'konektingBersihSliderUser2', percentId: 'konektingBersihPercentUser2', trackId: 'konektingBersihTrackUser2', hiddenId: 'konektingBersihInputUser2' },
        
        // === TAHAP 4 ===
        'Konekting Air Kotor': { sliderId: 'konektingKotorSliderUser2', percentId: 'konektingKotorPercentUser2', trackId: 'konektingKotorTrackUser2', hiddenId: 'konektingKotorInputUser2' },
        'Gorong-gorong': { sliderId: 'gorongGorongSliderUser2', percentId: 'gorongGorongPercentUser2', trackId: 'gorongGorongTrackUser2', hiddenId: 'gorongGorongInputUser2' },
        'Akses Jalan': { sliderId: 'aksesJalanSliderUser2', percentId: 'aksesJalanPercentUser2', trackId: 'aksesJalanTrackUser2', hiddenId: 'aksesJalanInputUser2' },
        'GENERAL CLEANING': { sliderId: 'generalCleaningSliderUser2', percentId: 'generalCleaningPercentUser2', trackId: 'generalCleaningTrackUser2', hiddenId: 'generalCleaningInputUser2' }
    };
    
    const config = sliderMapping[task];
    if (!config) {
        console.log(`❌ No slider mapping found for task: ${task}`);
        return;
    }
    
    const slider = document.getElementById(config.sliderId);
    const percentBox = document.getElementById(config.percentId);
    const trackFill = document.getElementById(config.trackId);
    const hiddenInput = document.getElementById(config.hiddenId);
    const sliderContainer = slider ? slider.closest('.slider-container') : null;
    const checkbox100 = document.querySelector(`input.check-100[data-slider="${config.sliderId}"]`);
    
    if (!slider || !percentBox || !trackFill) {
        console.log(`❌ Slider elements not found for ${task}: ${config.sliderId}, ${config.percentId}, ${config.trackId}`);
        return;
    }
    
    let numValue = 0;
    if (value) {
        if (typeof value === 'string') {
            numValue = parseInt(value.replace('%', '')) || 0;
        } else if (typeof value === 'number') {
            numValue = value;
        } else if (typeof value === 'boolean' && value === true) {
            numValue = 100;
        }
    }
    
    slider.value = numValue;
    percentBox.textContent = numValue + '%';
    trackFill.style.width = numValue + '%';
    if (hiddenInput) hiddenInput.value = numValue > 0 ? numValue + '%' : '';
    if (sliderContainer) updateSnapMarkers(sliderContainer, numValue);
    if (checkbox100) checkbox100.checked = (numValue === 100);
    
    console.log(`📊 Updated User2 slider ${task} to ${numValue}% from DB`);
}

// ========== FUNGSI LOAD SLIDERS DARI DATA DATABASE ==========
function loadUser2SlidersFromData(data) {
    if (!data || currentRole !== 'user2') return;
    
    console.log('📥 Loading User2 sliders from database data...');
    
    const tasks = [
        // Tahap 1
        'LAND CLEARING', 'PONDASI', 'SLOOF', 'PAS.DDG S/D2 CANOPY', 'PAS.DDG S/D RING BLK',
        'CONDUIT+INBOW DOOS', 'PIPA AIR KOTOR', 'PIPA AIR BERSIH', 'PLESTER', 'ACIAN & BENANGAN',
        
        // Tahap 2
        'RANGKA ATAP', 'GENTENG', 'PLAFOND', 'INSTALASI LISTRIK', 'KERAMIK LANTAI',
        
        // Tahap 3
        'KUSEN PINTU & JENDELA', 'DAUN PINTU & JENDELA', 'CAT DASAR + LAPIS AWAL', 
        'FITTING LAMPU', 'FIXTURE & SANITER', 'CAT FINISH INTERIOR', 'CAT FINISH EXTERIOR',
        'BAK KONTROL & BATAS CARPORT', 'PAVING HALAMAN', 'METERAN LISTRIK', 'METERAN AIR',
        'Konekting Air Bersih',
        
        // Tahap 4
        'Konekting Air Kotor', 'Gorong-gorong', 'Akses Jalan', 'GENERAL CLEANING'
    ];
    
    tasks.forEach(task => {
        const value = data[task] || data[task.toLowerCase().replace(/ /g, '_')];
        if (value !== undefined) {
            updateUser2SliderFromDB(task, value);
        }
    });
}


// Panggil setelah DOM siap
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(debugTahap4Structure, 1000);
  setTimeout(setupUser2ProgressSliders, 500);
});
