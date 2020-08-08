import React from 'react';
import Img, { Svg } from 'react-optimized-image';
export default () => (
  <div>
    <Svg rawSrc={require('./image.svg?include')} />
    <Img
      src={require('./image.png')}
      webp
      rawSrc={{
        fallback: {
          original: {
            1: require('./image.png?url'),
          },
        },
        webp: {
          original: {
            1: require('./image.png?webp'),
          },
        },
      }}
    />
  </div>
);
