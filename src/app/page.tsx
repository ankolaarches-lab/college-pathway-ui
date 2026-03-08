import { constructMetadata } from "@/lib/seo";
import HomeClient from "./HomeClient";

export const metadata = constructMetadata({
  title: "Find Your Perfect College Path",
  description: "Browse 4-year and 2-year colleges. Compare tuition, careers, and graduation outcomes with data-driven insights from the College Pathway Explorer."
});

export default function Home() {
  return <HomeClient />;
}
