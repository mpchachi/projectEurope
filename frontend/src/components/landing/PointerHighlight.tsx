import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

export const PointerHighlight = ({
  children,
  pointerClassName,
  containerClassName,
}: {
  children: React.ReactNode;
  pointerClassName?: string;
  containerClassName?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });

  return (
    <span
      ref={ref}
      className={containerClassName}
      style={{
        display: "inline",
        backgroundImage: "linear-gradient(#FF4785, #FF4785)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "0% 100%",
        backgroundSize: inView ? "100% 2px" : "0% 2px",
        transition: "background-size 0.7s ease 0.15s",
        paddingBottom: 2,
      }}
    >
      <motion.span
        aria-hidden
        className={pointerClassName}
        style={{ top: -18, left: -4, lineHeight: 1, pointerEvents: "none", position: "absolute" }}
        initial={{ opacity: 0, y: 5 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }}
        transition={{ delay: 0.55, duration: 0.2 }}
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path
            d="M1.5 1.5L6.5 12.5L8.5 8.5L12.5 6.5L1.5 1.5Z"
            fill="#FF4785"
            stroke="#FF4785"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </svg>
      </motion.span>
      {children}
    </span>
  );
};
