import { highlights } from "./highlights";

export type Attraction = {
  id: string;
  district: string;
  title: string;
  category: string;
  summary: string;
  sourceUrl: string;
  image: {
    src: `/images/attractions/${string}.jpg`;
    alt: string;
    author: string;
    license: string;
    licenseUrl: string;
    sourceUrl: string;
  };
};

function fromHighlight(id: string, district: string, image: Attraction["image"]): Attraction {
  const note = highlights.find((item) => item.district === district);
  if (!note) throw new Error(`Missing sourced note for ${district}`);
  return { id, district, title: note.title, category: note.category, summary: note.summary, sourceUrl: note.sourceUrl, image };
}

export const attractions: Attraction[] = [
  fromHighlight("lalbagh-fort", "Dhaka", {
    src: "/images/attractions/lalbagh-fort.jpg",
    alt: "The brick gateway and gardens of Lalbagh Fort in Dhaka",
    author: "Jonaid Siam", license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Lalbag_fort.jpg",
  }),
  fromHighlight("coxs-bazar-beach", "Cox's Bazar", {
    src: "/images/attractions/coxs-bazar-beach.jpg",
    alt: "Beach and red parasols along the coast at Cox's Bazar",
    author: "Md Faysal Ahmed", license: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Cox%27s_Bazar_beach_(3991311).jpg",
  }),
  fromHighlight("ratargul-swamp", "Sylhet", {
    src: "/images/attractions/ratargul-swamp.jpg",
    alt: "Trees reflected in floodwater at Ratargul Swamp Forest",
    author: "Ifsanjry", license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Ratargul_Swamp_Forest,_Sylhet_03.jpg",
  }),
];
