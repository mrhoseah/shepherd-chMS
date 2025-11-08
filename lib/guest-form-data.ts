// Guest form data - titles, countries, and counties

export const TITLES = [
  "Mr.",
  "Mrs.",
  "Miss",
  "Ms.",
  "Dr.",
  "Prof.",
  "Rev.",
  "Pastor",
  "Apostle",
  "Evangelist",
  "Elder",
  "Brother",
  "Sister",
];

// Kenyan counties (most common for this church)
export const KENYAN_COUNTIES = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
];

// Common countries list (can be enhanced with REST Countries API)
// Using REST Countries API: https://restcountries.com (free, no API key needed)
export const COUNTRIES = [
  "Kenya",
  "Uganda",
  "Tanzania",
  "Rwanda",
  "Burundi",
  "Ethiopia",
  "Somalia",
  "South Sudan",
  "Sudan",
  "Egypt",
  "Nigeria",
  "Ghana",
  "South Africa",
  "Zimbabwe",
  "Zambia",
  "Malawi",
  "Mozambique",
  "Botswana",
  "Namibia",
  "Angola",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "India",
  "China",
  "Other",
];

// Function to fetch countries from REST Countries API (optional enhancement)
// API: https://restcountries.com/v3.1/all
// This is free, no API key required, and very reliable
export async function fetchCountriesFromAPI(): Promise<string[]> {
  try {
    const response = await fetch("https://restcountries.com/v3.1/all?fields=name");
    const data = await response.json();
    return data
      .map((country: { name: { common: string } }) => country.name.common)
      .sort();
  } catch (error) {
    console.error("Error fetching countries:", error);
    return COUNTRIES; // Fallback to static list
  }
}

// Note: For states/provinces of other countries, you could use:
// - CountryAPI (countryapi.io) - has states but may require API key
// - Keep it simple: Just country + city for non-Kenyan guests
// - Or use a static mapping for major countries (US states, UK counties, etc.)

