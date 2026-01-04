"use client";

import Image from "next/image";
import Link from "next/link";
import { Film } from "@/features/studio/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Film as FilmIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FilmsTableProps {
  films: Film[];
}

export function FilmsTable({ films }: FilmsTableProps) {
  if (films.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-none border border-border bg-surface p-12">
        <FilmIcon className="h-12 w-12 text-primary/30" />
        <p className="mt-4 text-sm text-primary/70">No films uploaded yet</p>
        <Link href="/studio/upload">
          <Button className="mt-4">Upload Your First Film</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-none border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Poster</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Views</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {films.map((film) => (
            <TableRow key={film.id}>
              <TableCell>
                {film.poster_url ? (
                  <div className="relative h-16 w-28 overflow-hidden rounded-none border border-border">
                    <Image
                      src={film.poster_url}
                      alt={film.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-28 items-center justify-center rounded-none border border-border bg-background">
                    <FilmIcon className="h-6 w-6 text-primary/30" />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium text-primary">{film.title}</div>
                  {film.description && (
                    <div className="mt-1 text-sm text-primary/70 line-clamp-1">
                      {film.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    film.status === "live" ? "default" : "secondary"
                  }
                >
                  {film.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-primary/70">
                  <Eye className="h-4 w-4" />
                  {film.views || 0}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/studio/films/${film.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


