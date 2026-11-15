import Image from "next/image";
import type { ArticleMediaItem, MediaType } from "@/types";

interface Props {
  url: string;
  type: MediaType;
  alt?: string | null;
  priority?: boolean;
  gallery?: ArticleMediaItem[];
}

export function MediaBlock({ url, type, alt, priority, gallery }: Props) {
  if (type === "VIDEO") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <video controls className="h-full w-full object-cover" poster={undefined}>
          <source src={url} />
        </video>
      </div>
    );
  }

  if (type === "GALLERY" && gallery && gallery.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {gallery.map((item) => (
          <div key={item.id} className="relative aspect-square overflow-hidden rounded-xl">
            <Image
              src={item.url}
              alt={item.alt ?? ""}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
      <Image
        src={url}
        alt={alt ?? ""}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 768px"
        className="object-cover"
      />
    </div>
  );
}
