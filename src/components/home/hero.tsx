"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Autoplay from "embla-carousel-autoplay";

export function Hero() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );
  
  return (
    <section className="w-full">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {PlaceHolderImages.map((image) => (
            <CarouselItem key={image.id}>
              <div className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full">
                <Image
                  src={image.imageUrl}
                  alt={image.description}
                  data-ai-hint={image.imageHint}
                  fill
                  className="object-cover"
                  priority={image.id === "hero-1"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute inset-0 flex items-end p-8 md:p-12 lg:p-16">
                  <div className="max-w-3xl text-white">
                    <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold !leading-tight drop-shadow-lg">
                      Conectando Talento, Creando Futuro.
                    </h1>
                    <p className="mt-4 text-lg md:text-xl text-primary-foreground/90 max-w-2xl drop-shadow-md">
                      Tu red profesional de graduados de la Universidad Central de Nicaragua.
                    </p>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="absolute bottom-8 right-8 hidden md:flex items-center space-x-2">
            <CarouselPrevious className="static translate-y-0 text-white bg-black/20 hover:bg-black/50 border-white/50 hover:text-white" />
            <CarouselNext className="static translate-y-0 text-white bg-black/20 hover:bg-black/50 border-white/50 hover:text-white" />
        </div>
      </Carousel>
    </section>
  );
}
