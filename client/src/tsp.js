// TSP solver for train mode route optimization

export class TSPSolver {
  constructor(distanceMatrixProvider) {
    this.getDistanceMatrix = distanceMatrixProvider || this.haversineDistanceMatrix;
  }

  async solve(start, end, waypoints) {
    if (waypoints.length === 0) {
      return {
        orderedWaypoints: [],
        totalDistance: 0,
        totalTime: 0,
        legs: []
      };
    }

    // Create all points list: start, waypoints, end
    const allPoints = [start, ...waypoints, end];
    
    // Get distance/time matrix
    const matrix = await this.getDistanceMatrix(allPoints);
    
    // Solve TSP for waypoints (indices 1 to n)
    const waypointIndices = waypoints.map((_, i) => i + 1);
    const tspOrder = this.solveTSP(matrix, 0, allPoints.length - 1, waypointIndices);
    
    // Build ordered waypoints
    const orderedWaypoints = tspOrder.map(idx => waypoints[idx - 1]);
    
    // Calculate route legs and totals
    const route = [0, ...tspOrder, allPoints.length - 1];
    let totalDistance = 0;
    let totalTime = 0;
    const legs = [];
    
    for (let i = 0; i < route.length - 1; i++) {
      const fromIdx = route[i];
      const toIdx = route[i + 1];
      const distance = matrix[fromIdx][toIdx].distance;
      const time = matrix[fromIdx][toIdx].time;
      
      totalDistance += distance;
      totalTime += time;
      
      legs.push({
        from: allPoints[fromIdx],
        to: allPoints[toIdx],
        distance: distance,
        time: time
      });
    }
    
    return {
      orderedWaypoints,
      totalDistance: Math.round(totalDistance * 10) / 10, // Round to 1 decimal
      totalTime: Math.round(totalTime), // Round to nearest minute
      legs
    };
  }

  solveTSP(matrix, startIdx, endIdx, waypointIndices) {
    if (waypointIndices.length === 0) return [];
    if (waypointIndices.length === 1) return waypointIndices;

    // Greedy nearest neighbor for initial solution
    let currentOrder = this.greedyTSP(matrix, startIdx, endIdx, [...waypointIndices]);
    let bestDistance = this.calculateTotalDistance(matrix, [startIdx, ...currentOrder, endIdx]);

    // Improve with 2-opt
    let improved = true;
    let iterations = 0;
    const maxIterations = Math.min(1000, waypointIndices.length * 50);

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      for (let i = 0; i < currentOrder.length - 1; i++) {
        for (let j = i + 2; j < currentOrder.length; j++) {
          // Try 2-opt swap
          const newOrder = this.twoOptSwap(currentOrder, i, j);
          const newDistance = this.calculateTotalDistance(matrix, [startIdx, ...newOrder, endIdx]);

          if (newDistance < bestDistance) {
            currentOrder = newOrder;
            bestDistance = newDistance;
            improved = true;
          }
        }
      }
    }

    return currentOrder;
  }

  greedyTSP(matrix, startIdx, endIdx, waypointIndices) {
    if (waypointIndices.length === 0) return [];

    const order = [];
    const unvisited = new Set(waypointIndices);
    let currentIdx = startIdx;

    while (unvisited.size > 0) {
      let nearestIdx = null;
      let nearestDistance = Infinity;

      for (const idx of unvisited) {
        const distance = matrix[currentIdx][idx].distance;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIdx = idx;
        }
      }

      order.push(nearestIdx);
      unvisited.delete(nearestIdx);
      currentIdx = nearestIdx;
    }

    return order;
  }

  twoOptSwap(route, i, j) {
    const newRoute = [...route];
    // Reverse the segment between i and j
    const segment = newRoute.slice(i, j + 1).reverse();
    newRoute.splice(i, j - i + 1, ...segment);
    return newRoute;
  }

  calculateTotalDistance(matrix, route) {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      total += matrix[route[i]][route[i + 1]].distance;
    }
    return total;
  }

  // Default distance matrix using Haversine formula
  async haversineDistanceMatrix(points) {
    const n = points.length;
    const matrix = Array(n).fill(null).map(() => Array(n).fill(null));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = { distance: 0, time: 0 };
        } else {
          const distance = this.haversineDistance(points[i], points[j]);
          const time = distance / 4.5 * 60; // Assume 4.5km/h walking speed
          matrix[i][j] = { distance, time };
        }
      }
    }

    return matrix;
  }

  haversineDistance(point1, point2) {
    const R = 6371; // Earth radius in kilometers
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    const lat1 = this.toRad(point1.lat);
    const lat2 = this.toRad(point2.lat);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI/180);
  }
}

// OSRM-based distance matrix (fallback to Haversine on failure)
export async function osrmDistanceMatrix(points) {
  try {
    const coordinates = points.map(p => [p.lng, p.lat]).join(';');
    const url = `https://router.project-osrm.org/table/v1/walking/${coordinates}?annotations=distance,duration`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('OSRM request failed');
    
    const data = await response.json();
    if (!data.distances || !data.durations) throw new Error('Invalid OSRM response');
    
    const n = points.length;
    const matrix = Array(n).fill(null).map(() => Array(n).fill(null));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        matrix[i][j] = {
          distance: data.distances[i][j] / 1000, // Convert m to km
          time: data.durations[i][j] / 60 // Convert s to minutes
        };
      }
    }
    
    return matrix;
    
  } catch (error) {
    console.warn('OSRM fallback to Haversine:', error.message);
    // Fallback to Haversine
    const tsp = new TSPSolver();
    return await tsp.haversineDistanceMatrix(points);
  }
}