import { ReactNode } from "react";

interface BattleLineProps {
  scale: number;
  children: ReactNode;
  style?: React.CSSProperties;
}

const BattleLine = ({ scale, children, style }: BattleLineProps) => {
  return (
    <div
      style={{
        position: "absolute",
        width: "1000px",
        height: "0px",
        transform: `scale(${scale / 100})`,
        transformOrigin: "bottom center",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default BattleLine;

