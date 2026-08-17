const SHOTS = [
  {
    src: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1800&q=70",
    alt: "Concert lights",
  },
  {
    src: "https://images.unsplash.com/photo-1516450137517-597bf25df413?auto=format&fit=crop&w=1800&q=70",
    alt: "Stage performance",
  },
  {
    src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1800&q=70",
    alt: "Singer in lights",
  },
  {
    src: "https://images.unsplash.com/photo-1459749411177-04aa500391d2?auto=format&fit=crop&w=1800&q=70",
    alt: "Festival night",
  },
  {
    src: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1800&q=70",
    alt: "Studio session",
  },
];

export default function AmbientBackdrop() {
  return (
    <div className="ambient-backdrop" aria-hidden="true">
      <div className="ambient-photos">
        {SHOTS.map((shot, index) => (
          <img
            key={shot.src}
            src={shot.src}
            alt=""
            className="ambient-photo"
            style={{ animationDelay: `${index * 7}s` }}
            decoding="async"
          />
        ))}
      </div>
      <div className="ambient-wash" />
      <div className="ambient-orb ambient-orb-a" />
      <div className="ambient-orb ambient-orb-b" />
      <div className="ambient-orb ambient-orb-c" />
      <div className="ambient-vignette" />
      <div className="ambient-grain" />
    </div>
  );
}
