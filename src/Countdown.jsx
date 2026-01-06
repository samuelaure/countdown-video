import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  staticFile,
} from "remotion";
import { useMemo } from "react";

export const CountdownComposition = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { current, prev } = useMemo(() => {
    const today = Math.max(
      0,
      999 - Math.floor((new Date() - new Date("2026-01-01")) / 864e5),
    );
    return { current: today, prev: today + 1 };
  }, []);

  const start = Math.floor(1.5 * fps);
  const anim = spring({
    frame: frame - start,
    fps,
    config: { stiffness: 100, damping: 12 },
  });
  const getDigits = (num) => String(num).padStart(3, "0").split("");

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(to bottom right, #fcfcfc, #d1d1d1)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* AUDIO */}
      {frame >= start && (
        <Audio src={staticFile("flip_sound.mp3")} volume={0.6} />
      )}

      <div
        style={{
          display: "flex",
          gap: 25,
          marginBottom: 100,
          transform: "scale(1.15)",
        }}
      >
        {getDigits(current).map((d, i) => (
          <FlipUnit
            key={i}
            currentDigit={getDigits(prev)[i]}
            nextDigit={d}
            progress={anim}
          />
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            fontSize: "110px",
            fontFamily: "sans-serif",
            fontWeight: "900",
            letterSpacing: "0.45em",
            color: "#a1a1aa",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          DAYS
        </h2>
      </div>
    </AbsoluteFill>
  );
};

const FlipUnit = ({ currentDigit, nextDigit, progress }) => {
  const changed = currentDigit !== nextDigit;
  const rot = interpolate(progress, [0, 1], [0, -180]);
  const rotB = interpolate(progress, [0, 1], [180, 0]);

  const Box = ({ children, bg, radius, shadow, rotX, origin }) => (
    <div
      style={{
        position: "absolute",
        width: "100%",
        height: "50%",
        backgroundColor: bg,
        borderRadius: radius,
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        backfaceVisibility: "hidden",
        transformOrigin: origin,
        transform: rotX !== undefined ? `rotateX(${rotX}deg)` : "none",
        boxShadow: shadow,
        borderBottom:
          origin === "bottom" ? "2px solid rgba(0,0,0,0.9)" : "none",
        alignItems: origin === "bottom" ? "flex-end" : "flex-start",
        top: origin === "top" ? "50%" : "0",
      }}
    >
      <span
        style={{
          fontSize: "14rem",
          fontWeight: 900,
          fontFamily: "system-ui, sans-serif",
          color: bg === "#1a1a1a" ? "#f0f0f0" : "#fff",
          transform: `translateY(${origin === "bottom" ? "50%" : "-50%"})`,
        }}
      >
        {children}
      </span>
    </div>
  );

  return (
    <div
      style={{
        position: "relative",
        width: 220,
        height: 340,
        perspective: 1200,
      }}
    >
      {/* Fondo estático */}
      <Box
        bg="#1a1a1a"
        radius="24px 24px 0 0"
        shadow="inset 0 12px 30px rgba(0,0,0,0.7)"
        origin="bottom"
      >
        {changed && progress > 0.5 ? nextDigit : currentDigit}
      </Box>
      <Box bg="#333" radius="0 0 24px 24px" origin="top">
        {currentDigit}
      </Box>

      {/* Paleta móvil */}
      {changed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            transformStyle: "preserve-3d",
          }}
        >
          <Box bg="#1a1a1a" radius="24px 24px 0 0" rotX={rot} origin="bottom">
            {currentDigit}
          </Box>
          <Box bg="#333" radius="0 0 24px 24px" rotX={rotB} origin="top">
            {nextDigit}
          </Box>
        </div>
      )}

      {/* Detalles mecánicos */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          width: "100%",
          height: 4,
          background: "#000",
          zIndex: 40,
          transform: "translateY(-50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: -12,
          width: 16,
          height: 32,
          background: "#3a3a3a",
          borderRadius: 4,
          zIndex: 50,
          border: "1px solid #000",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: -12,
          width: 16,
          height: 32,
          background: "#3a3a3a",
          borderRadius: 4,
          zIndex: 50,
          border: "1px solid #000",
        }}
      />
    </div>
  );
};
