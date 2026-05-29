export function changeSnapTarget(newButtonId: string): void {
  if ((window as any).changeSnapTarget) {
    (window as any).changeSnapTarget(newButtonId);
  }
}

export function changePadding(options: {
  left?: number,
  right?: number,
  top?: number,
  bottom?: number,
  all?: number
}): void {
  if ((window as any).changePadding) {
    (window as any).changePadding(options);
  }
}