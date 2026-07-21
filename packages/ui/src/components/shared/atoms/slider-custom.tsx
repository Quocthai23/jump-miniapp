import * as React from "react";

interface SliderCustomProps {
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  color?: "primary" | "error";
  numDots?: number;
  disabled?: boolean;
  className?: string;
  onValueCommit?: (value: number[]) => void;
  onValueChange?: (value: number[]) => void;
}

const SliderCustom = React.forwardRef<HTMLDivElement, SliderCustomProps>(
  (
    {
      value = [0],
      defaultValue = [0],
      min = 0,
      max = 100,
      step = 1,
      color = "primary",
      numDots = 0,
      disabled = false,
      className = "",
      onValueCommit,
      onValueChange,
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(
      value?.[0] ?? defaultValue[0],
    );
    const [isDragging, setIsDragging] = React.useState(false);
    const sliderRef = React.useRef<HTMLDivElement>(null);
    const rafIdRef = React.useRef<number | null>(null);
    const lastCommittedValueRef = React.useRef<number>(
      value?.[0] ?? defaultValue[0],
    );
    const lastValueRef = React.useRef<number>(
      value?.[0] ?? defaultValue[0] ?? 0,
    );

    const currentValue = value?.[0] ?? internalValue;

    // Memoize percentage calculation
    const percentage = React.useMemo(
      () =>
        typeof currentValue === "number" && typeof max === "number" && max !== 0
          ? (currentValue / max) * 100
          : 0,
      [currentValue, max],
    );

    // Memoize dot positions
    const dotPositions = React.useMemo(
      () =>
        numDots > 1
          ? Array.from({ length: numDots }, (_, i) => (i / (numDots - 1)) * 100)
          : [],
      [numDots],
    );

    const updateValue = React.useCallback(
      (clientX: number, isCommit: boolean = false) => {
        if (!sliderRef.current || disabled) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const percent = Math.max(
          0,
          Math.min(100, ((clientX - rect.left) / rect.width) * 100),
        );
        const rawValue = (percent / 100) * max;
        const steppedValue = Math.round(rawValue / step) * step;
        const clampedValue = Math.max(min, Math.min(max, steppedValue));

        // Store the last value for commit
        lastValueRef.current = clampedValue;

        // Update local state immediately for smooth UI
        if (value === undefined) {
          setInternalValue(clampedValue);
        }

        // Only call onValueChange during drag, not on commit
        if (!isCommit) {
          onValueChange?.([clampedValue]);
        }

        // Only call onValueCommit when explicitly committing (mouse up)
        if (isCommit) {
          lastCommittedValueRef.current = clampedValue;
          onValueCommit?.([clampedValue]);
        }
      },
      [min, max, step, disabled, value, onValueCommit, onValueChange],
    );

    const handleMouseDown = React.useCallback(
      (e: React.MouseEvent) => {
        if (disabled) return;
        e.preventDefault();
        setIsDragging(true);
        updateValue(e.clientX, false);
      },
      [disabled, updateValue],
    );

    const handleMouseMove = React.useCallback(
      (e: MouseEvent) => {
        if (!isDragging || disabled) return;

        // Cancel previous RAF if exists
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
        }

        // Use requestAnimationFrame for smooth updates
        rafIdRef.current = requestAnimationFrame(() => {
          updateValue(e.clientX, false);
          rafIdRef.current = null;
        });
      },
      [isDragging, disabled, updateValue],
    );

    const handleMouseUp = React.useCallback(() => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      setIsDragging(false);
      // Commit the last value that was set during drag
      const finalValue =
        lastValueRef.current ?? value?.[0] ?? defaultValue[0] ?? 0;
      lastCommittedValueRef.current = finalValue;
      onValueCommit?.([finalValue]);
    }, [onValueCommit]);

    React.useEffect(() => {
      if (isDragging) {
        window.addEventListener("mousemove", handleMouseMove, {
          passive: true,
        });
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("mouseup", handleMouseUp);
          if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
          }
        };
      }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value[0]);
        lastCommittedValueRef.current = value[0];
      }
    }, [value]);

    return (
      <div ref={ref} className={`relative h-4 w-full ${className}`}>
        <div
          ref={sliderRef}
          className="relative z-30 flex w-full touch-none items-center select-none"
          onMouseDown={handleMouseDown}
          style={{ cursor: disabled ? "not-allowed" : "pointer" }}
        >
          {/* Track */}
          <div className="relative z-0 h-1 w-full overflow-visible rounded-full bg-neutral-900">
            {/* Range */}
            <div
              className="absolute z-0 h-full rounded-full bg-[#C1FF7A]"
              style={{ width: `${percentage}%` }}
            />
            {/* Progress dots/marks */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-between">
              {dotPositions.map((mark, index) => {
                const isActive = percentage >= mark;
                return (
                  <div
                    key={index}
                    className={`h-2.5 w-2.5 rounded-full transition-colors duration-200 ${
                      isActive
                        ? color === "error"
                          ? "bg-[#59881E]"
                          : "bg-[#59881E]"
                        : "bg-neutral-600"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Thumb */}
          <button
            type="button"
            onMouseDown={handleMouseDown}
            className={`absolute z-50 overflow-visible rounded-full border-none bg-transparent p-0 transition-transform ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            } ${disabled ? "pointer-events-none opacity-50" : "pointer-events-auto"}`}
            style={{
              width: "24px",
              height: "24px",
              left: `calc(${percentage}% - 12px)`,
            }}
          >
            <img
              src="/logo/logo.svg"
              alt="Logo"
              width={24}
              height={24}
              className="pointer-events-none object-contain"
              // unoptimized
              // priority
              draggable={false}
            />
          </button>
        </div>
      </div>
    );
  },
);

SliderCustom.displayName = "SliderCustom";

export { SliderCustom };
