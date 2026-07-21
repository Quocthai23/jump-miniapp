import { useState } from "react";
import Lottie from "lottie-react";
import animationData from "public/perpetual-trading/perp-trading.json";

const TRADING_GUIDES = [
  {
    id: 1,
    title: "Perpetual Trading",
    description:
      "Trade long or short with leverage, manage your margin, and stay in control of your positions with real-time risk tools.",
    animation: animationData,
  },
  {
    id: 2,
    title: "Leverage",
    description:
      "Increase your exposure with leverage to amplify potential gains, but remember that losses can also grow faster when the market moves against you.",
    image: "/perpetual-trading/leverage.svg",
  },
  {
    id: 3,
    title: "Margin & Liquidation",
    description:
      "Your collateral keeps your position open, and you may be liquidated when your margin becomes too low, so monitoring your margin health is essential.",
    image: "/perpetual-trading/margin-liquidation.svg",
  },
  {
    id: 4,
    title: "Funding Rate",
    description:
      "Longs and shorts periodically exchange funding fees to keep perpetual prices aligned with spot markets, and this cost can affect long-term positions.",
    image: "/perpetual-trading/funding-rate.svg",
  },
  {
    id: 5,
    title: "Risk Management",
    description:
      "Protect your trades by adjusting margin, setting take profit and stop loss, and using built-in tools that help you manage risk more effectively.",
    image: "/perpetual-trading/risk-management.svg",
  },
];

export function GuideTrading() {
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const guide = TRADING_GUIDES[currentStep];
  const isLastStep = currentStep === TRADING_GUIDES.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      setShowModal(false);
      setCurrentStep(0);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <>
      <div
        className=" mt-6 surface-page-background rounded-xl shadow-200 flex items-center gap-3 p-3 transition-shadow"
        onClick={() => setShowModal(true)}
      >
        <img src="/perpetual-trading/guide.svg" width={50} height={50} />

        <div className="flex flex-col">
          <span className="text-primary-primary body-subtitle-semibold">
            Price movements explained
          </span>
          <span className="body-body-regular text-primary-secondary">
            A simple guide to perpetual trading.
          </span>
        </div>
      </div>

      {/* Trading Guide Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full overflow-hidden flex flex-col shadow-2xl">
            {/* Header with back/close button */}
            <div className="flex justify-between items-center p-6">
              {currentStep > 0 ? (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="text-primary-primary transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              ) : (
                <div className="flex-1" />
              )}
              <button
                onClick={() => {
                  setShowModal(false);
                  setCurrentStep(0);
                }}
                className="text-primary-primary transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
              <div
                className={`
                  w-full aspect-square rounded-xl mb-6 flex items-center justify-center
                 
                `}
              >
                {guide.animation ? (
                  <Lottie
                    animationData={guide.animation}
                    loop={true}
                    autoplay={true}
                    style={{ width: "100%", height: "100%" }}
                    rendererSettings={{
                      preserveAspectRatio: "xMidYMid slice",
                    }}
                  />
                ) : (
                  <img
                    src={`${guide.image}`}
                    alt={guide.title}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <div className="flex justify-center gap-2 px-6 mb-8 mt-6">
                {TRADING_GUIDES.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === currentStep
                        ? "bg-blue-500 w-6"
                        : "bg-gray-300 w-2"
                    }`}
                  />
                ))}
              </div>
              {/* Title */}
              <h2 className="text-primary-primary display-xs mb-3 text-center">
                {guide.title}
              </h2>

              {/* Description */}
              <p className="text-primary-secondary body-body-regular text-center ">
                {guide.description}
              </p>

              {/* Highlight box for special guides */}
            </div>

            {/* Progress dots */}

            {/* Footer with button */}
            <div className="p-6">
              <button
                onClick={handleNext}
                className={`
                  w-full py-3 rounded-full font-semibold transition-all
                  button-primary-container
                  text-white shadow-lg  active:scale-95
                `}
              >
                {isLastStep ? "Start Trading" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
