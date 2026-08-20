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
        return () => observer.disconnect();
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
            style={{
                transition: `
opacity ${duration}ms cubic-bezier(0.4,0,0.2,1) ${delay}ms,
transform ${duration}ms cubic-bezier(0.4,0,0.2,1) ${delay}ms
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