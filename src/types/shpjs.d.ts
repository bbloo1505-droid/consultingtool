declare module "shpjs" {
  import type { GeoJSON } from "geojson";
  function shp(buffer: ArrayBuffer): Promise<GeoJSON>;
  export default shp;
}
