import HeroSection from "@/components/organisms/HeroSection";
import PropertyGrid from "@/components/organisms/PropertyGrid";

export default function Home() {
  return (
    <div className="min-h-screen px-2 md:px-0">
      <main className="pb-4 md:pb-6">
        <HeroSection />
        <PropertyGrid />
      </main>
    </div>
  );
}
