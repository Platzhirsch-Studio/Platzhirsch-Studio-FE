import RoomVisual from "./RoomVisual";

// Rendering of a variant: the real image (served by the authenticated
// rendering route) or the vector placeholder. 16:10, fills its container.

export default function VariantImage({ variant, scene, className = "", priority = false }) {
  if (variant?.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- private, session-bound image; next/image optimiser can't forward the cookie
      <img
        src={variant.imageUrl}
        alt={variant.title}
        className={`block h-full w-full object-cover ${className}`}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
      />
    );
  }
  return <RoomVisual scene={scene || variant?.scene} title={variant?.title} className={`block h-full w-full ${className}`} />;
}
