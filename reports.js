// reports.js - Fungsi laporan dan summary

// Load summary report
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

// Display summary report
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

// Filter kavling by progress
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

// Render kavling section
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

// Download to Excel
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

// Load activity log
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

// Display activity log
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

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadSummaryReport,
    displaySummaryReport,
    filterKavlingByProgress,
    renderKavlingSection,
    downloadKavlingToExcel,
    loadActivityLog,
    displayActivityLog
  };
}
