import { cn } from "@workspace/ui/lib/utils";

type JointProps = {
  className?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

export function Joint({ className, position = "top-left" }: JointProps) {
  const positionClasses = {
    "top-left": "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
    "top-right": "top-0 right-0 translate-x-1/2 -translate-y-1/2",
    "bottom-left": "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
    "bottom-right": "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
  };

  return (
    <div
      className={cn(
        "absolute z-10 flex items-center justify-center pointer-events-none",
        positionClasses[position],
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute h-[1.5px] w-2.5 bg-foreground/50" />
        <div className="absolute h-2.5 w-[1.5px] bg-foreground/50" />
      </div>
    </div>
  );
}

export function VerticalLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 w-[1px] bg-border/50 pointer-events-none",
        className
      )}
    />
  );
}

export function HorizontalLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute left-0 right-0 h-[1px] bg-border/50 pointer-events-none",
        className
      )}
    />
  );
}
