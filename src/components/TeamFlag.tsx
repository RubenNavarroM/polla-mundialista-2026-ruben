import Image from "next/image";

interface Props {
  name: string;
  flag: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

const sizes = { sm: 24, md: 32, lg: 48 };

export function TeamFlag({ name, flag, size = "md", showName = true }: Props) {
  const px = sizes[size];
  const h = Math.round(px * 0.67);
  const initials = (name ?? "?").slice(0, 3).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="rounded-md overflow-hidden border border-border shadow-sm flex-shrink-0 flex items-center justify-center bg-surface"
        style={{ width: px, height: h }}
      >
        {flag ? (
          <Image
            src={flag}
            alt={name}
            width={px}
            height={h}
            className="object-cover w-full h-full"
            unoptimized
          />
        ) : (
          <span className="text-[10px] font-bold text-text-secondary">{initials}</span>
        )}
      </div>
      {showName && (
        <span className="text-xs text-text-secondary text-center leading-tight max-w-[64px] truncate">
          {name}
        </span>
      )}
    </div>
  );
}
