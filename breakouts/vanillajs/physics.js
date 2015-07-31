PHYSICS = (function(){

  /**
   * Create vector normalized by magnitude
   */
  function normalizeVector(vec2) {
    var result = [vec2[0], vec2[1]];
    const magnitude = magnitudeOfVector(vec2);
    result[0] /= magnitude;
    result[1] /= magnitude;
    return result;
  }

  /**
   * Returns the magnitude of a vector
   */
  function magnitudeOfVector(vec2) {
    return Math.sqrt(vec2[0] * vec2[0] + vec2[1] * vec2[1]);
  }

  /**
   * Returns the normal vector of a vector
   * this calculates the right side normal vector
   */
  function normalOfVector(vec2) {
    const flipped = [vec2[1], -vec2[0]];
    return normalizeVector(flipped);
  }

  /**
   * Returns the dot product value from 2 vectors
   */
  function dotProduct(vec2A, vec2B) {
    return vec2A[0] * vec2B[0] + vec2A[1] * vec2B[1];
  }

  /**
   * Project a vec2 onto a normalized vector
   * is (A dot B) / mag(B)
   * in our case because projectionVec2 is normalized
   *    mag(B) == 1 and this becomes (A dot B)
   */
  function projectVec2OntoVec2(vec2, projectionVec2) {
    const projectionScalar = dotProduct(vec2, projectionVec2);
    return projectionScalar;
  }

  /**
   * Returns an array of [min, max] magnitude of the projections
   * polygon is an array of points [x0, y0, x1, y1, ... xn, yn]
   * the polygon should be be in counter clockwise point order
   * the last points ARE NOT a repeat of the first points x0 != xn
   */
  function projectPolygonOntoVec2(polygon, projectionVec2) {
    var i = 0;
    var vec2Project = [0.0, 0.0];
    var minMax = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
    var projectionValue = -1;
    for (i = 0; i < polygon.length; i += 2) {
      vec2Project[0] = polygon[i];
      vec2Project[1] = polygon[i + 1];
      projectionValue = projectVec2OntoVec2(vec2Project, projectionVec2);
      minMax[0] = Math.min(minMax[0], projectionValue);
      minMax[1] = Math.max(minMax[1], projectionValue);
    }
    return minMax;
  }

  /**
   * Convert aabb to a polygon for projection
   */
  function aabbToPolygon(aabb) {
    return [
      aabb.x, aabb.y,
      aabb.x + aabb.width, aabb.y,
      aabb.x + aabb.width, aabb.y + aabb.height,
      aabb.x, aabb.y + aabb.height
    ];
  }

  /**
   * Calculate the overlap between two projections
   * If no overlap, returns undefined
   */
  function calculateOverlap(proj1, proj2) {
    if ((proj2[0] > proj1[1] || proj1[0] > proj2[1])) {
      // we have a gap, no collision
      return;
    }
    if (proj2[0] > proj1[0]) {
      return proj1[1] - proj2[0];
    }
    if (proj1[0] > proj2[0]) {
      return proj2[1] - proj1[0];
    }
  }

  /**
   * returns undefined if no collision or a vec2 of Minimum Translation Vector
   * aabb - {x, y, width, height} - (x,y) being the lower left corner
   */
  function satAABBToAABBCollision(aabb1, aabb2) {
    // the two axis we need to check, vertical and horizontal
    // don't have to worry about aabb1 or aabb2 as they're axis aligned
    const projectionAxis = [
      // for aabb1
      normalOfVector([aabb1.width, 0]),
      normalOfVector([0, aabb1.height]),
    ];

    var poly1 = aabbToPolygon(aabb1);
    var poly2 = aabbToPolygon(aabb2);
    var i = 0;
    var proj1, proj2;
    var overlap;
    var smallestOverlapAxis;
    var smallestOverlap = Number.POSITIVE_INFINITY;
    var mtv;
    for (i = 0; i < projectionAxis.length; ++i) {
      proj1 = projectPolygonOntoVec2(poly1, projectionAxis[i]);
      proj2 = projectPolygonOntoVec2(poly2, projectionAxis[i]);
      overlap = calculateOverlap(proj1, proj2);
      if (overlap) {
        if (overlap < smallestOverlap) {
          smallestOverlap = overlap;
          smallestOverlapAxis = projectionAxis[i];
        }
      } else {
        return;
      }
    }
    mtv = [smallestOverlapAxis[0], smallestOverlapAxis[1]];
    mtv[0] *= smallestOverlap;
    mtv[1] *= smallestOverlap;
    return mtv;
  }

  return {
    satAABBToAABBCollision: satAABBToAABBCollision
  };

}());
