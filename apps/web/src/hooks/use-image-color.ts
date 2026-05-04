import { useEffect, useState } from "react";
import { FastAverageColor } from "fast-average-color";

const fac = new FastAverageColor();

export function useImageColor(imageUrl: string | undefined) {
  const [color, setColor] = useState<string>("rgba(128, 128, 128, 0.2)"); // Default neutral fallback

  useEffect(() => {
    if (!imageUrl) return;

    let isMounted = true;

    fac.getColorAsync(imageUrl, { crossOrigin: "anonymous" })
      .then((res) => {
        if (isMounted) {
          setColor(res.rgba);
        }
      })
      .catch((err) => {
        console.warn("Failed to extract image color:", err);
        if (isMounted) {
          setColor("rgba(128, 128, 128, 0.2)");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  return color;
}
