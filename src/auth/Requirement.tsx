import type { ReactNode } from "react";

interface Props { met: boolean; children: ReactNode; }

export default function Requirement({ met, children }: Props) {
  return (
    <li className={met ? "req req--met" : "req"}>
      <span className="req-icon">{met ? "✓" : "✕"}</span>
      <span>{children}</span>
    </li>
  );
}
