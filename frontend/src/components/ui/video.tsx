import {
  MediaControlBar,
  MediaController,
  MediaMuteButton,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaTimeDisplay,
  MediaTimeRange,
  MediaVolumeRange,
} from "media-chrome/react";
import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type VideoProps = ComponentProps<typeof MediaController>;

const variables = {
  "--media-primary-color": "var(--primary)",
  "--media-secondary-color": "var(--background)",
  "--media-text-color": "var(--foreground)",
  "--media-background-color": "var(--background)",
  "--media-control-hover-background": "var(--accent)",
  "--media-font-family": "var(--font-sans)",
  "--media-live-button-icon-color": "var(--muted-foreground)",
  "--media-live-button-indicator-color": "var(--destructive)",
  "--media-range-track-background": "var(--border)",
} as CSSProperties;

export const Video = ({ style, ...props }: VideoProps) => (
  <MediaController
    style={{
      ...variables,
      ...style,
    }}
    {...props}
  />
);

export type VideoControlBarProps = ComponentProps<typeof MediaControlBar>;

export const VideoControlBar = (props: VideoControlBarProps) => (
  <MediaControlBar {...props} />
);

export type VideoTimeRangeProps = ComponentProps<typeof MediaTimeRange>;

export const VideoTimeRange = ({
  className,
  ...props
}: VideoTimeRangeProps) => (
  <MediaTimeRange className={cn("p-2.5", className)} {...props} />
);

export type VideoTimeDisplayProps = ComponentProps<typeof MediaTimeDisplay>;

export const VideoTimeDisplay = ({
  className,
  ...props
}: VideoTimeDisplayProps) => (
  <MediaTimeDisplay className={cn("p-2.5", className)} {...props} />
);

export type VideoVolumeRangeProps = ComponentProps<typeof MediaVolumeRange>;

export const VideoVolumeRange = ({
  className,
  ...props
}: VideoVolumeRangeProps) => (
  <MediaVolumeRange className={cn("p-2.5", className)} {...props} />
);

export type VideoPlayButtonProps = ComponentProps<typeof MediaPlayButton>;

export const VideoPlayButton = ({
  className,
  ...props
}: VideoPlayButtonProps) => (
  <MediaPlayButton className={cn("p-2.5", className)} {...props} />
);

export type VideoSeekBackwardButtonProps = ComponentProps<
  typeof MediaSeekBackwardButton
>;

export const VideoSeekBackwardButton = ({
  className,
  ...props
}: VideoSeekBackwardButtonProps) => (
  <MediaSeekBackwardButton className={cn("p-2.5", className)} {...props} />
);

export type VideoSeekForwardButtonProps = ComponentProps<
  typeof MediaSeekForwardButton
>;

export const VideoSeekForwardButton = ({
  className,
  ...props
}: VideoSeekForwardButtonProps) => (
  <MediaSeekForwardButton className={cn("p-2.5", className)} {...props} />
);

export type VideoMuteButtonProps = ComponentProps<typeof MediaMuteButton>;

export const VideoMuteButton = ({
  className,
  ...props
}: VideoMuteButtonProps) => (
  <MediaMuteButton className={cn("p-2.5", className)} {...props} />
);

export type VideoContentProps = ComponentProps<"video">;

export const VideoPlayer = ({ className, ...props }: VideoContentProps) => (
  <video className={cn("mt-0 mb-0", className)} {...props} />
);
