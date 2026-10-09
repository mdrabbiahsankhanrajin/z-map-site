// Short editorial notes paraphrased from the linked Bangladesh Tourism Board pages.
// These are a small curated set, not a complete attractions database.
export const highlights = [
  {
    district: "Dhaka",
    title: "Lalbagh Fort",
    category: "Heritage",
    summary: "An unfinished Mughal fort complex in Old Dhaka.",
    sourceUrl: "https://beautifulbangladesh.gov.bd/cat/heritage/4",
  },
  {
    district: "Cox's Bazar",
    title: "Cox's Bazar beach",
    category: "Coast",
    summary: "A long natural sandy beach beside the Bay of Bengal.",
    sourceUrl: "https://beautifulbangladesh.gov.bd/district-destination/coxsbazar/sea-beaches/12",
  },
  {
    district: "Bagerhat",
    title: "Sixty Dome Mosque",
    category: "Heritage",
    summary: "A Sultanate-period mosque within the UNESCO-listed Mosque City of Bagerhat.",
    sourceUrl: "https://beautifulbangladesh.gov.bd/index.php/district-destination/bagerhat/heritage/56",
  },
  {
    district: "Sylhet",
    title: "Ratargul Swamp Forest",
    category: "Nature",
    summary: "A freshwater swamp forest in the Gowainghat area of Sylhet.",
    sourceUrl: "https://beautifulbangladesh.gov.bd/loc/sylhet/25",
  },
  {
    district: "Rangamati",
    title: "Kaptai Lake",
    category: "Landscape",
    summary: "A reservoir formed by the Kaptai Dam; its creation also displaced communities.",
    sourceUrl: "https://beautifulbangladesh.gov.bd/loc/chattogram/123",
  },
  {
    district: "Patuakhali",
    title: "Kuakata beach",
    category: "Coast",
    summary: "A Bay of Bengal beach known for views of both sunrise and sunset.",
    sourceUrl: "https://beautifulbangladesh.gov.bd/district-destination/patuakhali/sea-beaches/20",
  },
  {
    district: "Dinajpur",
    title: "Kantaji Temple",
    category: "Heritage",
    summary: "An eighteenth-century temple known for its terracotta architecture in Kantanagar.",
    sourceUrl: "https://www.beautifulbangladesh.gov.bd/district-destination/dinajpur/heritage/62",
  },
  {
    district: "Rajshahi",
    title: "Varendra Research Museum",
    category: "Museum",
    summary: "A Rajshahi University museum with collections of regional antiquities.",
    sourceUrl: "https://beautifulbangladesh.gov.bd/district-destination/rajshahi/landmarks/119",
  },
  {
    district: "Khulna",
    title: "Sundarbans",
    category: "Nature",
    summary: "The tidal mangrove landscape extends through the Koyra area of Khulna.",
    sourceUrl: "https://www.beautifulbangladesh.gov.bd/loc/khulna/55",
  },
  {
    district: "Bogra",
    title: "Mahasthangarh",
    category: "Heritage",
    summary: "An archaeological site with remains of the ancient city of Pundranagara.",
    sourceUrl: "https://www.beautifulbangladesh.gov.bd/cat/summer/1",
  },
  {
    district: "Kushtia",
    title: "Lalon Fakir's shrine",
    category: "Culture",
    summary: "A shrine in Kushtia associated with the Baul poet and composer Lalon.",
    sourceUrl: "https://www.beautifulbangladesh.gov.bd/district-destination/kushtia/landmarks/67",
  },
  {
    district: "Chittagong",
    title: "Foy's Lake",
    category: "Landscape",
    summary: "A man-made lake set among hills in Chattogram.",
    sourceUrl: "https://beautifulbangladesh.gov.bd/district-destination/chattogram/land-of-rivers/110",
  },
  {
    district: "Bandarban",
    title: "Nilgiri",
    category: "Landscape",
    summary: "A hill viewpoint in Bandarban overlooking the surrounding highlands.",
    sourceUrl: "https://beautifulbangladesh.gov.bd/index.php/district-destination/bandarban/hill-tracts-waterfalls/9",
  },
  {
    district: "Mymensingh",
    title: "Shashi Lodge",
    category: "Heritage",
    summary: "A historic lodge in Mymensingh with a formal lawn and ornamental fountain.",
    sourceUrl: "https://beautifulbangladesh.gov.bd/index.php/district-destination/mymensingh/heritage/71",
  },
] as const;

export function highlightForDistrict(name: string) {
  return highlights.find((highlight) => highlight.district === name);
}
