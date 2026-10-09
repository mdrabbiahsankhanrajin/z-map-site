// District membership follows the Bangladesh National Portal district list.
// Names below match the checked-in geoBoundaries 2020 labels; IDs are unchanged.
export const divisionSource = "https://bangladesh.gov.bd/views/district-list/District-List/";

export const divisions = [
  { name: "Dhaka", districts: ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"] },
  { name: "Khulna", districts: ["Bagerhat", "Chuadanga", "Jessore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"] },
  { name: "Chattogram", districts: ["Bandarban", "Brahamanbaria", "Chandpur", "Chittagong", "Comilla", "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati"] },
  { name: "Rajshahi", districts: ["Bogra", "Joypurhat", "Naogaon", "Natore", "Nawabganj", "Pabna", "Rajshahi", "Sirajganj"] },
  { name: "Sylhet", districts: ["Habiganj", "Maulvibazar", "Sunamganj", "Sylhet"] },
  { name: "Rangpur", districts: ["Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon"] },
  { name: "Mymensingh", districts: ["Jamalpur", "Mymensingh", "Netrakona", "Sherpur"] },
  { name: "Barishal", districts: ["Barguna", "Barisal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur"] },
] as const;

export type DivisionName = (typeof divisions)[number]["name"];

const divisionByDistrict = new Map<string, DivisionName>(
  divisions.flatMap((division) => division.districts.map((district) => [district, division.name] as const)),
);

export function divisionForDistrict(name: string): DivisionName | undefined {
  return divisionByDistrict.get(name);
}
