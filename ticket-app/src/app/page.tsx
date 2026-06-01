import { getEventConfig } from "@/config";
import HomePageClient from "./HomePageClient";

export default function HomePage() {
  return <HomePageClient eventConfig={getEventConfig()} />;
}
