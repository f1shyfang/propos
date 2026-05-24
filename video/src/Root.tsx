import { Composition } from "remotion";
import { ProposPromo, DURATION_FRAMES, FPS, WIDTH, HEIGHT } from "./ProposPromo";

export const Root = () => {
  return (
    <Composition
      id="ProposPromo"
      component={ProposPromo}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
