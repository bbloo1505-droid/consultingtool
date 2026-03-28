/** Simple ring centroid (average of vertices); first ring only. */
export function centroidFromRingsWgs84(rings: number[][][]): [number, number] {
  const ring = rings[0];
  if (!ring?.length) return [0, 0];
  let sx = 0;
  let sy = 0;
  for (const [x, y] of ring) {
    sx += x;
    sy += y;
  }
  const n = ring.length;
  return [sx / n, sy / n];
}
