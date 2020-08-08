import React from 'react';
import Img, { Svg } from 'react-optimized-image';
const imageName = 'image';
export default () => (
  <div>
    <Svg rawSrc={require(`./${imageName}.svg?include`)} />
    <Img
      src={require(`./${imageName}.png`)}
      webp
      rawSrc={{
        fallback: {
          original: {
            1: require(`./${imageName}.png?url`),
          },
        },
        webp: {
          original: {
            1: require(`./${imageName}.png?webp`),
          },
        },
      }}
    />
  </div>
);
