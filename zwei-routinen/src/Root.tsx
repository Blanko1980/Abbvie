import React from 'react';
import {Composition, AbsoluteFill, useCurrentFrame} from 'remotion';

const Test: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#fff', fontSize: 80, justifyContent: 'center', alignItems: 'center'}}>Test {f}</AbsoluteFill>;
};

export const RemotionRoot: React.FC = () => (
  <Composition id="ZweiRoutinen" component={Test} durationInFrames={30} fps={30} width={1920} height={1080} />
);
