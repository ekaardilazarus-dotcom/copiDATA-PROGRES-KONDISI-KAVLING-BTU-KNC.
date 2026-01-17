// progress.js - Fungsi progress dan tab management

// Update kavling info display
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

// Update total progress display
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

// Update progress calculation
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
      } else if (task.type === 'text' || task.type === 'textarea' || task.type === 'date') {
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

    // Weight yang lebih realistis
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

// Update tabs state
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

// Aktifkan/nonaktifkan input
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
  });
  
  // 4. Enable tombol save
  const saveButtons = page.querySelectorAll('.btn-save-section');
  saveButtons.forEach(btn => {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    btn.style.pointerEvents = 'auto';
  });
  
  console.log(`✅ Enabled: ${checkboxes.length} checkboxes, ${stateButtons.length} state buttons, ${saveButtons.length} save buttons`);
  
  // Debug output
  debugInputStatus();
}

// Enable search inputs only
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

// Setup checkbox listeners
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

// Setup state buttons
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

// Toggle functions for state buttons
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

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    updateKavlingInfo,
    updateTotalProgressDisplay,
    updateProgress,
    updateTabsState,
    disableAllInputs,
    enableAllInputs,
    enableSearchInputs,
    setupCheckboxListeners,
    setupStateButtons,
    toggleSystemButton,
    toggleTilesButton,
    toggleTableButton
  };
}
