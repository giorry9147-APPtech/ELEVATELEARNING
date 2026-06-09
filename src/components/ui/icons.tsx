import * as React from "react";

/*
 * School-thema iconenset — strakke line-icons (lucide-stijl), 24x24,
 * tekenen met currentColor zodat ze meekleuren met de context.
 * Plaatshouder voor latere 3D-illustraties: vervang per sectie gerust door
 * een <img>/<Image> met een gerenderde illustratie.
 */
export type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const VideoIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
    <path d="M15.5 10.5 21 7.5v9l-5.5-3" />
  </Svg>
);

export const WhiteboardIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3.5" width="18" height="13" rx="2" />
    <path d="M12 16.5v4M9 20.5h6" />
    <path d="M7 8.5h7M7 12h4" />
  </Svg>
);

export const ChatIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5.4A8 8 0 1 1 21 12Z" />
    <path d="M8.5 11h7M8.5 14h4" />
  </Svg>
);

export const BookIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2V4.5Z" />
    <path d="M6 19a2 2 0 0 0-2 2" />
    <path d="M9 7.5h7" />
  </Svg>
);

export const PencilIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    <path d="M14 6l3 3" />
  </Svg>
);

export const SparkleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
    <path d="M19 14l.7 1.9L21.5 16.6l-1.8.7L19 19l-.7-1.7L16.5 16.6l1.8-.7L19 14Z" />
  </Svg>
);

export const LinkIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.5 14.5 14.5 9.5" />
    <path d="M8 12 6 14a3.5 3.5 0 0 0 5 5l2-2" />
    <path d="M16 12l2-2a3.5 3.5 0 0 0-5-5l-2 2" />
  </Svg>
);

export const UsersIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 6.1M17.5 14.4A5.5 5.5 0 0 1 20.5 20" />
  </Svg>
);

export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    <path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2" />
  </Svg>
);

export const ShieldIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l7 2.5v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9v-5L12 3Z" />
    <path d="m9 11.5 2 2 4-4" />
  </Svg>
);

export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 6.5" />
  </Svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const EuroIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M15.5 9a3.8 3.8 0 1 0 0 6" />
    <path d="M7.5 11h6M7.5 13.5h5" />
  </Svg>
);

export const TagIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.6 12.4 11 5a2 2 0 0 1 1.4-.6H19A1.5 1.5 0 0 1 20.5 6v6.6a2 2 0 0 1-.6 1.4l-7.4 7.4a1.6 1.6 0 0 1-2.2 0l-6.7-6.7a1.6 1.6 0 0 1 0-2.3Z" />
    <circle cx="16" cy="8" r="1.4" />
  </Svg>
);

export const GraduationIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 9 12 4.5 21.5 9 12 13.5 2.5 9Z" />
    <path d="M6 11v4.5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5V11" />
    <path d="M21.5 9v4.5" />
  </Svg>
);
