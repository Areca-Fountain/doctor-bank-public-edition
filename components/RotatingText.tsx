"use client";

import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface RotatingTextRef {
  next: () => void;
  prev: () => void;
  jumpTo: (index: number) => void;
}

interface RotatingTextProps {
  texts: string[];
  transition?: any;
  initial?: any;
  animate?: any;
  exit?: any;
  animatePresenceMode?: "sync" | "wait" | "popLayout";
  animatePresenceInitial?: boolean;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | "random" | number;
  loop?: boolean;
  auto?: boolean;
  splitBy?: "characters" | "words" | "lines" | string;
  onNext?: (index: number) => void;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
}

const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>((props, ref) => {
  const {
    texts,
    transition = { type: "spring", damping: 25, stiffness: 300 },
    initial = { y: "100%", opacity: 0 },
    animate = { y: 0, opacity: 1 },
    exit = { y: "-120%", opacity: 0 },
    animatePresenceMode = "wait",
    animatePresenceInitial = true,
    rotationInterval = 2000,
    staggerDuration = 0,
    staggerFrom = "first",
    loop = true,
    auto = true,
    splitBy = "characters",
    onNext,
    mainClassName = "",
    splitLevelClassName = "",
    elementLevelClassName = "",
    ...rest
  } = props;

  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    if (!auto) return;
    const interval = setInterval(() => {
      next();
    }, rotationInterval);
    return () => clearInterval(interval);
  }, [auto, currentTextIndex, rotationInterval, texts, loop]);

  const next = () => {
    const nextIndex =
      currentTextIndex === texts.length - 1
        ? loop
          ? 0
          : currentTextIndex
        : currentTextIndex + 1;
    if (nextIndex !== currentTextIndex) {
      setCurrentTextIndex(nextIndex);
      if (onNext) onNext(nextIndex);
    }
  };

  const prev = () => {
    const prevIndex =
      currentTextIndex === 0
        ? loop
          ? texts.length - 1
          : currentTextIndex
        : currentTextIndex - 1;
    if (prevIndex !== currentTextIndex) {
      setCurrentTextIndex(prevIndex);
    }
  };

  const jumpTo = (index: number) => {
    const validIndex = Math.max(0, Math.min(index, texts.length - 1));
    if (validIndex !== currentTextIndex) {
      setCurrentTextIndex(validIndex);
    }
  };

  useImperativeHandle(ref, () => ({
    next,
    prev,
    jumpTo,
  }));

  const splitIntoElements = (text: string) => {
    if (typeof splitBy === "string" && splitBy !== "characters" && splitBy !== "words" && splitBy !== "lines") {
      return text.split(splitBy);
    }
    if (splitBy === "words") return text.split(" ");
    if (splitBy === "lines") return text.split("\n");
    return text.split("");
  };

  const elements = splitIntoElements(texts[currentTextIndex]);

  return (
    <motion.span
      className={`inline-flex flex-wrap relative ${mainClassName}`}
      {...rest}
      layout
    >
      <span className="sr-only">{texts[currentTextIndex]}</span>
      <AnimatePresence
        mode={animatePresenceMode}
        initial={animatePresenceInitial}
      >
        <motion.div
          key={currentTextIndex}
          className={`flex flex-wrap w-full ${splitLevelClassName}`}
          layout
        >
          {elements.map((element, index) => {
            let delay = 0;
            if (staggerDuration > 0) {
              if (staggerFrom === "first") delay = index * staggerDuration;
              if (staggerFrom === "last") delay = (elements.length - 1 - index) * staggerDuration;
              if (staggerFrom === "center") {
                const center = Math.floor(elements.length / 2);
                delay = Math.abs(center - index) * staggerDuration;
              }
              if (staggerFrom === "random") delay = Math.random() * staggerDuration;
              if (typeof staggerFrom === "number") delay = Math.abs(staggerFrom - index) * staggerDuration;
            }

            return (
              <motion.span
                key={index}
                initial={initial}
                animate={animate}
                exit={exit}
                transition={{ ...transition, delay }}
                className={`inline-block ${elementLevelClassName} ${
                  element === " " ? "w-[0.3em]" : ""
                }`}
              >
                {element}
              </motion.span>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </motion.span>
  );
});

RotatingText.displayName = "RotatingText";
export default RotatingText;