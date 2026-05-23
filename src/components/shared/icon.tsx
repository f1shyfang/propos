type IconName =
  | "home"
  | "users"
  | "building"
  | "pipeline"
  | "inbox"
  | "briefcase"
  | "folder"
  | "chart"
  | "settings"
  | "search"
  | "bell"
  | "plus"
  | "chevron-right"
  | "chevron-down"
  | "chevron-left"
  | "arrow-up"
  | "arrow-down"
  | "arrow-up-right"
  | "arrow-right"
  | "x"
  | "check"
  | "filter"
  | "sliders"
  | "map"
  | "list"
  | "grid"
  | "bookmark"
  | "mappin"
  | "bed"
  | "bath"
  | "car"
  | "square"
  | "clock"
  | "calendar"
  | "file"
  | "send"
  | "sparkles"
  | "trending-up"
  | "trending-down"
  | "help-circle"
  | "circle"
  | "circle-fill"
  | "more"
  | "flag"
  | "message"
  | "pen"
  | "thumbs-up"
  | "thumbs-down"
  | "eye"
  | "phone"
  | "share"
  | "cmd"
  | "lightning"
  | "shield"
  | "image"
  | "logout"
  | "minus"
  | "mail"
  | "file-text"
  | "mic"
  | "volume"
  | "volume-x"
  | "pause"
  | "play";

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

const paths: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="M3 12L12 3l9 9" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
      <circle cx="17" cy="9" r="2.8" />
      <path d="M16 14.5c2.8.4 5 2.8 5 5.5" />
    </>
  ),
  building: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
    </>
  ),
  pipeline: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1" />
      <rect x="10" y="4" width="5" height="16" rx="1" />
      <rect x="17" y="4" width="4" height="10" rx="1" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 12l3-8h12l3 8v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
      <path d="M3 12h5l2 3h4l2-3h5" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="1.5" />
      <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />
      <path d="M3 13h18" />
    </>
  ),
  folder: <path d="M3 7a1 1 0 011-1h5l2 2h9a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7z" />,
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 4 5-6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 00.3 1.7 2 2 0 11-2.8 2.8 1.6 1.6 0 00-1.7-.3 1.6 1.6 0 00-1 1.5 2 2 0 11-4 0 1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.7.3 2 2 0 11-2.8-2.8 1.6 1.6 0 00.3-1.7 1.6 1.6 0 00-1.5-1 2 2 0 110-4 1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.7 2 2 0 112.8-2.8 1.6 1.6 0 001.7.3 1.6 1.6 0 001-1.5 2 2 0 114 0 1.6 1.6 0 001 1.5 1.6 1.6 0 001.7-.3 2 2 0 112.8 2.8 1.6 1.6 0 00-.3 1.7 1.6 1.6 0 001.5 1 2 2 0 110 4 1.6 1.6 0 00-1.5 1z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-5-5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 004 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  "chevron-right": <path d="M9 6l6 6-6 6" />,
  "chevron-down": <path d="M6 9l6 6 6-6" />,
  "chevron-left": <path d="M15 6l-6 6 6 6" />,
  "arrow-up": (
    <>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </>
  ),
  "arrow-down": (
    <>
      <path d="M12 5v14" />
      <path d="M6 13l6 6 6-6" />
    </>
  ),
  "arrow-up-right": (
    <>
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
  x: <path d="M18 6L6 18M6 6l12 12" />,
  check: <path d="M5 12l5 5L20 7" />,
  filter: <path d="M3 5h18l-7 9v6l-4-2v-4L3 5z" />,
  sliders: (
    <>
      <path d="M4 6h13M4 12h7M4 18h13" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="14" cy="12" r="2" />
      <circle cx="19" cy="18" r="2" />
    </>
  ),
  map: (
    <>
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
      <path d="M9 4v16M15 6v16" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="3.5" cy="6" r="1" />
      <circle cx="3.5" cy="12" r="1" />
      <circle cx="3.5" cy="18" r="1" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </>
  ),
  bookmark: <path d="M6 3h12v18l-6-4-6 4V3z" />,
  mappin: (
    <>
      <path d="M12 21s-7-7-7-12a7 7 0 0114 0c0 5-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  bed: (
    <>
      <path d="M2 10h17a3 3 0 013 3v6" />
      <path d="M2 6v14" />
      <path d="M2 14h20" />
      <circle cx="7" cy="11" r="2" />
    </>
  ),
  bath: (
    <>
      <path d="M3 12h18v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3z" />
      <path d="M5 12V6a2 2 0 012-2h2v2H7v6" />
      <path d="M21 19v2M3 19v2" />
    </>
  ),
  car: (
    <>
      <path d="M5 13l2-5h10l2 5" />
      <rect x="3" y="13" width="18" height="6" rx="1.5" />
      <circle cx="7" cy="17" r="1.5" />
      <circle cx="17" cy="17" r="1.5" />
    </>
  ),
  square: <rect x="4" y="4" width="16" height="16" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8l-5-5z" />
      <path d="M14 3v5h5" />
    </>
  ),
  send: (
    <>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.5 5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1L12 3z" />
      <path d="M19 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2zM5 16l.5 1.5 1.5.5-1.5.5L5 20l-.5-1.5L3 18l1.5-.5L5 16z" />
    </>
  ),
  "trending-up": (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </>
  ),
  "trending-down": (
    <>
      <path d="M3 7l6 6 4-4 8 8" />
      <path d="M14 17h7v-7" />
    </>
  ),
  "help-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </>
  ),
  circle: <circle cx="12" cy="12" r="9" />,
  "circle-fill": <circle cx="12" cy="12" r="6" fill="currentColor" stroke="none" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </>
  ),
  flag: <path d="M5 21V4h12l-2 5 2 5H5" />,
  message: <path d="M21 12a8 8 0 01-12 7l-6 2 2-5a8 8 0 1116-4z" />,
  pen: <path d="M14 3l7 7-11 11H3v-7L14 3z" />,
  "thumbs-up": (
    <path d="M7 11v10H4a1 1 0 01-1-1V12a1 1 0 011-1h3zm0 0l4-8a2 2 0 014 1v4h5a2 2 0 012 2l-2 8a2 2 0 01-2 1.5H7" />
  ),
  "thumbs-down": (
    <path d="M17 13V3h3a1 1 0 011 1v8a1 1 0 01-1 1h-3zm0 0l-4 8a2 2 0 01-4-1v-4H4a2 2 0 01-2-2l2-8A2 2 0 016 4.5h11" />
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  phone: (
    <path d="M22 16v3a2 2 0 01-2 2A18 18 0 013 5a2 2 0 012-2h3a1 1 0 011 .8l1 3.4a1 1 0 01-.3 1L7.2 9.7a14 14 0 007 7l1.5-1.5a1 1 0 011-.3l3.4 1a1 1 0 01.9 1z" />
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8 11l8-4M8 13l8 4" />
    </>
  ),
  cmd: (
    <path d="M15 6a3 3 0 113 3h-3V6zM9 18a3 3 0 11-3-3h3v3zM9 6a3 3 0 10-3 3h3V6zM15 18a3 3 0 103-3h-3v3zM9 9h6v6H9V9z" />
  ),
  lightning: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />,
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 16l-5-5L5 21" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  mail: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 8l10 7 10-7" />
    </>
  ),
  "file-text": (
    <>
      <path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8l-5-5z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8M8 17h5" />
    </>
  ),
  mic: (
    <>
      <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4" />
    </>
  ),
  volume: (
    <>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
    </>
  ),
  "volume-x": (
    <>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M23 9l-6 6M17 9l6 6" />
    </>
  ),
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </>
  ),
  play: (
    <>
      <polygon points="5 3 19 12 5 21 5 3" />
    </>
  ),
};

export function Icon({
  name,
  size = 16,
  color = "currentColor",
  strokeWidth = 1.5,
  style = {},
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {paths[name] ?? null}
    </svg>
  );
}
