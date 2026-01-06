import { Composition } from "remotion";
import { CountdownComposition } from "./Countdown";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Countdown"
        component={CountdownComposition}
        durationInFrames={270}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
