import type { ComponentProps } from "react";
import Zoom from "react-medium-image-zoom";
type Props = ComponentProps<"img">;
export default function ImageZoom({ ...pros }: Props) {
  return (
    <Zoom>
      <img {...pros} />
    </Zoom>
  );
}
