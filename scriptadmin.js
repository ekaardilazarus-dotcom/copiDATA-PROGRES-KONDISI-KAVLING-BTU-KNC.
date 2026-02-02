// scriptadmin.js - VERSI 0.52
(function() {
    'use strict';
    
    console.log('=== ADMIN UTILITAS SCRIPT LOADING ===');
    
    // ========== KONFIGURASI ==========
    const ADMIN_UTILITAS_URL = 'https://script.google.com/macros/s/AKfycbxdn4gEn2DdgLYRyVy8QVfF4QMVwL2gs7O7cFIfisvKdfFCPkiOlLTYpJpVGt-w3-q4Vg/exec';
    
    // ========== VARIABEL ==========
    let adminData = {
        handover: null,
        utilitas: null,
        mutasiMasuk: '',
        mutasiKeluar: '',
        mutasi: [] // array untuk parsed data
    };
    
    // ========== UTILITY FUNCTIONS ==========
    function getSelectedKavling() {
        if (window.selectedKavling) return window.selectedKavling;
        
        const kavlingNameEl = document.querySelector('#kavlingInfoUser4 .val-name');
        if (kavlingNameEl && kavlingNameEl.textContent && kavlingNameEl.textContent !== '-') {
            return kavlingNameEl.textContent.trim();
        }
        
        return null;
    }
    
    function showAdminLoading(text) {
        if (window.showGlobalLoading) {
            window.showGlobalLoading(text);
        } else {
            console.log('[ADMIN LOADING]:', text);
        }
    }
    
    function hideAdminLoading() {
        if (window.hideGlobalLoading) {
            window.hideGlobalLoading();
        }
    }
    
    function showAdminToast(type, message) {
        if (window.showToast) {
            window.showToast(type, message);
        } else {
            console.log(`[ADMIN ${type.toUpperCase()}]: ${message}`);
        }
    }
    
    function validateDateInput(dateStr) {
        if (!dateStr) return null;
        
        const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const match = dateStr.match(regex);
        
        if (match) {
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10);
            const year = parseInt(match[3], 10);
            
            const date = new Date(year, month - 1, day);
            if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
                return dateStr;
            }
        }
        
        return null;
    }
    
    function formatDateForInput(dateStr) {
        if (!dateStr) return '';
        
        try {
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
                return dateStr;
            }
            
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            }
            
            return dateStr;
        } catch (error) {
            console.error('Date format error:', error);
            return '';
        }
    }
    
   function parseMutasiDataFromString(mutasiString) {
    if (!mutasiString || mutasiString.trim() === '') {
        return [];
    }
    
    const entries = [];
    
    // Split by pipe (|) - dengan trim
    const entryStrings = mutasiString.split('|').map(entry => entry.trim());
    
    // Proses tiap entry
    entryStrings.forEach((entryStr, index) => {
        if (entryStr.trim() === '') return;
        
        // Split entry by comma
        const parts = entryStr.split(',');
        
        if (parts.length >= 3) {
            entries.push({
                dari: parts[0]?.trim() || '',
                ke: parts[1]?.trim() || '',
                tanggal: parts[2]?.trim() || '',
                jenis: '' // akan di-set nanti
            });
        }
    });
    
    return entries;
}
    
    function resetAdminUI() {
        // Sembunyikan tab container saat reset
        const tabsContainer = document.getElementById('adminUtilitasTabsContainer');
        if (tabsContainer) {
            tabsContainer.style.display = 'none';
        }

        const inputs = document.querySelectorAll('#user4Page input');
        inputs.forEach(input => {
            if (input) {
                input.value = '';
                input.disabled = false;
                input.style.opacity = '1';
            }
        });
        
        const saveButtons = document.querySelectorAll('#user4Page .btn-save-section');
        saveButtons.forEach(btn => {
            if (btn) btn.style.display = 'block';
        });
        
        const editContainers = document.querySelectorAll('#user4Page .edit-container');
        editContainers.forEach(container => {
            if (container) container.style.display = 'none';
        });
        
        const mutasiInfos = document.querySelectorAll('.prev-mutasi-masuk-info, .prev-mutasi-keluar-info');
        mutasiInfos.forEach(info => {
            if (info) info.innerHTML = '<div class="no-data">Belum ada data</div>';
        });
    }
    
    // ========== CORE FUNCTIONS ==========
    async function loadAdminUtilitasData(kavlingName) {
        if (!kavlingName) {
            showAdminToast('warning', 'Pilih kavling terlebih dahulu');
            return;
        }
        
        showAdminLoading(`Memuat data admin untuk ${kavlingName}...`);
        
        try {
            const result = await window.getDataFromServer(ADMIN_UTILITAS_URL, {
                action: 'getHandoverData',
                kavling: kavlingName
            });
            
            if (result.success) {
                // Parse data mutasi dari string separated comma
                const mutasiMasukEntries = parseMutasiDataFromString(result.mutasiMasuk || '');
                const mutasiKeluarEntries = parseMutasiDataFromString(result.mutasiKeluar || '');
                
                // Beri jenis pada setiap entry
                mutasiMasukEntries.forEach(entry => entry.jenis = 'MASUK');
                mutasiKeluarEntries.forEach(entry => entry.jenis = 'KELUAR');
                
                // Gabungkan semua mutasi
                const allMutasi = [...mutasiMasukEntries, ...mutasiKeluarEntries];
                
                adminData = {
                    handover: result.handoverData || null,
                    utilitas: result.utilitasData || null,
                    mutasiMasuk: result.mutasiMasuk || '',
                    mutasiKeluar: result.mutasiKeluar || '',
                    mutasi: allMutasi
                };
                
                // Update UI
                updateAdminUI(kavlingName);
                
                // Tampilkan tab container setelah data berhasil dimuat
                const tabsContainer = document.getElementById('adminUtilitasTabsContainer');
                if (tabsContainer) {
                    tabsContainer.style.display = 'block';
                }
                
                showAdminToast('success', `Data admin untuk ${kavlingName} dimuat`);
            } else {
                showAdminToast('info', 'Belum ada data admin untuk kavling ini');
                resetAdminUI();
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
            showAdminToast('error', 'Gagal memuat data admin');
            resetAdminUI();
        } finally {
            hideAdminLoading();
        }
    }
    
    function updateAdminUI(kavlingName) {
        updateHOTab();
        updateMutasiTabs();
        updateUtilitasTab();
    }
    
    function updateHOTab() {
        const hoTab = document.getElementById('tab-ho-user');
        if (!hoTab) return;
        
        const dariInput = hoTab.querySelector('.input-mutasi-ho-dari');
        const keInput = hoTab.querySelector('.input-mutasi-ho-ke');
        const tglInput = hoTab.querySelector('.input-mutasi-ho-tgl');
        const editContainer = document.getElementById('ho-edit-container');
        const saveBtn = hoTab.querySelector('.btn-save-section');
        
        if (dariInput) dariInput.value = adminData.handover?.dari || '';
        if (keInput) keInput.value = adminData.handover?.user || '';
        if (tglInput && adminData.handover?.tglHandover) {
            tglInput.value = formatDateForInput(adminData.handover.tglHandover);
        }

        if (adminData.handover && (adminData.handover.dari || adminData.handover.user)) {
            [dariInput, keInput, tglInput].forEach(input => {
                if (input) {
                    input.disabled = true;
                    input.style.opacity = '0.7';
                }
            });
            if (editContainer) editContainer.style.display = 'block';
            if (saveBtn) saveBtn.style.display = 'none';
        } else {
            [dariInput, keInput, tglInput].forEach(input => {
                if (input) {
                    input.disabled = false;
                    input.style.opacity = '1';
                }
            });
            if (editContainer) editContainer.style.display = 'none';
            if (saveBtn) saveBtn.style.display = 'block';
        }
    }
    
 // Update display function untuk format yang lebih rapi
function updateMutasiTabs() {
    // Update mutasi masuk
    const masukTab = document.getElementById('tab-kunci-masuk');
    if (masukTab) {
        const masukInfo = masukTab.querySelector('.prev-mutasi-masuk-info');
        if (masukInfo) {
            const masukData = adminData.mutasi.filter(m => m.jenis === 'MASUK');
            if (masukData.length > 0) {
                masukInfo.innerHTML = masukData.map((m, index) => 
                    `<div class="mutasi-entry" style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="color: #94a3b8; font-size: 0.8rem;">Entry #${index + 1}</span>
                                <div style="margin-top: 2px;">
                                    <span style="font-weight: 500;">${m.dari || '-'}</span>
                                    <i class="fas fa-arrow-right" style="margin: 0 8px; font-size: 0.8rem; opacity: 0.5;"></i>
                                    <span style="font-weight: 500;">${m.ke || '-'}</span>
                                </div>
                            </div>
                            <span style="color: #38bdf8; font-size: 0.85rem;">${m.tanggal || '-'}</span>
                        </div>
                    </div>`
                ).join('');
            } else {
                masukInfo.innerHTML = '<div class="no-data" style="padding: 20px; text-align: center; color: #64748b;">Belum ada riwayat mutasi masuk</div>';
            }
        }
    }
    
    // Update mutasi keluar
    const keluarTab = document.getElementById('tab-kunci-keluar');
    if (keluarTab) {
        const keluarInfo = keluarTab.querySelector('.prev-mutasi-keluar-info');
        if (keluarInfo) {
            const keluarData = adminData.mutasi.filter(m => m.jenis === 'KELUAR');
            if (keluarData.length > 0) {
                keluarInfo.innerHTML = keluarData.map((m, index) => 
                    `<div class="mutasi-entry" style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="color: #94a3b8; font-size: 0.8rem;">Entry #${index + 1}</span>
                                <div style="margin-top: 2px;">
                                    <span style="font-weight: 500;">${m.dari || '-'}</span>
                                    <i class="fas fa-arrow-right" style="margin: 0 8px; font-size: 0.8rem; opacity: 0.5;"></i>
                                    <span style="font-weight: 500;">${m.ke || '-'}</span>
                                </div>
                            </div>
                            <span style="color: #38bdf8; font-size: 0.85rem;">${m.tanggal || '-'}</span>
                        </div>
                    </div>`
                ).join('');
            } else {
                keluarInfo.innerHTML = '<div class="no-data" style="padding: 20px; text-align: center; color: #64748b;">Belum ada riwayat mutasi keluar</div>';
            }
        }
    }
}
    
    function updateUtilitasTab() {
        const utilitasTab = document.getElementById('tab-utility-install');
        if (!utilitasTab) return;
        
        const listrikInput = utilitasTab.querySelector('#listrikInstallDate');
        const airInput = utilitasTab.querySelector('#airInstallDate');
        const editContainer = document.getElementById('utility-edit-container');
        const saveBtn = document.getElementById('btnSaveUtility');
        
        const listrikVal = formatDateForInput(adminData.utilitas?.tglListrik || '');
        const airVal = formatDateForInput(adminData.utilitas?.tglAir || '');

        console.log('🔍 DEBUG - Update Utilitas Tab:', {
            hasUtilitasData: !!adminData.utilitas,
            tglListrikRaw: adminData.utilitas?.tglListrik,
            tglAirRaw: adminData.utilitas?.tglAir,
            tglListrikFormatted: listrikVal,
            tglAirFormatted: airVal
        });
        
        if (listrikInput) listrikInput.value = listrikVal;
        if (airInput) airInput.value = airVal;

        if (listrikVal || airVal) {
            [listrikInput, airInput].forEach(input => {
                if (input) {
                    input.disabled = true;
                    input.style.opacity = '0.7';
                }
            });
            
            // Sembunyikan tombol "Hari Ini" jika sudah ada isian
            const todayButtons = utilitasTab.querySelectorAll('.btn-today-admin');
            todayButtons.forEach(btn => {
                btn.style.display = 'none';
            });

            if (editContainer) editContainer.style.display = 'block';
            if (saveBtn) saveBtn.style.display = 'none';
        } else {
            [listrikInput, airInput].forEach(input => {
                if (input) {
                    input.disabled = false;
                    input.style.opacity = '1';
                }
            });

            // Tampilkan kembali tombol "Hari Ini" jika kosong
            const todayButtons = utilitasTab.querySelectorAll('.btn-today-admin');
            todayButtons.forEach(btn => {
                btn.style.display = 'block';
            });

            if (editContainer) editContainer.style.display = 'none';
            if (saveBtn) saveBtn.style.display = 'block';
        }
    }
    
    // ========== SAVE FUNCTIONS ==========
    async function saveHandoverKunci() {
        const kavlingName = getSelectedKavling();
        if (!kavlingName) {
            showAdminToast('warning', 'Pilih kavling terlebih dahulu!');
            return;
        }
        
        const hoTab = document.getElementById('tab-ho-user');
        if (!hoTab) return;
        
        const dariInput = hoTab.querySelector('.input-mutasi-ho-dari');
        const keInput = hoTab.querySelector('.input-mutasi-ho-ke');
        const tglInput = hoTab.querySelector('.input-mutasi-ho-tgl');
        
        const dari = dariInput?.value.trim() || '';
        const ke = keInput?.value.trim() || '';
        const tgl = tglInput?.value || '';
        
        if (!dari || !ke) {
            showAdminToast('warning', 'Nama pemberi dan penerima harus diisi!');
            return;
        }
        
        if (tgl && !validateDateInput(tgl)) {
            showAdminToast('warning', 'Format tanggal tidak valid! Gunakan dd/mm/yyyy');
            return;
        }
        
        showAdminLoading('Menyimpan data handover...');
        
        try {
            const result = await window.getDataFromServer(ADMIN_UTILITAS_URL, {
                action: 'saveHandoverKunci',
                kavling: kavlingName,
                tglHandover: tgl,
                dari: dari,
                ke: ke
            });
            
            if (result.success) {
                showAdminToast('success', 'Data handover berhasil disimpan!');
                await loadAdminUtilitasData(kavlingName);
                
                // Otomatis tampilkan riwayat mutasi
                const historyContainer = document.getElementById('mutasiHistoryContainer');
                if (historyContainer) historyContainer.style.display = 'block';
            } else {
                showAdminToast('error', 'Gagal menyimpan: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving handover:', error);
            showAdminToast('error', 'Error: ' + error.message);
        } finally {
            hideAdminLoading();
        }
    }
    
    async function saveUtilitasDates() {
        const kavlingName = getSelectedKavling();
        if (!kavlingName) {
            showAdminToast('warning', 'Pilih kavling terlebih dahulu!');
            return;
        }
        
        const listrikDate = document.getElementById('listrikInstallDate')?.value || '';
        const airDate = document.getElementById('airInstallDate')?.value || '';
        
        console.log('Saving Utilitas:', { kavlingName, listrikDate, airDate });
        
        if (!listrikDate && !airDate) {
            showAdminToast('warning', 'Tidak ada data yang diubah');
            return;
        }
        
        if (listrikDate && !validateDateInput(listrikDate)) {
            showAdminToast('warning', 'Format tanggal listrik tidak valid! Gunakan dd/mm/yyyy');
            return;
        }
        
        if (airDate && !validateDateInput(airDate)) {
            showAdminToast('warning', 'Format tanggal air tidak valid! Gunakan dd/mm/yyyy');
            return;
        }
        
        showAdminLoading('Menyimpan data utilitas...');
        
        try {
            // ⚠️ PERHATIAN: Gunakan saveHandoverKunci untuk utilitas
            // Karena di sheet handoverkunci:
            // - Kolom E (5): Tanggal Pemasangan AIR (tglAir)
            // - Kolom F (6): Tanggal Pemasangan Listrik (tglListrik)
            const result = await window.getDataFromServer(ADMIN_UTILITAS_URL, {
                action: 'saveHandoverKunci',
                kavling: kavlingName,
                tglHandover: '',     // Kolom B - kosongkan karena ini utilitas
                dari: '',            // Kolom C - kosongkan karena ini utilitas
                ke: '',              // Kolom D - kosongkan karena ini utilitas
                tglAir: airDate,     // Kolom E - Tanggal Air
                tglListrik: listrikDate // Kolom F - Tanggal Listrik
            });

            console.log('🔍 DEBUG - Server Response:', result);
            
     if (result.success) {
                showAdminToast('success', 'Data utilitas berhasil disimpan!');

                // Refresh data setelah 500ms
                setTimeout(() => {
                    loadAdminUtilitasData(kavlingName);
                    
                    // Otomatis tampilkan riwayat mutasi
                    const historyContainer = document.getElementById('mutasiHistoryContainer');
                    if (historyContainer) historyContainer.style.display = 'block';
                }, 500);

            } else {
                showAdminToast('error', 'Gagal menyimpan: ' + (result.message || 'Unknown error'));
                console.error('Server error details:', result);

                // Fallback: Coba endpoint saveUtilitasData jika ada
                console.log('Trying fallback to saveUtilitasData...');
                const result2 = await window.getDataFromServer(ADMIN_UTILITAS_URL, {
                    action: 'saveUtilitasData',
                    kavling: kavlingName,
                    listrikDate: listrikDate,
                    airDate: airDate
                });

                if (result2.success) {
                    showAdminToast('success', 'Data utilitas berhasil disimpan (fallback)!');
                    setTimeout(() => {
                        loadAdminUtilitasData(kavlingName);
                    }, 500);
                }
            }
        } catch (error) {
            console.error('❌ Error saving utilitas:', error);
            showAdminToast('error', 'Error: ' + error.message);
        } finally {
            hideAdminLoading();
        }
    }
    
    async function saveMutasi(jenisMutasi) {
        const kavlingName = getSelectedKavling();
        if (!kavlingName) {
            showAdminToast('warning', 'Pilih kavling terlebih dahulu!');
            return;
        }
        
        let dariInputId, keInputId, tglInputId;
        
        if (jenisMutasi === 'MASUK') {
            dariInputId = 'mutasiMasukDari';
            keInputId = 'mutasiMasukKe';
            tglInputId = 'mutasiMasukTgl';
        } else {
            dariInputId = 'mutasiKeluarDari';
            keInputId = 'mutasiKeluarKe';
            tglInputId = 'mutasiKeluarTgl';
        }
        
        const dari = document.getElementById(dariInputId)?.value.trim() || '';
        const ke = document.getElementById(keInputId)?.value.trim() || '';
        const tgl = document.getElementById(tglInputId)?.value.trim() || '';
        
        if (!dari || !ke) {
            showAdminToast('warning', 'Nama pemberi dan penerima harus diisi!');
            return;
        }
        
        if (tgl && !validateDateInput(tgl)) {
            showAdminToast('warning', 'Format tanggal tidak valid! Gunakan dd/mm/yyyy');
            return;
        }
        
        showAdminLoading(`Menyimpan mutasi ${jenisMutasi.toLowerCase()}...`);
        
        try {
            const result = await window.getDataFromServer(ADMIN_UTILITAS_URL, {
                action: 'saveMutasi',
                kavling: kavlingName,
                jenis: jenisMutasi,
                pemberi: dari,
                penerima: ke,
                tanggal: tgl
            });
            
            if (result.success) {
                showAdminToast('success', `Mutasi ${jenisMutasi.toLowerCase()} berhasil disimpan!`);
                
                // Clear form inputs
                if (document.getElementById(dariInputId)) document.getElementById(dariInputId).value = '';
                if (document.getElementById(keInputId)) document.getElementById(keInputId).value = '';
                if (document.getElementById(tglInputId)) document.getElementById(tglInputId).value = '';
                
                // Refresh data
                await loadAdminUtilitasData(kavlingName);
                
                // Otomatis tampilkan riwayat mutasi
                const historyContainer = document.getElementById('mutasiHistoryContainer');
                if (historyContainer) historyContainer.style.display = 'block';
            } else {
                showAdminToast('error', 'Gagal menyimpan: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error(`Error saving mutasi ${jenisMutasi}:`, error);
            showAdminToast('error', 'Error: ' + error.message);
        } finally {
            hideAdminLoading();
        }
    }
    
    // ========== SETUP FUNCTIONS ==========
    function setupMutasiEventListeners() {
        const btnSaveMutasiMasuk = document.getElementById('btnSaveMutasiMasuk');
        if (btnSaveMutasiMasuk) {
            btnSaveMutasiMasuk.addEventListener('click', function(e) {
                e.preventDefault();
                saveMutasi('MASUK');
            });
        }
        
        const btnSaveMutasiKeluar = document.getElementById('btnSaveMutasiKeluar');
        if (btnSaveMutasiKeluar) {
            btnSaveMutasiKeluar.addEventListener('click', function(e) {
                e.preventDefault();
                saveMutasi('KELUAR');
            });
        }
    }
    // ========== SETUP FUNCTIONS ==========
    function setupUtilityTodayButtons() {
        console.log('Setting up utility today buttons...');

        // Tombol "Hari Ini" untuk Listrik
        const btnTodayListrik = document.querySelector('.btn-today-admin[data-target="#listrikInstallDate"]');
        if (btnTodayListrik) {
            btnTodayListrik.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const today = new Date();
                const day = String(today.getDate()).padStart(2, '0');
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const year = today.getFullYear();

                document.getElementById('listrikInstallDate').value = `${day}/${month}/${year}`;

                // Jika ada flatpickr instance, update juga
                if (window.flatpickrInstances && window.flatpickrInstances['listrikInstallDate']) {
                    window.flatpickrInstances['listrikInstallDate'].setDate(today, true);
                }
            });
        }

        // Tombol "Hari Ini" untuk Air
        const btnTodayAir = document.querySelector('.btn-today-admin[data-target="#airInstallDate"]');
        if (btnTodayAir) {
            btnTodayAir.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const today = new Date();
                const day = String(today.getDate()).padStart(2, '0');
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const year = today.getFullYear();

                document.getElementById('airInstallDate').value = `${day}/${month}/${year}`;

                // Jika ada flatpickr instance, update juga
                if (window.flatpickrInstances && window.flatpickrInstances['airInstallDate']) {
                    window.flatpickrInstances['airInstallDate'].setDate(today, true);
                }
            });
        }

        // Tombol "Hari Ini" untuk Tanggal Handover
        const btnTodayHandover = document.querySelector('.btn-today-admin[data-target=".input-mutasi-ho-tgl"]');
        if (btnTodayHandover) {
            btnTodayHandover.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const today = new Date();
                const day = String(today.getDate()).padStart(2, '0');
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const year = today.getFullYear();

                const handoverInput = document.querySelector('.input-mutasi-ho-tgl');
                if (handoverInput) {
                    handoverInput.value = `${day}/${month}/${year}`;

                    // Jika ada flatpickr instance, update juga
                    if (window.flatpickrInstances && handoverInput.id && window.flatpickrInstances[handoverInput.id]) {
                        window.flatpickrInstances[handoverInput.id].setDate(today, true);
                    }
                }
            });
        }
    }
    
    function setupAdminEventListeners() {
        console.log('Setting up admin event listeners...');
        setupUtilityTodayButtons();
        // HO User tab
        const hoTab = document.getElementById('tab-ho-user');
        const saveHOButton = hoTab ? hoTab.querySelector('.btn-save-section') : null;
        if (saveHOButton) {
            saveHOButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                saveHandoverKunci();
            });
        }

        // Edit HO Button
        const btnEditHO = document.getElementById('btn-edit-ho');
        if (btnEditHO) {
            btnEditHO.addEventListener('click', function() {
                const targetHoTab = document.getElementById('tab-ho-user');
                const inputs = targetHoTab.querySelectorAll('input');
                const saveBtn = targetHoTab.querySelector('.btn-save-section');
                const todayButtons = targetHoTab.querySelectorAll('.btn-today-admin');
                
                inputs.forEach(input => {
                    input.disabled = false;
                    input.style.opacity = '1';
                });
                if (saveBtn) saveBtn.style.display = 'block';
                this.parentElement.style.display = 'none';
            });
        }

        // Edit Utility Button
        const btnEditUtility = document.getElementById('btn-edit-utility');
        if (btnEditUtility) {
            btnEditUtility.addEventListener('click', function() {
                const utilityTab = document.getElementById('tab-utility-install');
                const inputs = utilityTab.querySelectorAll('input');
                const saveBtn = document.getElementById('btnSaveUtility');
                const todayButtons = utilityTab.querySelectorAll('.btn-today-admin');
                
                inputs.forEach(input => {
                    input.disabled = false;
                    input.style.opacity = '1';
                });
                
                todayButtons.forEach(btn => {
                    btn.style.display = 'block';
                });

                if (saveBtn) saveBtn.style.display = 'block';
                this.parentElement.style.display = 'none';
            });
        }
        
        // Utility Install tab
        const saveUtilityBtn = document.getElementById('btnSaveUtility');
        if (saveUtilityBtn) {
            // Clone dan replace untuk menghindari multiple event listeners
            const newSaveUtilityBtn = saveUtilityBtn.cloneNode(true);
            saveUtilityBtn.parentNode.replaceChild(newSaveUtilityBtn, saveUtilityBtn);

            newSaveUtilityBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Save utility button clicked');
                saveUtilitasDates();
            });
        }

        // Mutasi event listeners
        setupMutasiEventListeners();

        // Fetch Mutasi Data Button
        const fetchBtn = document.getElementById('btnFetchMutasiData');
        if (fetchBtn) {
            fetchBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const kavling = getSelectedKavling();
                if (kavling) {
                    loadAdminUtilitasData(kavling);
                } else {
                    showAdminToast('warning', 'Pilih kavling terlebih dahulu!');
                }
            });
        }

        // View Mutation History Button
        const viewHistoryBtn = document.getElementById('btnViewMutationHistory');
        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const kavling = getSelectedKavling();
                if (kavling) {
                    loadAdminUtilitasData(kavling);

                    const historyContainer = document.getElementById('mutasiHistoryContainer');
                    if (historyContainer) {
                        historyContainer.style.display = 
                            historyContainer.style.display === 'none' ? 'block' : 'none';
                    }
                } else {
                    showAdminToast('warning', 'Pilih kavling terlebih dahulu!');
                }
            });
        }
    }
    
    function setupAdminTabs() {
        const adminPage = document.getElementById('user4Page');
        if (!adminPage) return;
        
        const tabButtons = adminPage.querySelectorAll('.admin-tab-btn');
        const tabContents = adminPage.querySelectorAll('.tab-content-item');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                this.classList.add('active');
                const targetTab = document.getElementById(`tab-${tabId}`);
                if (targetTab) targetTab.classList.add('active');
            });
        });
    }

    // Fungsi helper untuk semua tombol "Hari Ini"
    function setupAllTodayButtons() {
        console.log('Setting up all "Today" buttons...');

        // Fungsi untuk mendapatkan tanggal hari ini dalam format dd/mm/yyyy
        function getTodayDate() {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            return `${day}/${month}/${year}`;
        }

        // Tangkap semua klik tombol "Hari Ini"
        document.addEventListener('click', function(e) {
            // Cek jika yang diklik adalah tombol "Hari Ini"
            if (e.target.classList.contains('btn-today-admin') || 
                e.target.closest('.btn-today-admin')) {

                e.preventDefault();
                e.stopPropagation();

                const button = e.target.classList.contains('btn-today-admin') ? 
                              e.target : e.target.closest('.btn-today-admin');

                const targetSelector = button.getAttribute('data-target');
                if (!targetSelector) return;

                try {
                    const targetInput = document.querySelector(targetSelector);
                    if (targetInput) {
                        const todayDate = getTodayDate();
                        targetInput.value = todayDate;

                        // Update Flatpickr jika ada
                        if (window.flatpickrInstances && targetInput.id && window.flatpickrInstances[targetInput.id]) {
                            window.flatpickrInstances[targetInput.id].setDate(new Date(), true);
                        }

                        console.log(`Set ${targetSelector} to today: ${todayDate}`);
                    }
                } catch (error) {
                    console.error('Error setting today date:', error);
                }
            }
        });
    }
    
    // ========== INTEGRATION WITH MAIN SCRIPT ==========
    function integrateWithMainScript() {
        console.log('Integrating with main script.js...');

        if (!window.loadAdminUtilitasData) {
            window.loadAdminUtilitasData = loadAdminUtilitasData;
        }

        window.showMutationHistory = function() {
            const kavling = getSelectedKavling();
            if (kavling) {
                loadAdminUtilitasData(kavling);
            } else {
                showAdminToast('warning', 'Pilih kavling terlebih dahulu!');
            }
        };

        // Override fungsi "setToday" dari script.js jika ada konflik
        if (window.setToday && typeof window.setToday === 'function') {
            const originalSetToday = window.setToday;
            window.setToday = function(inputId) {
                try {
                    const today = new Date();
                    const day = String(today.getDate()).padStart(2, '0');
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const year = today.getFullYear();

                    const input = document.getElementById(inputId);
                    if (input) {
                        input.value = `${day}/${month}/${year}`;
                        return true;
                    }
                    return originalSetToday(inputId);
                } catch (error) {
                    console.error('Error in setToday override:', error);
                    return originalSetToday(inputId);
                }
            };
        }
    }

    // ========== DEBUG FUNCTIONS ==========
    function testSaveUtilitas() {
        const kavlingName = getSelectedKavling();
        if (!kavlingName) {
            console.error('No kavling selected');
            return;
        }

        // Set test dates
        document.getElementById('listrikInstallDate').value = '25/12/2024';
        document.getElementById('airInstallDate').value = '26/12/2024';

        console.log('=== TEST SAVE UTILITAS ===');
        console.log('Kavling:', kavlingName);
        console.log('Listrik Date:', '25/12/2024');
        console.log('Air Date:', '26/12/2024');

        // Test langsung ke server
        const params = new URLSearchParams({
            action: 'saveHandoverKunci',
            kavling: kavlingName,
            tglHandover: '',
            dari: '',
            ke: '',
            tglAir: '26/12/2024',
            tglListrik: '25/12/2024'
        });

        const testUrl = `${ADMIN_UTILITAS_URL}?${params.toString()}`;
        console.log('Test URL:', testUrl);

        // Buka di new tab untuk testing
        window.open(testUrl, '_blank');
    }

    // Export untuk testing
    window.testSaveUtilitas = testSaveUtilitas;
    
    // ========== INITIALIZATION ==========
    function initAdminUtilitas() {
        try {
            console.log('=== INITIALIZING ADMIN UTILITAS ===');
            
            setTimeout(() => {
                if (document.getElementById('user4Page')) {
                    setupAdminEventListeners();
                    setupAdminTabs();
                    setupAllTodayButtons(); 
                    integrateWithMainScript();
                    
                    console.log('✅ Admin Utilitas initialized successfully');
                    
                    if (getSelectedKavling()) {
                        setTimeout(() => {
                            loadAdminUtilitasData(getSelectedKavling());
                        }, 500);
                    }
                }
            }, 800);
            
        } catch (error) {
            console.error('❌ Failed to initialize Admin Utilitas:', error);
        }
    }
    
    // ========== EXPORT ==========
    window.adminUtilitas = {
        init: initAdminUtilitas,
        loadData: loadAdminUtilitasData,
        saveHandover: saveHandoverKunci,
        saveUtilitas: saveUtilitasDates,
        saveMutasi: saveMutasi
    };
    
    // Auto-init saat DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM ready, initializing Admin Utilitas...');
            initAdminUtilitas();
        });
    } else {
        setTimeout(initAdminUtilitas, 300);
    }
    
})();
