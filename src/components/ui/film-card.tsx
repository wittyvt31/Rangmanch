"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Film } from "@/features/studio/types";

interface FilmCardProps {
  film: Film;
  directorName?: string | null;
}

export function FilmCard({ film, directorName }: FilmCardProps) {
  return (
    <Link href={`/film/${film.id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Card className="h-full overflow-hidden border-border bg-surface transition-colors hover:border-primary/50">
          <div className="relative aspect-[2/3] w-full overflow-hidden bg-background">
            {film.poster_url ? (
              <Image
                src={film.poster_url}
                alt={film.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-primary/30">
                <span className="text-sm">No Poster</span>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-serif text-lg font-semibold text-primary line-clamp-2">
              {film.title}
            </h3>
            {directorName && (
              <p className="mt-1 text-sm text-primary/70 line-clamp-1">
                {directorName}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}


