import { useEffect, useRef } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import PropTypes from "prop-types";

export default function Icon({
  shape,
  color,
  initialX,
  initialY,
  targetX,
  targetY,
  entering = false,
  cursor,
}) {
  const x = useMotionValue(initialX);
  const y = useMotionValue(initialY);
  const iconRef = useRef(null);

  // 1. Enter from screen edge to target
  useEffect(() => {
    if (entering && targetX != null && targetY != null) {
      animate(x, targetX, { duration: 0.7, ease: "easeOut" });
      animate(y, targetY, { duration: 0.7, ease: "easeOut" });
    }
  }, [entering, targetX, targetY, x, y]);

  // 2. Random drifting with a single re-invocation
  useEffect(() => {
    let controlsX;
    let controlsY;
    let canceled = false;

    function doRandomDrift() {
      if (canceled) return;

      const driftX = Math.random() * 80 - 40; // ±40
      const driftY = Math.random() * 80 - 40; // ±40
      const duration = 3 + Math.random() * 3; // 3~6 s

      controlsX = animate(x, x.get() + driftX, { duration, ease: "easeInOut" });
      controlsY = animate(y, y.get() + driftY, { duration, ease: "easeInOut" });

      // When BOTH X & Y animations finish, do it again once
      Promise.all([controlsX, controlsY]).then(() => {
        if (!canceled) {
          doRandomDrift();
        }
      });
    }

    // Delay random drift slightly if entering
    const timer = setTimeout(
      () => {
        doRandomDrift();
      },
      entering ? 800 : 0
    );

    // Cleanup
    return () => {
      canceled = true;
      clearTimeout(timer);
      controlsX?.stop();
      controlsY?.stop();
    };
  }, [entering, x, y]);

  // 3. Flee logic: whenever cursor changes, if it's within 100px → move away
  useEffect(() => {
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    const iconCenterX = rect.left + rect.width / 2;
    const iconCenterY = rect.top + rect.height / 2;

    const distance = Math.hypot(iconCenterX - cursor.x, iconCenterY - cursor.y);
    if (distance < 100) {
      const angle = Math.atan2(iconCenterY - cursor.y, iconCenterX - cursor.x);
      const push = 50;
      animate(x, x.get() + Math.cos(angle) * push, {
        duration: 0.3,
        ease: "easeOut",
      });
      animate(y, y.get() + Math.sin(angle) * push, {
        duration: 0.3,
        ease: "easeOut",
      });
    }
  }, [cursor, x, y]);

  // Shapes
  let shapeStyle = "bg-current rounded-full w-8 h-8";
  switch (shape) {
    case "triangle":
      shapeStyle =
        "border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-current w-0 h-0";
      break;
    case "star":
      shapeStyle = "bg-current w-8 h-8 star-shape";
      break;
    case "rareStar":
      shapeStyle = "bg-yellow-400 w-12 h-12 star-shape";
      break;
    // circle by default
    default:
      break;
  }

  return (
    <motion.div
      ref={iconRef}
      className={`absolute ${shapeStyle}`}
      style={{
        color, // "bg-current" uses "color" as the fill
        x,
        y,
      }}
    />
  );
}

Icon.propTypes = {
  shape: PropTypes.oneOf(["circle", "triangle", "star", "rareStar"]).isRequired,
  color: PropTypes.string.isRequired,
  initialX: PropTypes.number.isRequired,
  initialY: PropTypes.number.isRequired,
  targetX: PropTypes.number,
  targetY: PropTypes.number,
  entering: PropTypes.bool,
  cursor: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
};

Icon.defaultProps = {
  targetX: null,
  targetY: null,
  entering: false,
};
