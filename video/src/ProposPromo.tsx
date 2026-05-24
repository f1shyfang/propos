import {
  AbsoluteFill,
  Sequence,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  delayRender,
  continueRender,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { useEffect, useState } from "react";

const interFont = loadInter("normal", {
  weights: ["300", "400", "600"],
  subsets: ["latin"],
});
const INTER = interFont.fontFamily;
const NERD = "JetBrainsMonoNerd";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_FRAMES = 600;

const COLORS = {
  bg: "#ffffff",
  text: "#1f2933",
  muted: "#8a96a3",
  hairline: "#e8ecef",
  blue: "#3aa6ff",
  orange: "#f0a36a",
  green: "#3bbf7f",
};

const useNerdFont = () => {
  const [handle] = useState(() => delayRender("Loading JetBrainsMono Nerd Font"));
  useEffect(() => {
    const face = new FontFace(
      NERD,
      `url(${staticFile("fonts/JetBrainsMonoNerdFont-Regular.ttf")}) format("truetype")`,
      { weight: "400" }
    );
    const faceBold = new FontFace(
      NERD,
      `url(${staticFile("fonts/JetBrainsMonoNerdFont-Bold.ttf")}) format("truetype")`,
      { weight: "700" }
    );
    Promise.all([face.load(), faceBold.load()])
      .then(([a, b]) => {
        document.fonts.add(a);
        document.fonts.add(b);
        continueRender(handle);
      })
      .catch((err) => {
        console.error("Nerd font load failed", err);
        continueRender(handle);
      });
  }, [handle]);
};

const ease = (t: number) => Easing.bezier(0.22, 1, 0.36, 1)(t);

const fadeUp = (frame: number, from: number, duration = 24, distance = 16) => {
  const t = interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return {
    opacity: t,
    transform: `translateY(${(1 - t) * distance}px)`,
  };
};

// ─── Scene 1: Logo intro ─────────────────────────────────────────────
const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({
    frame,
    fps,
    from: 0.94,
    to: 1,
    config: { damping: 200, mass: 0.6, stiffness: 90 },
  });
  const logoOpacity = interpolate(frame, [0, 24], [0, 1], {
    extrapolateRight: "clamp",
    easing: ease,
  });
  const wordmark = fadeUp(frame, 40, 28, 14);
  const tagline = fadeUp(frame, 60, 28, 12);
  const exit = interpolate(frame, [75, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        opacity: exit,
      }}
    >
      <Img
        src={staticFile("logo.png")}
        style={{
          width: 360,
          height: "auto",
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: 24,
        }}
      />
      <div
        style={{
          fontFamily: INTER,
          fontWeight: 600,
          fontSize: 84,
          color: COLORS.text,
          letterSpacing: -2,
          ...wordmark,
        }}
      >
        Propos
      </div>
      <div
        style={{
          fontFamily: INTER,
          fontWeight: 300,
          fontSize: 30,
          color: COLORS.muted,
          marginTop: 14,
          letterSpacing: 0.4,
          ...tagline,
        }}
      >
        The buyer's agent terminal.
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Calm workspace statement ───────────────────────────────
const SceneStatement: React.FC = () => {
  const frame = useCurrentFrame();
  const line1 = fadeUp(frame, 6, 30, 18);
  const line2 = fadeUp(frame, 26, 30, 18);
  const exit = interpolate(frame, [90, 110], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        opacity: exit,
      }}
    >
      <div
        style={{
          fontFamily: INTER,
          fontWeight: 600,
          fontSize: 96,
          color: COLORS.text,
          letterSpacing: -2.5,
          ...line1,
        }}
      >
        One calm workspace.
      </div>
      <div
        style={{
          fontFamily: INTER,
          fontWeight: 300,
          fontSize: 56,
          color: COLORS.muted,
          marginTop: 18,
          letterSpacing: -1,
          ...line2,
        }}
      >
        For every property deal.
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Terminal demo ──────────────────────────────────────────
type LineKind = "prompt" | "ok" | "match" | "blank";
type Line = { kind: LineKind; text: string; at: number };

const TERMINAL_LINES: Line[] = [
  { kind: "prompt", text: "propos brief new --buyer \"Sarah & Tom\"", at: 0 },
  { kind: "ok", text: "✓ Brief captured · 3 suburbs · $1.4M–1.7M · 3 bed", at: 38 },
  { kind: "blank", text: "", at: 88 },
  { kind: "prompt", text: "propos match", at: 96 },
  { kind: "match", text: "  Northcote · 3 bed · 92% fit · $1.55M", at: 124 },
  { kind: "match", text: "  Brunswick East · 3 bed · 88% fit · $1.62M", at: 138 },
  { kind: "match", text: "  Coburg · 3 bed · 81% fit · $1.49M", at: 152 },
];

const TYPE_SPEED = 1.4; // chars per frame

const renderTyped = (text: string, framesIn: number) => {
  const chars = Math.min(text.length, Math.floor(framesIn * TYPE_SPEED));
  return text.slice(0, chars);
};

const colorFor = (kind: LineKind) => {
  if (kind === "ok") return COLORS.green;
  if (kind === "match") return COLORS.text;
  return COLORS.text;
};

const SceneTerminal: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = spring({
    frame,
    fps: FPS,
    from: 40,
    to: 0,
    config: { damping: 200, mass: 0.8, stiffness: 80 },
    durationInFrames: 36,
  });
  const enterOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
    easing: ease,
  });
  const exit = interpolate(frame, [180, 200], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const sceneOpacity = enterOpacity * exit;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        alignItems: "center",
        justifyContent: "center",
        opacity: sceneOpacity,
      }}
    >
      <div
        style={{
          width: 1400,
          height: 720,
          background: "#fbfcfd",
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 18,
          boxShadow:
            "0 30px 80px rgba(31, 41, 51, 0.08), 0 4px 12px rgba(31,41,51,0.04)",
          overflow: "hidden",
          transform: `translateY(${enter}px)`,
        }}
      >
        {/* title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "16px 22px",
            borderBottom: `1px solid ${COLORS.hairline}`,
            background: "#ffffff",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#fe5f57",
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#febc2e",
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#28c840",
            }}
          />
          <div
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: NERD,
              fontSize: 18,
              color: COLORS.muted,
              letterSpacing: 0.5,
            }}
          >
             propos — sarah-tom-brief — zsh
          </div>
        </div>

        {/* body */}
        <div
          style={{
            padding: "34px 40px",
            fontFamily: NERD,
            fontSize: 26,
            lineHeight: 1.55,
            color: COLORS.text,
          }}
        >
          {TERMINAL_LINES.map((line, i) => {
            const localFrame = frame - line.at;
            if (localFrame < 0) return <div key={i} style={{ height: "1.55em" }} />;
            if (line.kind === "blank") return <div key={i} style={{ height: "1.55em" }} />;

            if (line.kind === "prompt") {
              const typed = renderTyped(line.text, localFrame);
              const showCursor =
                typed.length === line.text.length
                  ? Math.floor(frame / 15) % 2 === 0
                  : true;
              return (
                <div key={i}>
                  <span style={{ color: COLORS.blue, fontWeight: 700 }}>❯ </span>
                  <span>{typed}</span>
                  {showCursor && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 24,
                        background: COLORS.text,
                        verticalAlign: "-3px",
                        marginLeft: 2,
                      }}
                    />
                  )}
                </div>
              );
            }

            const typed = renderTyped(line.text, localFrame);
            return (
              <div key={i} style={{ color: colorFor(line.kind) }}>
                {typed}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: Three pillars ──────────────────────────────────────────
const Pillar: React.FC<{
  glyph: string;
  title: string;
  sub: string;
  delay: number;
  color: string;
}> = ({ glyph, title, sub, delay, color }) => {
  const frame = useCurrentFrame();
  const s = fadeUp(frame, delay, 28, 22);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        width: 380,
        ...s,
      }}
    >
      <div
        style={{
          fontFamily: NERD,
          fontSize: 92,
          color,
          lineHeight: 1,
        }}
      >
        {glyph}
      </div>
      <div
        style={{
          fontFamily: INTER,
          fontSize: 36,
          fontWeight: 600,
          color: COLORS.text,
          letterSpacing: -0.5,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: INTER,
          fontSize: 22,
          fontWeight: 300,
          color: COLORS.muted,
          textAlign: "center",
          maxWidth: 320,
          lineHeight: 1.45,
        }}
      >
        {sub}
      </div>
    </div>
  );
};

const ScenePillars: React.FC = () => {
  const frame = useCurrentFrame();
  const heading = fadeUp(frame, 0, 30, 16);
  const exit = interpolate(frame, [120, 140], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 80,
        opacity: exit,
      }}
    >
      <div
        style={{
          fontFamily: INTER,
          fontSize: 56,
          fontWeight: 600,
          color: COLORS.text,
          letterSpacing: -1.5,
          ...heading,
        }}
      >
        Brief. Match. Close.
      </div>
      <div style={{ display: "flex", gap: 80 }}>
        <Pillar
          glyph={"\uf15c"}
          title="Capture briefs"
          sub="Budget, suburbs, must-haves — structured in seconds."
          delay={20}
          color={COLORS.blue}
        />
        <Pillar
          glyph={"\uf002"}
          title="Match listings"
          sub="Pre-scored fit, comparables, and overlays at a glance."
          delay={36}
          color={COLORS.orange}
        />
        <Pillar
          glyph={"\uf2b5"}
          title="Close deals"
          sub="Shared portals, feedback loops, no more spreadsheets."
          delay={52}
          color={COLORS.green}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 5: Outro ──────────────────────────────────────────────────
const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({
    frame,
    fps,
    from: 0.92,
    to: 1,
    config: { damping: 200, mass: 0.8, stiffness: 90 },
  });
  const logoOpacity = interpolate(frame, [0, 24], [0, 1], {
    extrapolateRight: "clamp",
    easing: ease,
  });
  const url = fadeUp(frame, 28, 26, 10);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <Img
        src={staticFile("logo.png")}
        style={{
          width: 320,
          height: "auto",
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: 18,
        }}
      />
      <div
        style={{
          fontFamily: INTER,
          fontWeight: 400,
          fontSize: 28,
          color: COLORS.muted,
          letterSpacing: 2,
          textTransform: "uppercase",
          ...url,
        }}
      >
        propos.naufalw.dev
      </div>
    </AbsoluteFill>
  );
};

// ─── Root composition ────────────────────────────────────────────────
// Total: 600f @ 30fps = 20s
//   intro     :   0 –  90  (3.0s)
//   statement :  90 – 200  (3.7s)
//   terminal  : 200 – 400  (6.7s)
//   pillars   : 400 – 540  (4.7s)
//   outro     : 540 – 600  (2.0s)
export const ProposPromo: React.FC = () => {
  useNerdFont();
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Sequence from={0} durationInFrames={90}>
        <SceneIntro />
      </Sequence>
      <Sequence from={90} durationInFrames={110}>
        <SceneStatement />
      </Sequence>
      <Sequence from={200} durationInFrames={200}>
        <SceneTerminal />
      </Sequence>
      <Sequence from={400} durationInFrames={140}>
        <ScenePillars />
      </Sequence>
      <Sequence from={540} durationInFrames={60}>
        <SceneOutro />
      </Sequence>
    </AbsoluteFill>
  );
};
