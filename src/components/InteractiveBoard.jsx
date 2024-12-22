import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "./Icon";

// Define possible shapes for the icons
const shapes = ["circle", "triangle", "star", "rareStar"];

// Helper to get a random hex color
function randomColor() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
}

// Helper to pick a random shape (5% chance it's "rareStar")
function randomShape() {
  return Math.random() < 0.05
    ? "rareStar"
    : shapes[Math.floor(Math.random() * 3)];
}

// Random position within given max (we'll use window.innerWidth/innerHeight)
function randomPos(max) {
  return Math.random() * max;
}

export default function InteractiveBoard() {
  const [icons, setIcons] = useState([]);
  const [cursor, setCursor] = useState({ x: -9999, y: -9999 });
  const iconIdRef = useRef(0);

  // Track cursor position
  const handleMouseMove = useCallback((e) => {
    setCursor({ x: e.clientX, y: e.clientY });
  }, []);

  // Generate initial icons
  useEffect(() => {
    // Guard if window is undefined (in non-browser environments)
    if (typeof window === "undefined") return;

    const initialCount = 20;
    const newIcons = [];
    for (let i = 0; i < initialCount; i++) {
      iconIdRef.current += 1;
      newIcons.push({
        id: iconIdRef.current,
        shape: randomShape(),
        color: randomColor(),
        x: randomPos(window.innerWidth - 30),
        y: randomPos(window.innerHeight - 30),
      });
    }
    setIcons(newIcons);
  }, []);

  // Add a new icon every 5 seconds, from a random screen edge
  useEffect(() => {
    if (typeof window === "undefined") return;

    const interval = setInterval(() => {
      iconIdRef.current += 1;

      const sides = ["left", "right", "top", "bottom"];
      const side = sides[Math.floor(Math.random() * sides.length)];
      let x = 0;
      let y = 0;

      // pick a random target position
      const targetX = randomPos(window.innerWidth - 30);
      const targetY = randomPos(window.innerHeight - 30);

      // Decide entry coordinates
      switch (side) {
        case "left":
          x = -50;
          y = targetY;
          break;
        case "right":
          x = window.innerWidth + 50;
          y = targetY;
          break;
        case "top":
          x = targetX;
          y = -50;
          break;
        case "bottom":
          x = targetX;
          y = window.innerHeight + 50;
          break;
        default:
          // fallback (shouldn't happen normally)
          x = 0;
          y = 0;
      }

      const newIcon = {
        id: iconIdRef.current,
        shape: randomShape(),
        color: randomColor(),
        x,
        y,
        // We'll pass these "target" coords so the Icon can animate from (x,y) to (targetX, targetY) quickly
        targetX,
        targetY,
        entering: true,
      };

      setIcons((prev) => [...prev, newIcon]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Limit the total icon count
  useEffect(() => {
    if (icons.length > 100) {
      // keep only the newest 100
      setIcons((prev) => prev.slice(prev.length - 100));
    }
  }, [icons]);

  // If no icons yet, just render an empty container
  if (icons.length === 0) {
    return <div className="w-full h-full" onMouseMove={handleMouseMove} />;
  }

  return (
    <div className="w-full h-full relative" onMouseMove={handleMouseMove}>
      {icons.map((iconData) => (
        <Icon
          key={iconData.id}
          shape={iconData.shape}
          color={iconData.color}
          initialX={iconData.x}
          initialY={iconData.y}
          targetX={iconData.targetX}
          targetY={iconData.targetY}
          entering={iconData.entering}
          cursor={cursor}
        />
      ))}
    </div>
  );
}
