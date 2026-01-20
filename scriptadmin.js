// scriptadmin.js - VERSI 1.0 (COMPLETE)
(function() {
    'use strict';
    
    console.log('=== ADMIN UTILITAS SCRIPT LOADING ===');
    
    // ========== KONFIGURASI ==========
    const ADMIN_UTILITAS_URL = 'https://script.google.com/macros/s/AKfycbzSFK7tTjxYD-Z-UO35ObXnOMIxNdOmiN_YiV4xTvuifuoLY7v4Gs6HMmPn-yHGyJlbmg/exec';
    
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
        
        if (listrikInput) listrikInput.value = formatDateForInput(adminData.utilitas?.tglListrik || '');
        if (airInput) airInput.value = formatDateForInput(adminData.utilitas?.tglAir || '');

        if (adminData.utilitas && (adminData.utilitas.tglListrik || adminData.utilitas.tglAir)) {
            [listrikInput, airInput].forEach(input => {
                if (input) {
                    input.disabled = true;
                    input.style.opacity = '0.7';
                }
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
            const result = await window.getDataFromServer(ADMIN_UTILITAS_URL, {
                action: 'saveUtilitasData',
                kavling: kavlingName,
                listrikDate: listrikDate,
                airDate: airDate
            });
            
            if (result.success) {
                showAdminToast('success', 'Data utilitas berhasil disimpan!');
                await loadAdminUtilitasData(kavlingName);
            } else {
                showAdminToast('error', 'Gagal menyimpan: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving utilitas:', error);
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
                document.getElementById(dariInputId).value = '';
                document.getElementById(keInputId).value = '';
                document.getElementById(tglInputId).value = '';
                
                // Refresh data
                await loadAdminUtilitasData(kavlingName);
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
    
    function setupAdminEventListeners() {
        console.log('Setting up admin event listeners...');
        
        // HO User tab
        const saveHOButton = document.querySelector('#tab-ho-user .btn-save-section');
        if (saveHOButton) {
            saveHOButton.addEventListener('click', function(e) {
                e.preventDefault();
                saveHandoverKunci();
            });
        }

        // Edit HO Button
        const btnEditHO = document.getElementById('btn-edit-ho');
        if (btnEditHO) {
            btnEditHO.addEventListener('click', function() {
                const hoTab = document.getElementById('tab-ho-user');
                const inputs = hoTab.querySelectorAll('input');
                const saveBtn = hoTab.querySelector('.btn-save-section');
                
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
                
                inputs.forEach(input => {
                    input.disabled = false;
                    input.style.opacity = '1';
                });
                if (saveBtn) saveBtn.style.display = 'block';
                this.parentElement.style.display = 'none';
            });
        }
        
        // Utility Install tab
        const saveUtilityBtn = document.querySelector('#tab-utility-install .btn-save-section');
        if (saveUtilityBtn) {
            saveUtilityBtn.addEventListener('click', function(e) {
                e.preventDefault();
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
    }
    
    // ========== INITIALIZATION ==========
    function initAdminUtilitas() {
        try {
            console.log('=== INITIALIZING ADMIN UTILITAS ===');
            
            setTimeout(() => {
                if (document.getElementById('user4Page')) {
                    setupAdminEventListeners();
                    setupAdminTabs();
                    integrateWithMainScript();
                    
                    console.log('✅ Admin Utilitas initialized successfully');
                    
                    if (getSelectedKavling()) {
                        setTimeout(() => {
                            loadAdminUtilitasData(getSelectedKavling());
                        }, 500);
                    }
                }
            }, 500);
            
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
