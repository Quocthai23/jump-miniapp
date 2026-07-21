import type { MarketData } from "@/state/market";
import { useTradingContextStore } from "@/state/trading/tradingContextStore";
import { formatPrice } from "@/utils/price";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface LeverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLeverage?: number;
  onLeverageChange?: (leverage: number) => void;
  maxLeverage: number;
  currentSymbolData: MarketData | null;
}

export function LeverageModal({
  isOpen,
  onClose,
  currentLeverage = 20,
  onLeverageChange,
  maxLeverage,
  currentSymbolData,
}: LeverageModalProps) {
  const CONFIG = {
    min: 1,
    max: maxLeverage,
    gap: 32,
    friction: 0.92,
    snapStrength: 0.2,
  };
  const [displayValue, setDisplayValue] = useState(currentLeverage);
  const trackRef = useRef<HTMLDivElement>(null);
  const sliderRootRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    currentX: 0,
    isDragging: false,
    startX: 0,
    currentScroll: 0,
    velocity: 0,
    lastMoveTime: 0,
    rafId: null as number | null,
    lastDisplayValue: currentLeverage,
  });
  useEffect(() => {
    if (!trackRef.current || !sliderRootRef.current) return;

    const track = trackRef.current;
    const sliderRoot = sliderRootRef.current;
    const state = stateRef.current;

    // Initialize track with ticks
    const screenCenter = sliderRoot.clientWidth / 2;
    track.innerHTML = "";

    for (let i = CONFIG.min; i <= CONFIG.max; i++) {
      const tick = document.createElement("div");
      const leftPos = (i - CONFIG.min) * CONFIG.gap + screenCenter;
      tick.className =
        "absolute top-0 flex flex-col items-center justify-start w-10 -ml-5 tick-item";
      tick.style.left = `${leftPos}px`;
      tick.dataset.val = String(i);

      const isMajor = i % 5 === 0 || i === CONFIG.min || i === CONFIG.max;
      const hClass = isMajor ? "h-6 bg-gray-500" : "h-3 bg-gray-800";
      const numHtml = isMajor
        ? `<div class="mt-4 text-[11px] font-semibold text-gray-600 transition-opacity tick-num">${i}</div>`
        : ``;

      tick.innerHTML = `<div class="w-[2px] rounded-full ${hClass} transition-all tick-mark"></div>${numHtml}`;
      track.appendChild(tick);
    }

    // Set initial position
    const initialOffset = -(currentLeverage - CONFIG.min) * CONFIG.gap;
    state.currentX = initialOffset;

    // Render loop
    const render = () => {
      if (!state.isDragging) {
        state.velocity *= CONFIG.friction;
        state.currentX += state.velocity;

        if (Math.abs(state.velocity) < 0.5) {
          const snappedX = Math.round(state.currentX / CONFIG.gap) * CONFIG.gap;
          state.currentX += (snappedX - state.currentX) * CONFIG.snapStrength;
          if (Math.abs(state.currentX - snappedX) < 0.5) {
            state.velocity = 0;
            state.currentX = snappedX;
          }
        }
      }

      // Boundary
      const minScroll = -((CONFIG.max - CONFIG.min) * CONFIG.gap);
      const maxScroll = 0;

      if (state.currentX > maxScroll) {
        state.currentX = state.isDragging
          ? state.currentX
          : state.currentX * 0.8;
      }
      if (state.currentX < minScroll) {
        state.currentX = state.isDragging
          ? state.currentX
          : minScroll + (state.currentX - minScroll) * 0.8;
      }

      // Apply transform
      track.style.transform = `translateX(${state.currentX}px)`;

      // Calculate display value
      const rawVal = Math.abs(state.currentX) / CONFIG.gap;
      let newDisplayVal = Math.round(rawVal) + CONFIG.min;
      if (newDisplayVal < CONFIG.min) newDisplayVal = CONFIG.min;
      if (newDisplayVal > CONFIG.max) newDisplayVal = CONFIG.max;

      if (newDisplayVal !== state.lastDisplayValue) {
        state.lastDisplayValue = newDisplayVal;
        setDisplayValue(newDisplayVal);
        if (navigator.vibrate) navigator.vibrate(5);
      }

      updateVisuals(state.currentX);
      state.rafId = requestAnimationFrame(render);
    };

    const updateVisuals = (currentPos: number) => {
      const center = Math.abs(currentPos);
      const centerIdx = center / CONFIG.gap;
      const viewportTicks = 10;
      const startNode = Math.max(0, Math.floor(centerIdx - viewportTicks));
      const endNode = Math.min(
        CONFIG.max - CONFIG.min,
        Math.ceil(centerIdx + viewportTicks),
      );
      const ticks = track.children;

      for (let i = startNode; i <= endNode; i++) {
        const tick = ticks[i] as HTMLElement;
        if (!tick) continue;
        const dist = Math.abs(i - centerIdx);
        const mark = tick.querySelector(".tick-mark") as HTMLElement;
        const num = tick.querySelector(".tick-num") as HTMLElement;

        if (dist < 0.4) {
          if (num) num.style.opacity = "0";
          mark.style.opacity = "0";
        } else {
          if (num) {
            num.style.opacity = String(Math.max(0.1, 1 - dist / 5));
            const scale = dist < 1.5 ? 1.2 : 1;
            num.style.transform = `scale(${scale})`;
            num.style.color = dist < 2 ? "white" : "#4b5563";
          }
          mark.style.opacity = "1";
        }
      }
    };

    // Event handlers
    const startDrag = (clientX: number) => {
      state.isDragging = true;
      state.startX = clientX;
      state.currentScroll = state.currentX;
      state.velocity = 0;
      state.lastMoveTime = Date.now();
      sliderRoot.classList.add("cursor-grabbing");
      sliderRoot.classList.remove("cursor-grab");
    };

    const moveDrag = (clientX: number) => {
      if (!state.isDragging) return;
      const delta = clientX - state.startX;
      const newX = state.currentScroll + delta;
      state.velocity = newX - state.currentX;
      state.currentX = newX;
      state.lastMoveTime = Date.now();
    };

    const endDrag = () => {
      state.isDragging = false;
      sliderRoot.classList.remove("cursor-grabbing");
      sliderRoot.classList.add("cursor-grab");

      const now = Date.now();
      const timeSinceLastMove = now - state.lastMoveTime;
      if (timeSinceLastMove > 80) state.velocity = 0;

      const MAX_SPEED = 60;
      state.velocity = Math.max(
        Math.min(state.velocity, MAX_SPEED),
        -MAX_SPEED,
      );
    };

    const handleMouseDown = (e: MouseEvent) => startDrag(e.clientX);
    const handleMouseMove = (e: MouseEvent) => moveDrag(e.clientX);
    const handleMouseUp = () => endDrag();

    const handleTouchStart = (e: TouchEvent) => startDrag(e.touches[0].clientX);
    const handleTouchMove = (e: TouchEvent) => moveDrag(e.touches[0].clientX);
    const handleTouchEnd = () => endDrag();

    sliderRoot.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    sliderRoot.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    // Start render loop
    state.rafId = requestAnimationFrame(render);

    // Cleanup
    return () => {
      if (state.rafId) cancelAnimationFrame(state.rafId);
      sliderRoot.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      sliderRoot.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isOpen, currentLeverage]);

  const setTarget = (val: number) => {
    const state = stateRef.current;
    state.isDragging = false;
    const targetPos = -(val - CONFIG.min) * CONFIG.gap;
    const dist = targetPos - state.currentX;
    state.currentX = state.currentX + dist * 0.1;
    state.velocity = dist * 0.1;
  };

  const handleConfirm = () => {
    if (onLeverageChange) {
      onLeverageChange(displayValue);
    }
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300
        ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
      `}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          fixed bottom-0 left-0 right-0 z-50 w-full
          rounded-t-2xl surface-page-background p-6 shadow-2xl
          transform transition-all duration-500 ease-out
          ${isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
        `}
      >
        <div className="relative flex items-center justify-center py-4">
          <h2 className="body-subtitle-semibold text-primary-primary">
            Leverage
          </h2>
          <button
            onClick={onClose}
            className="absolute right-0 text-primary-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className=" py-8">
          <div className="mb-12 text-center">
            <div className="flex items-center justify-between gap-4 text-7xl font-bold tracking-tighter text-primary-primary">
              <button
                onClick={() => setTarget(CONFIG.min)}
                className=" button-primary-on-container text-primary-primary body-subtitle-semibold px-4 py-3 rounded-[12px] transition-colors"
              >
                Min
              </button>
              <span className="tabular-nums">{displayValue}x</span>
              <button
                onClick={() => setTarget(CONFIG.max)}
                className=" button-primary-on-container text-primary-primary body-subtitle-semibold px-4 py-3 rounded-[12px] transition-colors"
              >
                Max
              </button>
            </div>
          </div>

          <div className="w-full relative group">
            <div
              ref={sliderRootRef}
              className="relative h-28 w-full overflow-hidden cursor-grab active:cursor-grabbing"
              style={{
                maskImage:
                  "linear-gradient(90deg, transparent 0%, black 20%, black 80%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(90deg, transparent 0%, black 20%, black 80%, transparent 100%)",
              }}
            >
              {/* Center Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#0187FF] z-10 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                <div className="w-1 h-6 bg-[#0187FF] rounded-b-full shadow-[0_0_15px_rgba(1,135,255,0.8)]"></div>
              </div>

              {/* Track */}
              <div
                ref={trackRef}
                className="h-full relative will-change-transform"
                style={{ transform: "translateX(0px)" }}
              />
            </div>
          </div>

          {/* Warning Message */}
          <div className="mt-8 flex items-start gap-2 p-3 bg-red-50 rounded-lg">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-600 font-medium">
                You will be liquidated if price drops by{" "}
                {(100 / displayValue).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-primary-secondary body-body-regular">
              <span>Liquidation Price</span>
              <span className="text-red-500 body-subtitle-semibold">
                $90,802
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-secondary body-body-regular">
                Current price
              </span>
              <span className="text-primary-primary body-subtitle-semibold">
                $
                {formatPrice(
                  currentSymbolData?.price.toString() as string,
                  currentSymbolData?.decimals,
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="pb-6">
          <button
            onClick={handleConfirm}
            className="w-full bg-[#0187FF] text-white body-subtitle-semibold py-4 rounded-full transition-colors"
          >
            Set {displayValue}x
          </button>
        </div>
      </div>
    </div>
  );
}
