import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, WifiOff } from "lucide-react";
import Parser from 'rss-parser';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type NewsItem = {
    title?: string;
    link?: string;
    pubDate?: string;
    contentSnippet?: string;
    enclosure?: {
        url: string;
    };
    content?: string;
};

const extractImageUrl = (item: NewsItem): string => {
    if (item.enclosure && item.enclosure.url) {
        return item.enclosure.url;
    }

    if (item.content) {
        const match = item.content.match(/<img.*?src="(.*?)"/);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    const seed = item.title?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'default';
    return `https://picsum.photos/seed/${seed}/600/400`;
};


export default async function NewsPage() {
    let newsItems: NewsItem[] = [];
    let fetchError = false;

    try {
        const parser = new Parser();
        const feed = await parser.parseURL('https://ucn.edu.ni/noticias/feed/');
        newsItems = feed.items.slice(0, 12);
    } catch (error) {
        console.error("Failed to fetch or parse RSS feed:", error);
        fetchError = true;
    }

    if (fetchError) {
        return (
             <div className="container mx-auto py-12 px-4">
                 <div className="text-center mb-12">
                    <h1 className="text-4xl lg:text-5xl font-headline font-bold text-primary">Noticias UCN</h1>
                    <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                        Mantente informado sobre las actividades académicas, eventos y logros de la Universidad Central de Nicaragua.
                    </p>
                </div>
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-dashed rounded-lg bg-card">
                    <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold font-headline text-muted-foreground">
                        No se pudieron cargar las noticias
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-md">
                        Hubo un problema al conectar con el servidor de noticias de UCN. Por favor, inténtalo de nuevo más tarde.
                    </p>
                </div>
            </div>
        );
    }

  return (
    <div className="bg-background">
      <div className="container mx-auto py-12 px-4">
          <div className="text-center mb-12">
              <h1 className="text-4xl lg:text-5xl font-headline font-bold text-primary">Noticias UCN</h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                  Mantente informado sobre las actividades académicas, eventos y logros de la Universidad Central de Nicaragua.
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsItems.map((newsItem, index) => {
                const imageUrl = extractImageUrl(newsItem);
                return (
                    <Card key={index} className="flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                        <div className="relative h-56 w-full">
                        <Image 
                            src={imageUrl} 
                            alt={newsItem.title || 'News article image'} 
                            fill 
                            className="object-cover"
                            data-ai-hint="university news"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        </div>
                        <CardHeader>
                        <CardTitle className="font-headline text-lg leading-snug">{newsItem.title || 'Noticia sin título'}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground line-clamp-3">{newsItem.contentSnippet?.trim() || 'No hay descripción disponible.'}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center text-sm text-muted-foreground pt-4">
                           <span>{newsItem.pubDate ? format(new Date(newsItem.pubDate), 'dd MMMM, yyyy', { locale: es }) : ''}</span>
                           {newsItem.link && (
                               <Button asChild variant="secondary" size="sm">
                                   <Link href={newsItem.link} target="_blank" rel="noopener noreferrer">
                                   Leer más <ArrowRight className="ml-2 h-4 w-4" />
                                   </Link>
                               </Button>
                           )}
                        </CardFooter>
                    </Card>
                )
            })}
          </div>
      </div>
    </div>
  );
}
