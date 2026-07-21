import { useClearinghouseStore } from "@/state/clearinghouseStore";
import { ArrowRightLeft, Minus, Plus } from "lucide-react";

interface ModifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncreaseExposure?: () => void;
  onReduceExposure?: () => void;
  onReversePosition?: () => void;
}

export function ModifyModal({
  isOpen,
  onClose,
  onIncreaseExposure,
  onReduceExposure,
  onReversePosition,
}: ModifyModalProps) {
  const { currentPosition } = useClearinghouseStore();
  const isLong = currentPosition && parseFloat(currentPosition.szi) > 0;
  const fromDirection = isLong ? "Long" : "Short";
  const toDirection = isLong ? "Short" : "Long";
  const options = [
    {
      icon: (
        <div className="flex p-2 items-center justify-center rounded-[12px] bg-[#E6F3FF]">
          <Plus className="text-[#0187FF]" />
        </div>
      ),
      title: "Increase exposure",
      description: `Increase the size of your ${fromDirection.toLowerCase()} position`,
      action: onIncreaseExposure || (() => {}),
    },
    {
      icon: (
        <div className="flex p-2 items-center justify-center rounded-[12px] bg-[#E6F3FF]">
          <ArrowRightLeft className="text-[#0187FF]" />
        </div>
      ),
      title: "Reverse position",
      description: `Flip your ${fromDirection.toLowerCase()} to a ${toDirection.toLowerCase()}`,
      action: onReversePosition || (() => {}),
    },
  ];
  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300
        ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
      `}
      style={{ backgroundColor: "rgba(17, 17, 18, 0.6)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          fixed bottom-0 left-0 right-0 z-50 w-full
          rounded-t-2xl surface-page-background p-4 shadow-2xl
          transform transition-all duration-500 ease-out
          ${isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
        `}
      >
        <div className="mb-7 relative flex items-center justify-center mt-1">
          <h2 className="body-subtitle-semibold text-primary-primary">
            Modify
          </h2>
          <button
            onClick={onClose}
            className="absolute right-0 text-2xl leading-none text-primary-secondary hover:text-primary-primary transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 mb-3">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                option.action();
                onClose();
              }}
              className="w-full flex items-start gap-3 rounded-xl transition-colors text-left"
            >
              {/* Icon */}
              <div className="flex-shrink-0 pt-1">{option.icon}</div>

              {/* Text content */}
              <div className="flex-1">
                <h3 className="body-subtitle-semibold text-primary-primary text-primary-primary">
                  {option.title}
                </h3>
                <p className="text-sm text-primary-secondary">
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
