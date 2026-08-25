const iconPaths = {
  dashboard: '/icons/activity.svg',
  laboratory: '/icons/microscope.svg',
  samples: '/icons/bug.svg',
  network: '/icons/network.svg',
  vm: '/icons/server.svg',
  processes: '/icons/cpu.svg',
  filesystem: '/icons/hard-drive.svg',
  detection: '/icons/shield-alert.svg',
  remediation: '/icons/shield-check.svg',
  scanner: '/icons/scan-search.svg',
  terminal: '/icons/terminal.svg',
  restore: '/icons/rotate-ccw.svg',
  sample: '/icons/file-search.svg',
  registry: '/icons/database.svg',
  malware: '/icons/biohazard.svg'
} as const;

export type IconName = keyof typeof iconPaths;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const url = iconPaths[name];
  return (
    <span
      className="svg-icon"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`
      }}
    />
  );
}
