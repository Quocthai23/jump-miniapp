export const NoResults = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <img
        src={"/images/no-results.svg"}
        alt="No Results Found"
        width={64}
        height={64}
        loading="lazy"
      />
      <p className="text-text-neutral-secondary text-lg">No Results Found</p>
    </div>
  );
};
