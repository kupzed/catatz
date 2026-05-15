const splashScreens = [
  {
    href: '/splash/apple-splash-1290x2796.png',
    media:
      '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    href: '/splash/apple-splash-1179x2556.png',
    media:
      '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    href: '/splash/apple-splash-750x1334.png',
    media:
      '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  },
  {
    href: '/splash/apple-splash-2048x2732.png',
    media:
      '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  },
  {
    href: '/splash/apple-splash-1488x2266.png',
    media:
      '(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  },
];

export function AppleSplashScreens() {
  return (
    <>
      {/* iOS startup images are not covered by the Next.js Metadata API. */}
      {splashScreens.map((screen) => (
        <link
          key={screen.href}
          rel="apple-touch-startup-image"
          href={screen.href}
          media={screen.media}
        />
      ))}
    </>
  );
}
