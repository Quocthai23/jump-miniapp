import { X } from "lucide-react";

interface OrderTypeOption {
  id: string;
  label: string;
  description: string;
}

interface OrderTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrderType: (orderType: string) => void;
  currentOrderType: "market" | "limit";
}

const ORDER_TYPES: OrderTypeOption[] = [
  {
    id: "market",
    label: "Market",
    description: "Execute immediately at current market price",
  },
  {
    id: "limit",
    label: "Limit",
    description: "Execute only at your specified price or better",
  },
];

export function OrderTypeModal({
  isOpen,
  onClose,
  onSelectOrderType,
  currentOrderType,
}: OrderTypeModalProps) {
  const handleSelectType = (orderType: string) => {
    onSelectOrderType(orderType);
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
          rounded-t-2xl bg-white py-6 shadow-2xl
          transform transition-all duration-500 ease-out
          ${isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
        `}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center mb-6 px-5">
          <h2 className="body-subtitle-semibold text-primary-primary">
            Order type
          </h2>
          <button
            onClick={onClose}
            className="absolute right-5 text-primary-primary transition-colors"
          >
            <X width={24} height={24} />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {ORDER_TYPES.map((orderType) => (
            <button
              key={orderType.id}
              onClick={() => handleSelectType(orderType.id)}
              className={`w-full text-left px-4 py-4 transition-all border-l-4 ${
                currentOrderType === orderType.id
                  ? "border-l-blue-500 bg-[#F5FAFF]"
                  : "border-l-transparent"
              }`}
            >
              <div className="body-subtitle-semibold text-primary-primary">
                {orderType.label}
              </div>
              <div className="text-primary-secondary body-body-regular">
                {orderType.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
