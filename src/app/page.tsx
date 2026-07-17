import { ScraperProvider } from "@/context/ScraperContext";
import { ScraperApp } from "@/components/scraper/ScraperApp";

export default function Home() {
  return (
    <ScraperProvider>
      <ScraperApp />
    </ScraperProvider>
  );
}
