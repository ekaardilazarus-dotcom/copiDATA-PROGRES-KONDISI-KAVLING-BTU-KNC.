// kavling.js - Fungsi terkait kavling (load, search, edit)

// Load daftar kavling
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

// Load kavling list dengan loading modal
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

// Update semua dropdown kavling
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

// Update single select element
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

// Set selected kavling di semua dropdown
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

// Setup custom search
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

// Render search list
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

// Search kavling
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
        const propNotesInput = document.getElementById('utilityPropertyNotes');
        if (propNotesInput) {
          propNotesInput.value = currentKavlingData.propertyNotes || '';
        }
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

// Tambah kavling baru
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

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadKavlingList,
    loadKavlingListWithLoading,
    updateAllKavlingSelects,
    updateKavlingSelect,
    setSelectedKavlingInDropdowns,
    setupCustomSearch,
    renderSearchList,
    searchKavling,
    submitNewKavling
  };
}
