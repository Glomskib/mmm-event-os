"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Trash2, Eye, EyeOff, Film } from "lucide-react";
import type { addFilm, toggleFilmActive, deleteFilm } from "./actions";

interface FilmRow {
  id: string;
  title: string;
  description: string | null;
  trailer_url: string | null;
  poster_url: string | null;
  active: boolean;
  created_at: string;
}

export function FilmsClient({
  films: initialFilms,
  orgId,
  addFilmAction,
  toggleFilmActiveAction,
  deleteFilmAction,
}: {
  films: FilmRow[];
  orgId: string;
  addFilmAction: typeof addFilm;
  toggleFilmActiveAction: typeof toggleFilmActive;
  deleteFilmAction: typeof deleteFilm;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");

  function handleAdd() {
    if (!title.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await addFilmAction({ orgId, title: title.trim(), description: description.trim() || undefined, trailerUrl: trailerUrl.trim() || undefined, posterUrl: posterUrl.trim() || undefined });
      if (res.ok) {
        setTitle(""); setDescription(""); setTrailerUrl(""); setPosterUrl("");
        setShowForm(false);
        router.refresh();
      } else {
        setError(res.error ?? "Failed to add film");
      }
    });
  }

  function handleToggle(filmId: string) {
    startTransition(async () => {
      await toggleFilmActiveAction(filmId);
      router.refresh();
    });
  }

  function handleDelete(filmId: string, filmTitle: string) {
    if (!confirm(`Delete "${filmTitle}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteFilmAction(filmId);
      if (!res.ok) setError(res.error ?? "Failed to delete");
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <Button size="sm" onClick={() => setShowForm(!showForm)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Add Film
      </Button>

      {showForm && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-1">
              <Label htmlFor="film-title">Title *</Label>
              <Input id="film-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Film title" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="film-description">Description</Label>
              <Textarea id="film-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="film-trailer">YouTube / Vimeo URL</Label>
              <Input id="film-trailer" value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="film-poster">Poster image URL</Label>
              <Input id="film-poster" value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={isPending || !title.trim()}>
                {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
                Add
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {initialFilms.length === 0 ? (
        <div className="py-20 text-center">
          <Film className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">No films yet. Add one above.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialFilms.map((film) => (
            <Card key={film.id} className={film.active ? "" : "opacity-60"}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{film.title}</CardTitle>
                  <Badge variant={film.active ? "default" : "secondary"} className="shrink-0 text-xs">
                    {film.active ? "Active" : "Hidden"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {film.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{film.description}</p>
                )}
                {film.poster_url && (
                  <div className="aspect-video overflow-hidden rounded-md bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={film.poster_url} alt={film.title} className="h-full w-full object-cover" />
                  </div>
                )}
                {film.trailer_url && (
                  <p className="truncate text-xs text-muted-foreground">{film.trailer_url}</p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleToggle(film.id)} disabled={isPending}>
                    {film.active ? <EyeOff className="mr-1 h-3.5 w-3.5" /> : <Eye className="mr-1 h-3.5 w-3.5" />}
                    {film.active ? "Hide" : "Show"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(film.id, film.title)} disabled={isPending}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
