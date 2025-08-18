import * as XLSX from 'xlsx';

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Use first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false
        });
        
        if (jsonData.length < 2) {
          reject(new Error('Excelファイルにデータが不足しています。ヘッダー行とデータ行が必要です。'));
          return;
        }
        
        const headers = jsonData[0].map(h => String(h).trim());
        const rows = jsonData.slice(1);
        
        // Find column indices
        const columnMap = findColumns(headers);
        
        if (columnMap.address === -1) {
          reject(new Error('「住所」列が見つかりません。必須列です。'));
          return;
        }
        
        // Parse rows
        const addresses = [];
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const address = String(row[columnMap.address] || '').trim();
          
          if (!address) {
            continue; // Skip empty addresses
          }
          
          const entry = {
            id: i,
            address: address,
            name: columnMap.name !== -1 ? String(row[columnMap.name] || '').trim() : '',
            memo: columnMap.memo !== -1 ? String(row[columnMap.memo] || '').trim() : '',
            stayMinutes: 0,
            desiredTime: ''
          };
          
          // Parse stay minutes
          if (columnMap.stayMin !== -1) {
            const stayValue = row[columnMap.stayMin];
            if (stayValue && !isNaN(stayValue)) {
              entry.stayMinutes = Math.max(0, parseInt(stayValue));
            }
          }
          
          // Parse desired time
          if (columnMap.desiredTime !== -1) {
            const timeValue = String(row[columnMap.desiredTime] || '').trim();
            if (timeValue && isValidTimeFormat(timeValue)) {
              entry.desiredTime = timeValue;
            }
          }
          
          addresses.push(entry);
        }
        
        if (addresses.length === 0) {
          reject(new Error('有効な住所データが見つかりませんでした。'));
          return;
        }
        
        resolve(addresses);
        
      } catch (error) {
        reject(new Error(`Excelファイルの解析に失敗しました: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました。'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

function findColumns(headers) {
  const columnMap = {
    address: -1,
    name: -1,
    memo: -1,
    stayMin: -1,
    desiredTime: -1
  };
  
  const patterns = {
    address: ['住所', 'address', 'addr'],
    name: ['訪問先', '名前', 'name', '会社名', '店名', '施設名'],
    memo: ['メモ', 'memo', '備考', '備考欄', '備考メモ', 'note', 'notes', '詳細'],
    stayMin: ['滞在分', '滞在時間', 'stay', 'duration', '滞在'],
    desiredTime: ['希望到着時刻', '到着希望時刻', '希望時刻', '到着時刻', 'desired_time', 'arrival_time']
  };
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase();
    
    for (const [key, keywords] of Object.entries(patterns)) {
      if (columnMap[key] === -1) {
        for (const keyword of keywords) {
          if (header.includes(keyword.toLowerCase())) {
            columnMap[key] = i;
            break;
          }
        }
      }
    }
  }
  
  return columnMap;
}

function isValidTimeFormat(timeStr) {
  // Check HH:MM format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
}

export function validateExcelData(data) {
  const errors = [];
  
  if (!Array.isArray(data) || data.length === 0) {
    errors.push('データが空です。');
    return errors;
  }
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    
    if (!item.address || typeof item.address !== 'string' || item.address.trim() === '') {
      errors.push(`行${i + 2}: 住所が空です。`);
    }
    
    if (item.stayMinutes && (isNaN(item.stayMinutes) || item.stayMinutes < 0)) {
      errors.push(`行${i + 2}: 滞在時間は0以上の数値で入力してください。`);
    }
    
    if (item.desiredTime && !isValidTimeFormat(item.desiredTime)) {
      errors.push(`行${i + 2}: 希望到着時刻は HH:MM 形式で入力してください（例：09:30）。`);
    }
  }
  
  return errors;
}