import React, { useState, useEffect, useRef } from 'react';
import { MapManager } from './map.js';
import { parseExcelFile, validateExcelData } from './excel.js';
import { TSPSolver, osrmDistanceMatrix } from './tsp.js';
import { TransitButtons } from './transit.js';
import { exportToPDF } from './pdf.js';
import { cleanAddress, formatDistance, formatTime, showError, showSuccess, showInfo } from './utils.js';

function App() {
  const [mode, setMode] = useState('car'); // 'car' or 'train'
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [excelData, setExcelData] = useState([]);
  const [geocodedData, setGeocodedData] = useState([]);
  const [routeResult, setRouteResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapManager, setMapManager] = useState(null);
  
  const mapRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (mapRef.current && !mapManager) {
      const manager = new MapManager('map');
      setMapManager(manager);
    }
  }, [mapManager]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const data = await parseExcelFile(file);
      const errors = validateExcelData(data);
      
      if (errors.length > 0) {
        showError(`データエラー: ${errors.join(', ')}`);
        return;
      }

      setExcelData(data);
      showSuccess(`${data.length}件の住所データを読み込みました`);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeocode = async (addresses) => {
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses }),
      });

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`ジオコーディングエラー: ${error.message}`);
    }
  };

  const handleOptimize = async (start, end, waypoints) => {
    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ start, end, waypoints }),
      });

      if (!response.ok) {
        throw new Error('Route optimization failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`ルート最適化エラー: ${error.message}`);
    }
  };

  const handleStart = async () => {
    if (!startAddress.trim()) {
      showError('出発地を入力してください');
      return;
    }

    if (!endAddress.trim()) {
      showError('ゴール地を入力してください');
      return;
    }

    if (excelData.length === 0) {
      showError('Excelファイルをアップロードしてください');
      return;
    }

    setLoading(true);

    try {
      // Clear existing map data
      if (mapManager) {
        mapManager.clearAll();
      }

      // Geocode all addresses
      const allAddresses = [
        cleanAddress(startAddress),
        cleanAddress(endAddress),
        ...excelData.map(item => cleanAddress(item.address))
      ];

      const geocodeResults = await handleGeocode(allAddresses);
      
      // Check for geocoding failures
      const failures = geocodeResults.filter(result => result.error);
      if (failures.length > 0) {
        showError(`ジオコーディング失敗: ${failures.length}件`);
      }

      const validResults = geocodeResults.filter(result => !result.error);
      if (validResults.length < 2) {
        showError('出発地とゴール地の少なくとも一方がジオコーディングできませんでした');
        return;
      }

      const startGeo = validResults[0];
      const endGeo = validResults[1];
      const waypointGeos = validResults.slice(2);

      setGeocodedData(validResults);

      if (mode === 'car') {
        // Car mode: Use ORS optimization
        const waypoints = waypointGeos.map((geo, index) => ({
          lat: geo.lat,
          lng: geo.lng,
          id: index
        }));

        const optimizeResult = await handleOptimize(
          { lat: startGeo.lat, lng: startGeo.lng },
          { lat: endGeo.lat, lng: endGeo.lng },
          waypoints
        );

        // Build ordered route
        const orderedWaypoints = optimizeResult.orderedIds.map(id => ({
          ...excelData[id],
          ...waypointGeos[id]
        }));

        setRouteResult({
          mode: 'car',
          orderedWaypoints,
          totalDistance: optimizeResult.totals.distance,
          totalTime: optimizeResult.totals.duration,
          polylineGeoJson: optimizeResult.polylineGeoJson
        });

        // Draw on map
        if (mapManager) {
          // Add markers
          mapManager.addNumberedPin(startGeo.lat, startGeo.lng, 'S', startAddress, '', true);
          
          orderedWaypoints.forEach((waypoint, index) => {
            mapManager.addNumberedPin(
              waypoint.lat,
              waypoint.lng,
              index + 1,
              waypoint.address,
              waypoint.memo
            );
          });
          
          mapManager.addNumberedPin(endGeo.lat, endGeo.lng, 'E', endAddress, '', false, true);

          // Draw route
          if (optimizeResult.polylineGeoJson) {
            mapManager.drawRoute(optimizeResult.polylineGeoJson);
          }

          // Fit to bounds
          const allLocations = [startGeo, endGeo, ...orderedWaypoints];
          mapManager.fitToBounds(allLocations);
        }

      } else {
        // Train mode: Use TSP solver
        const tspSolver = new TSPSolver(osrmDistanceMatrix);
        const tspResult = await tspSolver.solve(
          { lat: startGeo.lat, lng: startGeo.lng },
          { lat: endGeo.lat, lng: endGeo.lng },
          waypointGeos.map((geo, index) => ({
            ...geo,
            ...excelData[index]
          }))
        );

        setRouteResult({
          mode: 'train',
          orderedWaypoints: tspResult.orderedWaypoints,
          totalDistance: tspResult.totalDistance,
          totalTime: tspResult.totalTime,
          legs: tspResult.legs
        });

        // Draw on map
        if (mapManager) {
          // Add markers
          mapManager.addNumberedPin(startGeo.lat, startGeo.lng, 'S', startAddress, '', true);
          
          tspResult.orderedWaypoints.forEach((waypoint, index) => {
            mapManager.addNumberedPin(
              waypoint.lat,
              waypoint.lng,
              index + 1,
              waypoint.address,
              waypoint.memo
            );
          });
          
          mapManager.addNumberedPin(endGeo.lat, endGeo.lng, 'E', endAddress, '', false, true);

          // Draw simple line route
          const routeCoordinates = [
            [startGeo.lng, startGeo.lat],
            ...tspResult.orderedWaypoints.map(wp => [wp.lng, wp.lat]),
            [endGeo.lng, endGeo.lat]
          ];
          mapManager.drawSimpleLine(routeCoordinates);

          // Fit to bounds
          const allLocations = [startGeo, endGeo, ...tspResult.orderedWaypoints];
          mapManager.fitToBounds(allLocations);
        }
      }

      showSuccess('ルート最適化が完了しました');

    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (orientation = 'landscape') => {
    try {
      setLoading(true);
      await exportToPDF('map', 'route-table', orientation);
      showSuccess('PDFエクスポートが完了しました');
    } catch (error) {
      showError(`PDFエクスポートに失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🗺️ ルート最適化アプリ</h1>
        
        <div className="controls">
          <div className="control-group">
            <label>移動手段</label>
            <div className="mode-toggle">
              <button
                className={`mode-button ${mode === 'car' ? 'active' : ''}`}
                onClick={() => setMode('car')}
              >
                🚗 車
              </button>
              <button
                className={`mode-button ${mode === 'train' ? 'active' : ''}`}
                onClick={() => setMode('train')}
              >
                🚃 電車
              </button>
            </div>
          </div>

          <div className="control-group">
            <label>出発地</label>
            <input
              type="text"
              className="input"
              value={startAddress}
              onChange={(e) => setStartAddress(e.target.value)}
              placeholder="出発地の住所を入力"
            />
          </div>

          <div className="control-group">
            <label>ゴール地</label>
            <input
              type="text"
              className="input"
              value={endAddress}
              onChange={(e) => setEndAddress(e.target.value)}
              placeholder="ゴール地の住所を入力"
            />
          </div>

          <div className="control-group">
            <label>Excelファイル</label>
            <input
              ref={fileInputRef}
              type="file"
              className="file-input"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
            />
            <label htmlFor="file-upload" className="file-label">
              📁 ファイル選択
              {excelData.length > 0 && <span>({excelData.length}件)</span>}
            </label>
          </div>

          <div className="control-group">
            <button
              className="btn btn-primary"
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? <div className="loading"></div> : '🚀 開始'}
            </button>
          </div>

          {routeResult && (
            <div className="control-group">
              <button
                className="btn btn-success"
                onClick={() => handleExportPDF('landscape')}
                disabled={loading}
              >
                {loading ? <div className="loading"></div> : '📄 PDF出力'}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="main">
        <div className="map-container">
          <div id="map" ref={mapRef} className="map"></div>
        </div>

        <aside className="sidebar">
          <div className="sidebar-content">
            {routeResult && (
              <>
                <div className="summary">
                  <h3>ルート概要</h3>
                  <div className="summary-item">
                    <span>移動手段:</span>
                    <span>{routeResult.mode === 'car' ? '🚗 車' : '🚃 電車'}</span>
                  </div>
                  <div className="summary-item">
                    <span>総距離:</span>
                    <span>{formatDistance(routeResult.totalDistance)}</span>
                  </div>
                  <div className="summary-item">
                    <span>推定時間:</span>
                    <span>{formatTime(routeResult.totalTime)}</span>
                  </div>
                  <div className="summary-item">
                    <span>訪問地点数:</span>
                    <span>{routeResult.orderedWaypoints.length}ヶ所</span>
                  </div>
                </div>

                <div id="route-table">
                  <h3>訪問順序</h3>
                  <table className="route-table">
                    <thead>
                      <tr>
                        <th>順序</th>
                        <th>訪問先</th>
                        <th>住所</th>
                        {routeResult.mode === 'train' && <th>電車ルート</th>}
                        <th>メモ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="route-number">S</span></td>
                        <td>出発地</td>
                        <td>{startAddress}</td>
                        {routeResult.mode === 'train' && <td>-</td>}
                        <td>-</td>
                      </tr>
                      {routeResult.orderedWaypoints.map((waypoint, index) => (
                        <tr key={index}>
                          <td><span className="route-number">{index + 1}</span></td>
                          <td>{waypoint.name || '訪問先'}</td>
                          <td>{waypoint.address}</td>
                          {routeResult.mode === 'train' && (
                            <td>
                              <TransitButtons
                                origin={index === 0 ? geocodedData[0] : routeResult.orderedWaypoints[index - 1]}
                                destination={waypoint}
                                className="transit-buttons-sm"
                              />
                            </td>
                          )}
                          <td>{waypoint.memo || '-'}</td>
                        </tr>
                      ))}
                      <tr>
                        <td><span className="route-number">E</span></td>
                        <td>ゴール地</td>
                        <td>{endAddress}</td>
                        {routeResult.mode === 'train' && (
                          <td>
                            <TransitButtons
                              origin={routeResult.orderedWaypoints[routeResult.orderedWaypoints.length - 1]}
                              destination={geocodedData[1]}
                              className="transit-buttons-sm"
                            />
                          </td>
                        )}
                        <td>-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!routeResult && excelData.length > 0 && (
              <div>
                <h3>読み込み済みデータ</h3>
                <p>{excelData.length}件の住所データが読み込まれています</p>
                <ul style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  {excelData.slice(0, 5).map((item, index) => (
                    <li key={index} style={{ marginBottom: '0.25rem' }}>
                      {item.name && `${item.name} - `}{item.address}
                    </li>
                  ))}
                  {excelData.length > 5 && <li>...他{excelData.length - 5}件</li>}
                </ul>
              </div>
            )}

            {!routeResult && excelData.length === 0 && (
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>
                <h3>使い方</h3>
                <ol style={{ textAlign: 'left', fontSize: '0.875rem', lineHeight: '1.5' }}>
                  <li>移動手段（車・電車）を選択</li>
                  <li>出発地とゴール地を入力</li>
                  <li>住所リストのExcelファイルをアップロード</li>
                  <li>「開始」ボタンで最適ルートを計算</li>
                  <li>結果をPDFで保存可能</li>
                </ol>
                
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                  <strong>Excelファイル形式:</strong><br />
                  <small>
                    必須列: 住所<br />
                    任意列: 訪問先, メモ, 滞在分, 希望到着時刻
                  </small>
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;