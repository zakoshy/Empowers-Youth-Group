import type { SVGProps } from "react";

export function EmpowerHubLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={props.width || "1.5rem"}
      height={props.height || "1.5rem"}
      {...props}
    >
      <g fill="currentColor">
        <path d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88Z" />
        <path d="M176 96H80a8 8 0 0 0 0 16h8v40H80a8 8 0 0 0 0 16h96a8 8 0 0 0 0-16h-8V96h-8v16h-24V96h-8v16h-24V96h-8v16H96v24h16v-16h8v16h24v-16h8v16h24v-24h8v-8h-8v-8h8a8 8 0 0 0 0-16Z" />
      </g>
    </svg>
  );
}
