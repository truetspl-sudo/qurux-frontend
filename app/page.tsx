import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import FeatureCards from "@/components/FeatureCards";
import WhyChoose from "@/components/WhyChoose";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSlider />
      <FeatureCards />
      <WhyChoose />
      <Footer />
    </main>
  );
}