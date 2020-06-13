import React from 'react';
import Img from 'react-optimized-image';
import Image from './image.png';
export default () => (
  <div>
    <Img
      src={Image}
      webp
      sizes={[400, 800]}
      rawSrc={{
        fallback: {
          1: {
            400: require('./image.png?width=400'),
            800: require('./image.png?width=800'),
          },
        },
        webp: {
          1: {
            400: require('./image.png?webp&width=400'),
            800: require('./image.png?webp&width=800'),
          },
        },
      }}
    />
  </div>
);
