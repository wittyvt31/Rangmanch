import { UploadForm } from "@/features/studio/upload/UploadForm";

export const dynamic = "force-dynamic";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-primary">Upload Film</h1>
        <p className="mt-2 text-sm text-primary/70">
          Share your creation with the world
        </p>
      </div>

      <UploadForm />
    </div>
  );
}

