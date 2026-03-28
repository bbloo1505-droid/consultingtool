import type { RegisterHint } from "@/types/screening";

/** Manual register / formal search steps (not live spatial queries in this app). */
export const REGISTER_HINTS: RegisterHint[] = [
  {
    id: "pmst",
    title: "EPBC Protected Matters Search Tool (PMST)",
    description:
      "For potential MNES: threatened flora/fauna, TECs, and other EPBC matters. After a screening run, use the PMST map link in the workflow section (centred on your AOI) or open PMST and upload your boundary.",
    url: "https://www.dcceew.gov.au/environment/epbc/online-services/pmst",
  },
  {
    id: "biomaps",
    title: "Queensland Biomaps",
    description:
      "Upload your site boundary for MSES/biodiversity context; can email Excel/PDF style outputs (parallel to checking QLD Globe MSES layers).",
    url: "https://apps.information.qld.gov.au/Storymaps/Biomaps/",
  },
  {
    id: "wildnet",
    title: "Wildlife online services (Queensland)",
    description:
      "Species and wildlife data access points. Use for targeted records beyond mapped polygons.",
    url: "https://www.qld.gov.au/environment/plants-animals/animals/living-with/native-animals/wildlife-online-services",
  },
  {
    id: "mnes",
    title: "MNES guidance (Commonwealth)",
    description:
      "Matters of national environmental significance sit alongside state (MSES) triggers. Cross-check EPBC Act requirements for your project type.",
    url: "https://www.dcceew.gov.au/environment/epbc",
  },
  {
    id: "planning-reg",
    title: "Planning Regulation 2017 (Qld) - in force PDF",
    description:
      "Understanding triggers for reporting often comes back to legislation and planning instruments. Use as a reference with your planning/legal advice.",
    url: "https://www.legislation.qld.gov.au/view/pdf/inforce/current/sl-2014-0145",
  },
];
