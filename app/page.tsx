import HeroSection from "@/components/organisms/HeroSection";
import PropertyGrid from "@/components/organisms/PropertyGrid";

export default function Home() {
  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <PropertyGrid />
      </main>
    </div>
  );
}
