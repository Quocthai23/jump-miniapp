//Using this utility function to get status color based on up/down status
export function getTextStatusColor(isPositive: boolean): string {
  return isPositive ? "text-success-default" : "text-error-default";
}
