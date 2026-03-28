/**
 * Approximate site location only. Official cadastre / title searches use surveyed boundaries.
 */
export function openStreetMapSiteUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=17`;
}

/**
 * EPBC Protected Matters Search Tool - map centred on AOI centroid (MNES / threatened species / TEC checks).
 * Hash route matches the official PMST web app pattern (commas in baseLayers left unencoded like the live app).
 */
export function pmstMapUrlAt(lat: number, lng: number, zoom = 14): string {
  return `https://pmst.environment.gov.au/#/map?lng=${lng}&lat=${lat}&zoom=${zoom}&baseLayers=Imagery,ImageryLabels`;
}

/** Queensland Biomaps story map (upload boundary, request reports - parallel to this app's AOI idea). */
export const BIOMAPS_STORY_URL = "https://apps.information.qld.gov.au/Storymaps/Biomaps/";

/** Planning Regulation 2017 (Qld) - in-force PDF; triggers and assessment context for planning/environment. */
export const QLD_PLANNING_REGULATION_PDF =
  "https://www.legislation.qld.gov.au/view/pdf/inforce/current/sl-2014-0145";

export const CONSULTANT_WORKFLOW_SUMMARY =
  "Many projects clear vegetation or build works and must check impacts on MNES (Commonwealth, EPBC) and MSES (Queensland). This tool intersects published MSES-style map layers. Use PMST for EPBC matters (e.g. threatened species, TECs), Biomaps/QLD Globe for Queensland biodiversity products, and read the planning regulation for assessment triggers - not a substitute for legal advice.";

export const CADASTRE_NOTE =
  "Point is the AOI centroid for orientation only. It is not a surveyed lot corner. Use Queensland Globe, your title search, or cadastral survey for legal boundaries.";
