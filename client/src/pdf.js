import html2pdf from 'html2pdf.js';

export class PDFExporter {
  constructor() {
    this.defaultOptions = {
      margin: 10,
      filename: 'route-plan.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'landscape'
      }
    };
  }

  async exportMapAndTable(mapContainer, tableContainer, options = {}) {
    const config = { ...this.defaultOptions, ...options };
    
    try {
      // Create a temporary container for PDF content
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.top = '0';
      pdfContainer.style.backgroundColor = 'white';
      pdfContainer.style.padding = '20px';
      pdfContainer.style.width = config.jsPDF.orientation === 'landscape' ? '297mm' : '210mm';
      pdfContainer.style.minHeight = config.jsPDF.orientation === 'landscape' ? '210mm' : '297mm';
      
      // Add title and timestamp
      const title = document.createElement('div');
      title.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px; color: #333;">ルート最適化結果</h1>
          <p style="margin: 5px 0; font-size: 14px; color: #666;">
            作成日時: ${new Date().toLocaleString('ja-JP')}
          </p>
        </div>
      `;
      pdfContainer.appendChild(title);
      
      // Clone and add map
      if (mapContainer) {
        const mapClone = mapContainer.cloneNode(true);
        mapClone.style.width = '100%';
        mapClone.style.height = '300px';
        mapClone.style.border = '1px solid #ddd';
        mapClone.style.marginBottom = '20px';
        
        const mapSection = document.createElement('div');
        mapSection.innerHTML = '<h2 style="margin-bottom: 10px; font-size: 18px;">ルート地図</h2>';
        mapSection.appendChild(mapClone);
        pdfContainer.appendChild(mapSection);
      }
      
      // Clone and add table
      if (tableContainer) {
        const tableClone = tableContainer.cloneNode(true);
        
        // Style the table for PDF
        const tables = tableClone.querySelectorAll('table');
        tables.forEach(table => {
          table.style.width = '100%';
          table.style.borderCollapse = 'collapse';
          table.style.fontSize = '12px';
          
          const cells = table.querySelectorAll('th, td');
          cells.forEach(cell => {
            cell.style.border = '1px solid #ddd';
            cell.style.padding = '8px';
            cell.style.textAlign = 'left';
          });
          
          const headers = table.querySelectorAll('th');
          headers.forEach(header => {
            header.style.backgroundColor = '#f5f5f5';
            header.style.fontWeight = 'bold';
          });
        });
        
        const tableSection = document.createElement('div');
        tableSection.innerHTML = '<h2 style="margin-bottom: 10px; font-size: 18px; margin-top: 20px;">訪問順序</h2>';
        tableSection.appendChild(tableClone);
        pdfContainer.appendChild(tableSection);
      }
      
      // Add to document temporarily
      document.body.appendChild(pdfContainer);
      
      // Generate PDF
      const pdf = html2pdf().set(config).from(pdfContainer);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
      config.filename = `route-plan-${timestamp}.pdf`;
      
      await pdf.save();
      
      // Clean up
      document.body.removeChild(pdfContainer);
      
      return true;
      
    } catch (error) {
      console.error('PDF export error:', error);
      throw new Error(`PDF出力に失敗しました: ${error.message}`);
    }
  }

  async exportPortrait(mapContainer, tableContainer, options = {}) {
    return this.exportMapAndTable(mapContainer, tableContainer, {
      ...options,
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    });
  }

  async exportLandscape(mapContainer, tableContainer, options = {}) {
    return this.exportMapAndTable(mapContainer, tableContainer, {
      ...options,
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    });
  }
}

// Utility functions for easy use
export async function exportToPDF(mapContainerId, tableContainerId, orientation = 'landscape') {
  const mapContainer = document.getElementById(mapContainerId);
  const tableContainer = document.getElementById(tableContainerId);
  
  if (!mapContainer) {
    throw new Error(`地図コンテナが見つかりません: ${mapContainerId}`);
  }
  
  if (!tableContainer) {
    throw new Error(`テーブルコンテナが見つかりません: ${tableContainerId}`);
  }
  
  const exporter = new PDFExporter();
  
  if (orientation === 'portrait') {
    return await exporter.exportPortrait(mapContainer, tableContainer);
  } else {
    return await exporter.exportLandscape(mapContainer, tableContainer);
  }
}

export function showPDFOptions(onExport) {
  // Create modal for PDF export options
  const modal = document.createElement('div');
  modal.className = 'pdf-export-modal';
  modal.innerHTML = `
    <div class="pdf-modal-overlay">
      <div class="pdf-modal-content">
        <h3>PDF出力設定</h3>
        <div class="pdf-options">
          <label>
            <input type="radio" name="orientation" value="landscape" checked>
            横向き（推奨）
          </label>
          <label>
            <input type="radio" name="orientation" value="portrait">
            縦向き
          </label>
        </div>
        <div class="pdf-actions">
          <button class="btn btn-primary" id="pdf-export-btn">出力</button>
          <button class="btn btn-secondary" id="pdf-cancel-btn">キャンセル</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const exportBtn = modal.querySelector('#pdf-export-btn');
  const cancelBtn = modal.querySelector('#pdf-cancel-btn');
  
  exportBtn.onclick = () => {
    const orientation = modal.querySelector('input[name="orientation"]:checked').value;
    document.body.removeChild(modal);
    onExport(orientation);
  };
  
  cancelBtn.onclick = () => {
    document.body.removeChild(modal);
  };
  
  // Close on overlay click
  modal.querySelector('.pdf-modal-overlay').onclick = (e) => {
    if (e.target.classList.contains('pdf-modal-overlay')) {
      document.body.removeChild(modal);
    }
  };
}