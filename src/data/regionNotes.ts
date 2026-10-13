import photos from "./worldPhotoMetadata.json";

type RegionNote = {
  title: string;
  summary: string;
  sourceLabel: string;
  sourceUrl: string;
  image: { src: string; alt: string; author: string; license: string; licenseUrl: string; sourceUrl: string };
};

// Keys are Natural Earth v5.1.1 adm1_code IDs. Place sources are primary
// heritage/park authorities; photo records come from Commons imageinfo.
export const regionNotes: Record<string, RegionNote> = {
  "USA-3520": {
    title: "Grand Canyon", summary: "A Colorado River gorge in northern Arizona.",
    sourceLabel: "U.S. National Park Service", sourceUrl: "https://www.nps.gov/grca/",
    image: { ...photos["USA-3520"].image, alt: "The Grand Canyon seen from the South Rim" },
  },
  "IND-3253": {
    title: "Taj Mahal, Agra", summary: "The marble mausoleum stands in Agra, Uttar Pradesh.",
    sourceLabel: "UNESCO World Heritage Centre", sourceUrl: "https://whc.unesco.org/en/list/252/",
    image: { ...photos["IND-3253"].image, alt: "The Taj Mahal and its garden approach in Agra" },
  },
  "EGY-1544": {
    title: "Pyramids of Giza", summary: "The pyramid fields form part of the Memphis necropolis.",
    sourceLabel: "UNESCO World Heritage Centre", sourceUrl: "https://whc.unesco.org/en/list/86/",
    image: { ...photos["EGY-1544"].image, alt: "The pyramids rising above the Giza plateau" },
  },
  "PER-571": {
    title: "Machu Picchu", summary: "The historic sanctuary sits in the Andes of the Cusco region.",
    sourceLabel: "UNESCO World Heritage Centre", sourceUrl: "https://whc.unesco.org/en/list/274/",
    image: { ...photos["PER-571"].image, alt: "Stone terraces of Machu Picchu among mountain peaks" },
  },
  "JOR-853": {
    title: "Petra", summary: "A rock-cut Nabataean city in southern Jordan.",
    sourceLabel: "UNESCO World Heritage Centre", sourceUrl: "https://whc.unesco.org/en/list/326/",
    image: { ...photos["JOR-853"].image, alt: "The Treasury carved into sandstone at Petra" },
  },
  "AUS-2654": {
    title: "Sydney Opera House", summary: "The shell-roofed performance venue overlooks Sydney Harbour.",
    sourceLabel: "UNESCO World Heritage Centre", sourceUrl: "https://whc.unesco.org/en/list/166/",
    image: { ...photos["AUS-2654"].image, alt: "Sydney Opera House lit against the harbour at night" },
  },
  "BRA-627": {
    title: "Christ the Redeemer", summary: "The statue stands on Corcovado above Rio de Janeiro.",
    sourceLabel: "UNESCO World Heritage Centre", sourceUrl: "https://whc.unesco.org/en/list/1100/",
    image: { ...photos["BRA-627"].image, alt: "Christ the Redeemer statue on Corcovado in Rio de Janeiro" },
  },
  "JPN-1850": {
    title: "Kiyomizu-dera", summary: "The Kyoto temple is part of the Historic Monuments of Ancient Kyoto.",
    sourceLabel: "UNESCO World Heritage Centre", sourceUrl: "https://whc.unesco.org/en/list/688/",
    image: { ...photos["JPN-1850"].image, alt: "The pagoda at Kiyomizu-dera illuminated above autumn trees" },
  },
  "FRA-5333": {
    title: "Eiffel Tower", summary: "The iron tower stands beside the Seine in Paris.",
    sourceLabel: "Official Eiffel Tower site", sourceUrl: "https://www.toureiffel.paris/en/access-map",
    image: { ...photos["FRA-5333"].image, alt: "Looking up through the iron arches of the Eiffel Tower" },
  },
  "ITA-5422": {
    title: "Colosseum", summary: "The ancient amphitheatre stands in the heart of Rome.",
    sourceLabel: "Colosseum Archaeological Park", sourceUrl: "https://colosseo.it/en/area/the-colosseum/",
    image: { ...photos["ITA-5422"].image, alt: "The Colosseum in Rome illuminated after sunset" },
  },
  "MEX-2737": {
    title: "Chichén Itzá", summary: "El Castillo is among the stone monuments of this Yucatán site.",
    sourceLabel: "UNESCO World Heritage Centre", sourceUrl: "https://whc.unesco.org/en/list/483/",
    image: { ...photos["MEX-2737"].image, alt: "El Castillo pyramid at Chichén Itzá in Yucatán" },
  },
  "CAN-632": {
    title: "Lake Louise", summary: "A glacial lake within Banff National Park in Alberta.",
    sourceLabel: "Parks Canada", sourceUrl: "https://parks.canada.ca/pn-np/ab/banff/visit/les10-top10/louise",
    image: { ...photos["CAN-632"].image, alt: "Lake Louise and mountains in Banff National Park" },
  },
  "MAR-1456": {
    title: "Jemaa el-Fnaa", summary: "The square anchors Marrakesh's historic medina.",
    sourceLabel: "UNESCO World Heritage Centre", sourceUrl: "https://whc.unesco.org/en/list/331/",
    image: { ...photos["MAR-1456"].image, alt: "Jemaa el-Fnaa square in Marrakesh at sunset" },
  },
  "IDN-1232": {
    title: "Jatiluwih rice terraces", summary: "Terraced paddies in Bali shaped by the subak water system.",
    sourceLabel: "Indonesia Travel", sourceUrl: "https://www.indonesia.travel/id/en/destination/bali-nusa-tenggara/bali/bali---jatiluwih",
    image: { ...photos["IDN-1232"].image, alt: "Curving green rice terraces at Jatiluwih in Bali" },
  },
  "DEU-1591": {
    title: "Neuschwanstein Castle", summary: "King Ludwig II's castle rises above the Alpine foothills of Bavaria.",
    sourceLabel: "UNESCO World Heritage Centre", sourceUrl: "https://whc.unesco.org/en/list/1726/",
    image: { ...photos["DEU-1591"].image, alt: "Neuschwanstein Castle on its wooded Bavarian hillside" },
  },
  "CHN-1155": {
    title: "Great Wall at Mutianyu", summary: "A Great Wall section in the hills north of Beijing.",
    sourceLabel: "UNESCO World Heritage Centre", sourceUrl: "https://whc.unesco.org/en/list/438/",
    image: { ...photos["CHN-1155"].image, alt: "The Great Wall crossing mountain ridges near Beijing" },
  },
};

export function featuredRegionForCountry(countryId: string): string | undefined {
  return Object.keys(regionNotes).find((id) => id.startsWith(`${countryId}-`));
}
