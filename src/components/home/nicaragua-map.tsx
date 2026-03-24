"use client";

import { useState } from "react";
import { nicaraguaDepartments } from "@/lib/data";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function NicaraguaMap() {
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);

  const maxGraduates = Math.max(...nicaraguaDepartments.map(d => d.graduates));

  const getDepartmentColor = (graduates: number) => {
    const intensity = Math.max(0.1, graduates / maxGraduates);
    return `rgba(31, 60, 126, ${intensity})`; // Using primary color #1F3C7E
  };

  return (
    <section className="py-16 sm:py-24 bg-card">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-headline text-3xl sm:text-4xl font-bold">Nuestra Huella Nacional</h2>
            <p className="mt-3 text-lg text-muted-foreground">
                Explora la distribución de nuestros graduados a lo largo y ancho de Nicaragua.
            </p>
        </div>
        <div className="mt-12 flex justify-center">
          <TooltipProvider>
            <svg
              viewBox="80 120 250 250"
              xmlns="http://www.w3.org/2000/svg"
              className="max-w-2xl w-full h-auto"
              aria-label="Mapa de Nicaragua"
            >
              <g>
                {nicaraguaDepartments.map((dept) => (
                  <Tooltip key={dept.id} delayDuration={100}>
                    <TooltipTrigger asChild>
                      <path
                        d={dept.path}
                        fill={getDepartmentColor(dept.graduates)}
                        stroke="#E9EBF0"
                        strokeWidth="1"
                        className="transition-opacity duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredDept(dept.id)}
                        onMouseLeave={() => setHoveredDept(null)}
                        style={{
                           opacity: hoveredDept === null || hoveredDept === dept.id ? 1 : 0.5,
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-primary text-primary-foreground">
                      <p className="font-bold">{dept.name}</p>
                      <p>{dept.graduates.toLocaleString()} graduados</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </g>
            </svg>
          </TooltipProvider>
        </div>
      </div>
    </section>
  );
}
