import { Home, Search, Globe, Library, Crown } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/countries", icon: Globe, label: "World" },
  { to: "/library", icon: Library, label: "Library" },
  { to: "/premium", icon: Crown, label: "Premium" },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-[72px] left-0 right-0 bg-black/70 backdrop-blur-xl border-t border-white/10 z-40">
      <div className="flex justify-around py-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
