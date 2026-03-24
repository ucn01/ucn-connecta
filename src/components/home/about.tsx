import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

export function About() {
  return (
    <section className="bg-card py-16 sm:py-24">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl mx-auto text-center lg:text-left">
            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary">
              Tu Vínculo Permanente con UCN
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              UCN Connecta es el espacio digital para mantener y fortalecer el lazo entre la Universidad Central de Nicaragua y su valiosa comunidad de egresados. Comparte tus logros, encuentra oportunidades y sé parte de una red de éxito que trasciende las aulas.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button size="lg" className="text-base" asChild>
              <Link href="/register">
                Formar parte de la Red
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" className="text-base" asChild>
              <Link href="/directory">
                <Users className="mr-2 h-5 w-5" />
                Ver Graduados de UCN
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
