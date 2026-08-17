import { Home, Search, Library, Crown, PlusCircle, Heart, Clock, Globe, Download } from "lucide-react";
import { NavLink } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";

const mainLinks = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/countries", icon: Globe, label: "Countries" },
  { to: "/library", icon: Library, label: "Your Library" },
  { to: "/premium", icon: Crown, label: "Premium" },
  { to: "/create", icon: PlusCircle, label: "Create" },
];

const libraryLinks = [
  { to: "/downloads", icon: Download, label: "Downloads" },
  { to: "/liked", icon: Heart, label: "Liked Songs" },
  { to: "/recent", icon: Clock, label: "Recently Played" },
];

export default function AppSidebar() {
  return (
    <aside className="hidden md:flex flex-col w-[240px] bg-black/45 backdrop-blur-xl border-r border-white/10 h-full overflow-y-auto scrollbar-thin">
      <div className="p-6">
        <BrandLogo size={40} showWordmark />
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {mainLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`
                }
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="my-4 border-t border-border" />

        <ul className="space-y-1">
          {libraryLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`
                }
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
