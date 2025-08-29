
import Image from 'next/image';

export const AppLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <Image
    src="/app-logo.svg"
    alt="ShuttleTrack Logo"
    width={40}
    height={40}
    className={props.className}
  />
);
