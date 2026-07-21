import {
  SkeletonCircle,
  SkeletonText,
} from "packages/ui/src/components/shared/atoms/skeleton";

export const TokenRowSkeleton = () => {
  return (
    <div className="flex w-full px-4 items-start justify-between rounded-none border-none transition-colors">
      <div className="flex items-start gap-2">
        <div className="flex items-start gap-2">
          <div className="flex cursor-pointer items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
              <SkeletonCircle size={32} />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex flex-col justify-start items-start gap-2">
                <div className="flex gap-2 items-center">
                  <SkeletonText width={60} height={16} />
                  <SkeletonText width={40} height={16} />
                </div>
                <SkeletonText width={80} height={12} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="mb-2">
          <SkeletonText width={70} height={16} />
        </div>
        <SkeletonText width={60} height={12} />
      </div>
    </div>
  );
};

TokenRowSkeleton.displayName = "TokenRowSkeleton";
