import Navbar from "@/components/Navbar";
import AboutContent from "@/components/about/AboutContent";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <AboutContent />

      <Footer />
    </main>
  );
}