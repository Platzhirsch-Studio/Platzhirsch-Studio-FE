"use client";

import { useRef, useState, useEffect } from "react";

const FadeInView = ({
    children,
    className = "",
    as: Tag = "div",
    duration = 500,
    delay = 0,
    direction = "right", // "top", "bottom", "left", "right", "none"
    distance = 30,
    scale = 1,
    scaleX = 1,
    threshold = 0.1,
    once = true,
}) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    // Staggers are passed as index * 70–150 ms; on long grids (40 brands) that
    // added up to ~3 s of blank cards. Nothing should wait longer than 600 ms.
    const stagger = Math.min(delay, 600);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (once) observer.disconnect();
                } else if (!once) {
                    setIsVisible(false);
                }
            },
            { threshold }
        );

        if (ref.current) observer.observe(ref.current);
        // Safety net: whatever happens with the observer (fast scrolling,
        // automation, zoomed layouts, an element already past the viewport),
        // the content is shown after 1.2 s — it must never stay at opacity 0.
        const fallback = setTimeout(() => setIsVisible(true), 1200);
        return () => {
            observer.disconnect();
            clearTimeout(fallback);
        };
    }, [threshold, once]);

    const getTransform = () => {
        if (isVisible) {
            // Reset all transforms when visible
            let transform = "translate(0, 0)";
            if (scale !== 1) transform += " scale(1)";
            if (scaleX !== 1) transform += " scaleX(1)";
            return transform;
        }

        let transform = "";

        // Add translate based on direction
        switch (direction) {
            case "top":
                transform = `translate(0, -${distance}px)`;
                break;
            case "bottom":
                transform = `translate(0, ${distance}px)`;
                break;
            case "left":
                transform = `translate(-${distance}px, 0)`;
                break;
            case "right":
                transform = `translate(${distance}px, 0)`;
                break;
            case "none":
                transform = "translate(0, 0)";
                break;
            default:
                transform = `translate(${distance}px, 0)`;
        }

        // Add scale if needed
        if (scale !== 1) {
            transform += ` scale(${scale})`;
        }

        // Add scaleX if needed
        if (scaleX !== 1) {
            transform += ` scaleX(${scaleX})`;
        }

        return transform;
    };

    return (
        <Tag
            ref={ref}
            className={className}
            // Hook for the <noscript> rule in [locale]/layout.js that forces
            // this content visible when JavaScript doesn't run (crawlers,
            // JS-off) — the inline opacity:0 below would otherwise hide it.
            data-fade-in=""
            style={{
                transition: `
opacity ${duration}ms cubic-bezier(0.4,0,0.2,1) ${stagger}ms,
transform ${duration}ms cubic-bezier(0.4,0,0.2,1) ${stagger}ms
`,
                opacity: isVisible ? 1 : 0,  // FIXED: Always apply opacity
                transform: getTransform(),
                transformOrigin: "center",
                willChange: "opacity, transform"
            }}
        >
            {children}
        </Tag>
    );
};

export default FadeInView;