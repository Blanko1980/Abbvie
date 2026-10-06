import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import timeline from './data/timeline.json';

export const RemotionRoot: React.FC = () => (
  <Composition id="ZweiRoutinen" component={Film} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1920} height={1080} />
);
