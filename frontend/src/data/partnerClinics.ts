import type { SpecialtyId } from "../lib/specialties";

// Curated "partner" clinics (sample data). These appear first, above the real
// OpenStreetMap results, and each click is recorded to the DB — demonstrating
// the referral / revenue-share model. Structured so real partners can slot in.
export type PartnerClinic = {
  id: string;
  name: string;
  specialtyId: SpecialtyId;
  rating: number;
  reviews: number;
  city: string;
  feeInr: number;
};

export const PARTNER_CLINICS: PartnerClinic[] = [
  { id: "p-endo-apollo", name: "Apollo Endocrine Centre", specialtyId: "endocrinologist", rating: 4.9, reviews: 640, city: "Bengaluru", feeInr: 800 },
  { id: "p-diab-fortis", name: "Fortis Diabetes Care", specialtyId: "diabetologist", rating: 4.8, reviews: 512, city: "Bengaluru", feeInr: 700 },
  { id: "p-cardio-narayana", name: "Narayana Heart Institute", specialtyId: "cardiologist", rating: 4.9, reviews: 980, city: "Bengaluru", feeInr: 1000 },
  { id: "p-nephro-manipal", name: "Manipal Kidney Centre", specialtyId: "nephrologist", rating: 4.7, reviews: 288, city: "Bengaluru", feeInr: 850 },
  { id: "p-hepa-bgs", name: "BGS Liver Clinic", specialtyId: "hepatologist", rating: 4.7, reviews: 210, city: "Bengaluru", feeInr: 900 },
  { id: "p-hema-hcg", name: "HCG Blood & Hematology", specialtyId: "hematologist", rating: 4.8, reviews: 340, city: "Bengaluru", feeInr: 950 },
  { id: "p-gen-practo", name: "Practo Care Clinic", specialtyId: "general", rating: 4.7, reviews: 720, city: "Bengaluru", feeInr: 500 }
];

export function partnersForSpecialty(id: SpecialtyId): PartnerClinic[] {
  return PARTNER_CLINICS.filter((p) => p.specialtyId === id);
}
