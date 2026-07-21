import { Check, X } from "lucide-react";

interface SortOption {
  id: string;
  label: string;
}

interface SortModalProps {
  isOpen: boolean;
  onClose: () => void;
  sortBy: string;
  onSelectSort: (sortType: string) => void;
}

const SORT_OPTIONS: SortOption[] = [
  { id: "volume_high_low", label: "Volume: High to Low" },
  { id: "volume_low_high", label: "Volume: Low to High" },
  { id: "price_high_low", label: "Price: High to Low" },
  { id: "price_low_high", label: "Price: Low to High" },
];

export function SortModal({
  isOpen,
  onClose,
  sortBy,
  onSelectSort,
}: SortModalProps) {
  const handleSelectSort = (sortType: string) => {
    onSelectSort(sortType);
    onClose();
  };

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
          rounded-t-2xl surface-page-background p-6 shadow-2xl
          transform transition-all duration-500 ease-out
          ${isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
        `}
      >
        <div className="flex items-center justify-center mb-6 relative">
          <h2 className="body-subtitle-semibold text-primary-primary">
            Sort by
          </h2>
          <button
            onClick={onClose}
            className="absolute right-0 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} className="text-primary-primary" />
          </button>
        </div>

        <div className="space-y-3">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelectSort(option.id)}
              className="w-full flex items-center justify-between py-2 rounded-lg transition-colors"
            >
              <span className="text-primary-primary body-subtitle-semibold">
                {option.label}
              </span>
              {sortBy === option.id && (
                <Check size={20} className="text-primary-link" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
