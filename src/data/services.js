// Codevenient Consulting service catalog — used to populate the line-item dropdown.
// Rates are SMB-friendly starting points; editable per invoice.

export const SERVICE_GROUPS = [
  {
    label: "Core builds",
    services: [
      { name: "Basic 1-page site", rate: 2600 },
      { name: "Multi-page site", rate: 5300 },
      { name: "Fullstack custom experience", rate: 6200 },
    ],
  },
  {
    label: "Add-ons",
    services: [
      { name: "Extra page", rate: 450 },
      { name: "Revision round", rate: 350 },
      { name: "Hosting/domain setup", rate: 600 },
      { name: "Logo/branding", rate: 1200 },
      { name: "SEO setup", rate: 900 },
      { name: "Content writing (per page)", rate: 150 },
    ],
  },
  {
    label: "Ongoing",
    services: [
      { name: "Monthly retainer", rate: 500 },
    ],
  },
];

export const CUSTOM_ITEM = "Custom item…";

export const ALL_SERVICES = SERVICE_GROUPS.flatMap((g) => g.services);

export function rateFor(name) {
  const match = ALL_SERVICES.find((s) => s.name === name);
  return match ? match.rate : 0;
}
