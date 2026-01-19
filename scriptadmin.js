// scriptadmin.js - VERSI 0.25
(function() {
    'use strict';
    
    console.log('=== ADMIN UTILITAS SCRIPT LOADING ===');
    
    // ========== KONFIGURASI ==========
    // ⚠️ Gunakan URL yang sama dengan script.js
    const ADMIN_UTILITAS_URL = 'https://script.google.com/macros/s/AKfycbzpC_OqLvzKsNTB0ngV6Fte20kx1LWl8NSIpDNVjpP9FV0hdZy2e8gy_q8leycLLgmm_w/exec';
    
    // ========== VARIABEL ==========
    let adminData = {
        handover: null,
        mutasi: [],
        utilitas: null
    };
    
    // ========== UTILITY FUNCTIONS ==========
    function getSelectedKavling() {
        return window.selectedKavling || null;
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
    
    // ========== CORE FUNCTIONS ==========
    async function loadAdminUtilitasData(kavlingName) {
        if (!kavlingName) {
            showAdminToast('warning', 'Pilih kavling terlebih dahulu');
            return;
        }
        
        showAdminLoading(`Memuat data admin untuk ${kavlingName}...`);
        
        try {
            // Gunakan fungsi getDataFromServer dari script.js
            const result = await window.getDataFromServer(ADMIN_UTILITAS_URL, {
                action: 'getHandoverData',
                kavling: kavlingName
            });
            
            if (result.success) {
                adminData = {
                    handover: result.handoverData || null,
                    mutasi: result.mutasiData || [],
                    utilitas: result.utilitasData || null
                };
                
                // Update UI
                updateAdminUI(kavlingName);
                showAdminToast('success', `Data admin untuk ${kavlingName} dimuat`);
            } else {
                showAdminToast('info', 'Belum ada data admin untuk kavling ini');
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
            showAdminToast('error', 'Gagal memuat data admin');
        } finally {
            hideAdminLoading();
        }
    }
    
    function updateAdminUI(kavlingName) {
        // Update HO User tab
        updateHOTab();
        
        // Update Mutasi tabs
        updateMutasiTabs();
        
        // Update Utilitas tab
        updateUtilitasTab();
    }
    
    function updateHOTab() {
        const hoTab = document.getElementById('tab-ho-user');
        if (!hoTab || !adminData.handover) return;
        
        const dariInput = hoTab.querySelector('.input-mutasi-ho-dari');
        const keInput = hoTab.querySelector('.input-mutasi-ho-ke');
        const tglInput = hoTab.querySelector('.input-mutasi-ho-tgl');
        
        if (dariInput) dariInput.value = adminData.handover.dari || '';
        if (keInput) keInput.value = adminData.handover.user || '';
        if (tglInput && adminData.handover.tglHandover) {
            tglInput.value = formatDateForInput(adminData.handover.tglHandover);
        }
    }
    
    function updateMutasiTabs() {
        if (!adminData.mutasi || !Array.isArray(adminData.mutasi)) return;
        
        // Update mutasi masuk
        const masukTab = document.getElementById('tab-kunci-masuk');
        if (masukTab) {
            const masukInfo = masukTab.querySelector('.prev-mutasi-masuk-info');
            if (masukInfo) {
                const masukData = adminData.mutasi.filter(m => 
                    m.jenis === 'MASUK' || (!m.jenis && m.dari && m.ke)
                );
                if (masukData.length > 0) {
                    masukInfo.innerHTML = masukData.map(m => 
                        `<div>${m.tanggal || '-'}: ${m.dari || '-'} → ${m.ke || '-'}</div>`
                    ).join('');
                } else {
                    masukInfo.innerHTML = '<div class="no-data">Belum ada riwayat mutasi masuk</div>';
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
                    keluarInfo.innerHTML = keluarData.map(m => 
                        `<div>${m.tanggal || '-'}: ${m.dari || '-'} → ${m.ke || '-'}</div>`
                    ).join('');
                } else {
                    keluarInfo.innerHTML = '<div class="no-data">Belum ada riwayat mutasi keluar</div>';
                }
            }
        }
    }
    
    function updateUtilitasTab() {
        const utilitasTab = document.getElementById('tab-utility-install');
        if (!utilitasTab || !adminData.utilitas) return;
        
        const listrikInput = utilitasTab.querySelector('#listrikInstallDate');
        const airInput = utilitasTab.querySelector('#airInstallDate');
        
        if (listrikInput && adminData.utilitas.tglListrik) {
            listrikInput.value = formatDateForInput(adminData.utilitas.tglListrik);
        }
        if (airInput && adminData.utilitas.tglAir) {
            airInput.value = formatDateForInput(adminData.utilitas.tglAir);
        }
    }
    
    function formatDateForInput(dateStr) {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                // Jika sudah format dd/mm/yyyy
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
                return '';
            }
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error('Date format error:', error);
            return '';
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
        
        showAdminLoading('Menyimpan data handover...');
        
        try {
            const result = await window.getDataFromServer(ADMIN_UTILITAS_URL, {
                action: 'saveHandoverKunci',
                kavling: kavlingName,
                tglHandover: tgl,
                dari: dari,
                ke: ke,
                user: 'user4'
            });
            
            if (result.success) {
                showAdminToast('success', 'Data handover berhasil disimpan!');
                await loadAdminUtilitasData(kavlingName);
            } else {
                showAdminToast('error', 'Gagal menyimpan: ' + result.message);
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
        
        showAdminLoading('Menyimpan data utilitas...');
        
        try {
            const result = await window.getDataFromServer(ADMIN_UTILITAS_URL, {
                action: 'saveUtilitasData',
                kavling: kavlingName,
                listrikDate: listrikDate,
                airDate: airDate,
                user: 'user4'
            });
            
            if (result.success) {
                showAdminToast('success', 'Data utilitas berhasil disimpan!');
            } else {
                showAdminToast('error', 'Gagal menyimpan: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving utilitas:', error);
            showAdminToast('error', 'Error: ' + error.message);
        } finally {
            hideAdminLoading();
        }
    }
    
    // ========== SETUP FUNCTIONS ==========
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
        
        // Utility Install tab
        const saveUtilityBtn = document.querySelector('#tab-utility-install .btn-save-section');
        if (saveUtilityBtn) {
            saveUtilityBtn.addEventListener('click', function(e) {
                e.preventDefault();
                saveUtilitasDates();
            });
        }
        
        // ⚠️ HAPUS: Bagian untuk save meteran checkbox - TIDAK PERLU di admin
        
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
                    
                    // Tampilkan container riwayat
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
                
                // Remove active from all
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active to clicked
                this.classList.add('active');
                const targetTab = document.getElementById(`tab-${tabId}`);
                if (targetTab) targetTab.classList.add('active');
                
                // Load data sesuai tab
                if (getSelectedKavling()) {
                    setTimeout(() => {
                        if (tabId === 'ho-user' || tabId === 'utility-install' || 
                            tabId === 'kunci-masuk' || tabId === 'kunci-keluar') {
                            loadAdminUtilitasData(getSelectedKavling());
                        }
                    }, 200);
                }
            });
        });
    }
    
    // ========== INTEGRATION WITH MAIN SCRIPT ==========
    function integrateWithMainScript() {
        console.log('Integrating with main script.js...');
        
        // Override loadAdminUtilitasData jika belum ada
        if (!window.loadAdminUtilitasData) {
            window.loadAdminUtilitasData = loadAdminUtilitasData;
        }
        
        // Tambahkan fungsi untuk tombol view mutation history
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
            
            // Tunggu sedikit untuk main script
            setTimeout(() => {
                // Setup hanya jika di halaman user4
                if (document.getElementById('user4Page')) {
                    setupAdminEventListeners();
                    setupAdminTabs();
                    integrateWithMainScript();
                    
                    console.log('✅ Admin Utilitas initialized successfully');
                    
                    // Jika ada kavling yang sudah dipilih, load data
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
        saveUtilitas: saveUtilitasDates
    };
    
    // Auto-init saat DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM ready, initializing Admin Utilitas...');
            initAdminUtilitas();
        });
    } else {
        // Jika DOM sudah siap
        setTimeout(initAdminUtilitas, 300);
    }
    
})();
