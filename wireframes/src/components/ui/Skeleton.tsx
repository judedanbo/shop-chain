export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
}: {
  width?: string | number;
  height?: number;
  borderRadius?: number;
}) {
  return (
    <div className="bg-surface-alt animate-[pulse_1.5s_ease-in-out_infinite]" style={{ width, height, borderRadius }} />
  );
}
