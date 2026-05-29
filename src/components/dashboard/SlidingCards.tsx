import { Link } from "react-router-dom";
import {
  UserPlus,
  IndianRupee,
  Bell,
  BarChart3,
} from "lucide-react";

const cards = [
  {
    title: "Add New Tenant",
    subtitle: "Start digital onboarding",
    icon: UserPlus,
    color: "from-blue-600 to-blue-500",
    href: "/tenants/add",
  },
  {
    title: "Collect Rent",
    subtitle: "Track pending dues",
    icon: IndianRupee,
    color: "from-emerald-600 to-emerald-500",
    href: "/payments",
  },
  {
    title: "Send Reminder",
    subtitle: "Notify pending tenants",
    icon: Bell,
    color: "from-violet-600 to-violet-500",
    href: "/notifications",
  },
  {
    title: "Analytics",
    subtitle: "View PG performance",
    icon: BarChart3,
    color: "from-amber-500 to-orange-400",
    href: "/analytics",
  },
];

export function SlidingCards() {
  return (
    <div className="relative w-full">
      <div
        className="
          flex
          gap-4
          overflow-x-auto
          scrollbar-hide
          snap-x
          snap-mandatory

          pb-2

          [-ms-overflow-style:none]
          [scrollbar-width:none]
        "
      >
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.title}
              to={card.href}
              className={`
                snap-start
                shrink-0

                w-[82%]
                sm:w-[320px]

                rounded-3xl
                bg-gradient-to-br
                ${card.color}

                p-5
                text-white
                overflow-hidden
                relative
              `}
            >
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10" />

              <div className="relative flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">
                    {card.title}
                  </h3>

                  <p className="mt-2 text-sm text-white/80">
                    {card.subtitle}
                  </p>

                  <div className="mt-5 inline-flex rounded-xl bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                    Open
                  </div>
                </div>

                <div className="ml-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <Icon className="h-7 w-7" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}