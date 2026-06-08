import { Hero } from "@/components/hero";
import { Problem } from "@/components/problem";
import { Services } from "@/components/services";
import { Process } from "@/components/process";
import { Pricing } from "@/components/pricing";
import { About } from "@/components/about";
import { Faq } from "@/components/faq";
import { Booking } from "@/components/booking";

export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <Services />
      <Process />
      <Pricing />
      <About />
      <Faq />
      <Booking />
    </>
  );
}
