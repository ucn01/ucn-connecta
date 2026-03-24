import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduateRegisterForm } from "@/components/auth/graduate-register-form";
import { CompanyRegisterForm } from "@/components/auth/company-register-form";
import { Building, GraduationCap } from "lucide-react";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
            <Image src="https://i.ibb.co/S4vhbXBM/LOGO-UCN-500-X500-fondo-blanco-PNG.png" alt="Logo UCN Conecta" width={64} height={64} className="mx-auto mb-4" />
            <h1 className="font-headline text-4xl font-bold">Únete a UCN Connecta</h1>
            <p className="text-muted-foreground mt-2">
                Selecciona tu tipo de perfil para comenzar el proceso de registro.
            </p>
        </div>
        <Tabs defaultValue="graduate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="graduate">
                <GraduationCap className="mr-2 h-4 w-4" />
                Soy Graduado
            </TabsTrigger>
            <TabsTrigger value="company">
                <Building className="mr-2 h-4 w-4" />
                Soy Empresa
            </TabsTrigger>
          </TabsList>
          <TabsContent value="graduate">
            <GraduateRegisterForm />
          </TabsContent>
          <TabsContent value="company">
            <CompanyRegisterForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
