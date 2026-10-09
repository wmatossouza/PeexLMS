import type { SVGProps } from 'react'

const PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M10 21v-6h4v6',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 14a2 2 0 0 1 2-2h13',
  path: 'M5 5h.01M19 19h.01M5 5a2 2 0 1 0 0 .01ZM19 19a2 2 0 1 0 0 .01ZM7 5h6a4 4 0 0 1 0 8h-2a4 4 0 0 0 0 8h6',
  play: 'M8 5v14l11-7L8 5Z',
  check: 'm5 12 5 5L20 7',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  search: 'm21 21-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6 6 18',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-2-1.2L14.6 3h-4l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7.5 7.5 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z',
  file: 'M7 3h7l5 5v13H7V3Zm7 0v5h5M10 13h6M10 17h6',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  users: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 20v-1a4 4 0 0 0-3-3.9M16 4.1a3.5 3.5 0 0 1 0 6.8',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  monitor: 'M3 5h18v11H3V5Zm6 15h6m-3-4v4',
} as const

export type IconName = keyof typeof PATHS

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
}

export function Icon({ name, className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
