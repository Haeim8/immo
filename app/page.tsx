import Navbar from "@/components/organisms/Navbar";
import HeroSection from "@/components/organisms/HeroSection";
import PropertyGrid from "@/components/organisms/PropertyGrid";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <HeroSection />
        <PropertyGrid />
      </main>
    </div>
  );
}
