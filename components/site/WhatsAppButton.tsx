"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { site } from "@/lib/site";

const WHATSAPP_NUMBER = site.whatsapp; // set it in lib/site.ts

const DRAG_THRESHOLD_PX = 6;

export function WhatsAppButton() {
  const t = useTranslations("whatsapp");
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const dragState = useRef({
    dragging: false,
    moved: false,
    pointerId: 0,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0
  });

  // Position is stored as distance from bottom-right so it stays put on resize.
  const [position, setPosition] = useState({ right: 20, bottom: 96 });

  useEffect(() => {
    function clampToViewport(right: number, bottom: number) {
      const size = 56;
      const maxRight = window.innerWidth - size - 8;
      const maxBottom = window.innerHeight - size - 8;
      return {
        right: Math.min(Math.max(right, 8), Math.max(maxRight, 8)),
        bottom: Math.min(Math.max(bottom, 8), Math.max(maxBottom, 8))
      };
    }

    function handlePointerMove(e: PointerEvent) {
      const state = dragState.current;
      if (!state.dragging) return;

      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;

      if (!state.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
        state.moved = true;
      }
      if (!state.moved) return;

      const nextRight = state.originX - dx;
      const nextBottom = state.originY - dy;
      setPosition(clampToViewport(nextRight, nextBottom));
    }

    function handlePointerUp(e: PointerEvent) {
      const state = dragState.current;
      if (!state.dragging) return;
      state.dragging = false;
      buttonRef.current?.releasePointerCapture(state.pointerId);

      if (state.moved) {
        // Prevent the click that a pointerup would otherwise fire after a drag.
        e.preventDefault();
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  function handlePointerDown(e: React.PointerEvent<HTMLAnchorElement>) {
    dragState.current = {
      dragging: true,
      moved: false,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: position.right,
      originY: position.bottom
    };
    buttonRef.current?.setPointerCapture(e.pointerId);
  }

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (dragState.current.moved) {
      e.preventDefault();
    }
  }

  return (
    <a
      ref={buttonRef}
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t("message"))}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("ariaLabel")}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      style={{ right: position.right, bottom: position.bottom }}
      className="fixed z-50 flex h-14 w-14 touch-none select-none items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_0_0_3px_#08121f,0_0_0_4px_#e4ae3c,0_12px_28px_-8px_rgba(0,0,0,0.7)] transition-transform active:scale-95"
    >
      <WhatsAppIcon />
    </a>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="currentColor" aria-hidden>
      <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.348.687 4.535 1.87 6.373L4 29l7.83-1.84A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.75a9.7 9.7 0 0 1-4.95-1.36l-.355-.21-4.646 1.092 1.117-4.53-.232-.37A9.72 9.72 0 1 1 25.72 15c0 5.376-4.373 9.75-9.716 9.75Zm5.34-7.297c-.293-.147-1.734-.856-2.003-.954-.269-.098-.464-.147-.66.147-.195.293-.756.954-.927 1.15-.171.196-.342.22-.635.073-.293-.147-1.237-.456-2.357-1.454-.871-.777-1.46-1.737-1.63-2.03-.171-.293-.018-.451.129-.598.132-.132.293-.343.44-.514.147-.171.196-.293.293-.489.098-.196.049-.367-.024-.514-.073-.147-.66-1.59-.905-2.177-.238-.572-.48-.494-.66-.503l-.562-.01c-.196 0-.514.073-.783.367-.269.293-1.026 1.003-1.026 2.446 0 1.443 1.05 2.837 1.196 3.032.147.196 2.066 3.155 5.007 4.425.7.302 1.246.483 1.672.618.702.223 1.34.192 1.845.117.563-.084 1.734-.708 1.978-1.392.244-.685.244-1.271.171-1.393-.073-.122-.269-.196-.562-.343Z" />
    </svg>
  );
}
