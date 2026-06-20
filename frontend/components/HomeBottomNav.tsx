"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { cn } from "@/lib/cn";

export type HomeTab = "workout" | "food-tracker" | "history" | "coach" | "profile";

type TabConfig = {
  id: HomeTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

interface HomeBottomNavProps {
  tabs: TabConfig[];
  activeTab: HomeTab;
  onTabChange: (tab: HomeTab) => void;
}

export function HomeBottomNav({
  tabs,
  activeTab,
  onTabChange,
}: HomeBottomNavProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 72 });

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const index = tabs.findIndex((tab) => tab.id === activeTab);
      const tab = tabRefs.current[index];
      const track = trackRef.current;

      if (!tab || !track) {
        return;
      }

      const trackRect = track.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      const width = Math.max(tabRect.width + 10, 68);
      const left = tabRect.left - trackRect.left + (tabRect.width - width) / 2;

      setIndicator({ left, width });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);

    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab, tabs]);

  return (
    <nav className="home-bottom-nav" aria-label="Home sections">
      <div ref={trackRef} className="home-bottom-nav__track">
        <div
          className="home-bottom-nav__glass"
          aria-hidden
          style={{
            left: indicator.left,
            width: indicator.width,
          }}
        />
        {tabs.map(({ id, label, icon: Icon }, index) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onTabChange(id)}
              className={cn(
                "home-bottom-nav__tab",
                isActive && "home-bottom-nav__tab--active",
              )}
            >
              <Icon
                className={cn(
                  "home-bottom-nav__icon size-6",
                  isActive && "home-bottom-nav__icon--active",
                )}
              />
              {isActive ? (
                <span className="home-bottom-nav__label">{label}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
