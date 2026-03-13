import { constructMetadata } from "@/lib/seo";
import ScholarshipsClient from "./ScholarshipsClient";

export const metadata = constructMetadata({
  title: "Scholarships & Grants | College Pathway Explorer",
  description: "Discover hidden scholarships, grants, and funding opportunities for college. Find need-based, merit-based, and passion-driven scholarships."
});

export default function ScholarshipsPage() {
  return <ScholarshipsClient />;
}
