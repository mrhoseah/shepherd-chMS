import { NextRequest, NextResponse } from "next/server";
import { kenyaCounties } from "@/lib/countries";

// Free API for US states and other countries
// Using a simple approach: return Kenya counties for KE, US states for US, etc.
const usStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma",
  "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming", "District of Columbia"
].sort();

const canadaProvinces = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
  "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
  "Quebec", "Saskatchewan", "Yukon"
].sort();

const ukCounties = [
  "Bedfordshire", "Berkshire", "Bristol", "Buckinghamshire", "Cambridgeshire",
  "Cheshire", "Cornwall", "Cumbria", "Derbyshire", "Devon", "Dorset",
  "Durham", "East Riding of Yorkshire", "East Sussex", "Essex", "Gloucestershire",
  "Greater London", "Greater Manchester", "Hampshire", "Herefordshire",
  "Hertfordshire", "Isle of Wight", "Kent", "Lancashire", "Leicestershire",
  "Lincolnshire", "Merseyside", "Norfolk", "North Yorkshire", "Northamptonshire",
  "Northumberland", "Nottinghamshire", "Oxfordshire", "Rutland", "Shropshire",
  "Somerset", "South Yorkshire", "Staffordshire", "Suffolk", "Surrey",
  "Tyne and Wear", "Warwickshire", "West Midlands", "West Sussex", "West Yorkshire",
  "Wiltshire", "Worcestershire"
].sort();

const southAfricaProvinces = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "Northern Cape", "North West", "Western Cape"
].sort();

const nigeriaStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
  "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna",
  "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara"
].sort();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const countryCode = searchParams.get("country");

  if (!countryCode) {
    return NextResponse.json(
      { error: "Country code is required" },
      { status: 400 }
    );
  }

  let states: string[] = [];

  switch (countryCode.toUpperCase()) {
    case "KE":
      states = kenyaCounties;
      break;
    case "US":
      states = usStates;
      break;
    case "CA":
      states = canadaProvinces;
      break;
    case "GB":
      states = ukCounties;
      break;
    case "ZA":
      states = southAfricaProvinces;
      break;
    case "NG":
      states = nigeriaStates;
      break;
    default:
      // For other countries, try to fetch from a free API
      // Using a fallback: return empty array or try CountryStateCity API
      try {
        // You can integrate with CountryStateCity API here if needed
        // For now, return empty array
        states = [];
      } catch (error) {
        states = [];
      }
  }

  return NextResponse.json({ states, countryCode });
}

