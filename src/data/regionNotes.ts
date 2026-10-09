type RegionNote = { title: string; summary: string; sourceLabel: string; sourceUrl: string };

// Keys are Natural Earth v5.1.1 adm1_code IDs. Keep notes tied to the pinned source release.
export const regionNotes: Record<string, RegionNote> = {
  "USA-3520": {
    title: "Grand Canyon",
    summary: "The national park follows the Colorado River through northern Arizona.",
    sourceLabel: "U.S. National Park Service",
    sourceUrl: "https://www.nps.gov/grca/",
  },
  "IND-3253": {
    title: "Taj Mahal, Agra",
    summary: "This marble mausoleum in Uttar Pradesh was commissioned by Shah Jahan in memory of Mumtaz Mahal.",
    sourceLabel: "Incredible India",
    sourceUrl: "https://www.incredibleindia.gov.in/en/uttar-pradesh/agra/taj-mahal",
  },
};
