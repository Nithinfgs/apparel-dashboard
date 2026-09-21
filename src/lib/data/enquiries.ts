import "server-only";
import * as seed from "@/lib/seed";

export async function listEnquiries() {
  return seed.enquiries.map((e) => ({
    ...e,
    buyerName: seed.buyers.find((b) => b.id === e.buyerId)?.companyName ?? "Unknown",
    merchandiserName: seed.profiles.find((p) => p.id === e.merchandiserId)?.fullName ?? "Unassigned",
  }));
}

export async function getEnquiryById(id: string) {
  const enquiry = seed.enquiries.find((e) => e.id === id);
  if (!enquiry) return undefined;
  return {
    ...enquiry,
    buyerName: seed.buyers.find((b) => b.id === enquiry.buyerId)?.companyName ?? "Unknown",
    merchandiserName: seed.profiles.find((p) => p.id === enquiry.merchandiserId)?.fullName ?? "Unassigned",
  };
}
