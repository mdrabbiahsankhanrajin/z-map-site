// Editorial selections only. A season describes the landscape, not access or safety.
export const seasonalCollections = [
  {
    id: "rainy",
    title: "The water season",
    period: "Mid June – mid August",
    description: "Swamp forest, flowing hillsides and a haor transformed by rain.",
    places: [
      { id: "ratargul-swamp", note: "Rainwater brings the submerged forest into its fullest view.", sourceUrl: "https://www.beautifulbangladesh.gov.bd/district-destination/sylhet/green-zone/25" },
      { id: "bd-sylhet-bisnakandi", note: "Clouds, streams and waterfalls shape this rainy-season landscape.", sourceUrl: "https://www.beautifulbangladesh.gov.bd/cat/hill-tracts-waterfalls/95" },
      { id: "bd-sunamganj-tanguar-haor", note: "High water turns the haor into a broad, wave-filled expanse.", sourceUrl: "https://www.beautifulbangladesh.gov.bd/cat/land-of-rivers/121" },
    ],
  },
  {
    id: "winter",
    title: "The bird season",
    period: "Mid December – mid February",
    description: "Receding wetland water and visiting migratory birds.",
    places: [
      { id: "bd-sunamganj-tanguar-haor", note: "Channels, fields and migratory birds give the haor a different character.", sourceUrl: "https://www.beautifulbangladesh.gov.bd/cat/land-of-rivers/121" },
      { id: "bd-noakhali-nijhum-dwip", note: "Migratory birds gather on the island in winter.", sourceUrl: "https://www.beautifulbangladesh.gov.bd/district-destination/noakhali/island/112" },
    ],
  },
] as const;

export type SeasonId = (typeof seasonalCollections)[number]["id"];
export const seasonPeriodSource = "https://www.beautifulbangladesh.gov.bd/";
