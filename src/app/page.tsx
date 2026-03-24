import { Hero } from "@/components/home/hero";
import { About } from "@/components/home/about";
import { Stats } from "@/components/home/stats";
import { SuccessStories } from "@/components/home/success-stories";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Stats />
      <SuccessStories />
    </>
  );
}
