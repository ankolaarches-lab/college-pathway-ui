import { constructMetadata } from "@/lib/seo";
import SearchClient from "./SearchClient";

export const metadata = constructMetadata({
  title: "Search Colleges",
  description: "Find and filter colleges by type, tuition, admission rates, and location. Discover your perfect educational path with our comprehensive search tools."
});

export default function SearchPage() {
  return <SearchClient />;
}
