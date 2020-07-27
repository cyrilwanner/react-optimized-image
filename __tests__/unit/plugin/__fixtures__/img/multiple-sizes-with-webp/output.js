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
          400: {
            1: require('./image.png?url&width=400'),
          },
          800: {
            1: require('./image.png?url&width=800'),
          },
        },
        webp: {
          400: {
            1: require('./image.png?webp&url&width=400'),
          },
          800: {
            1: require('./image.png?webp&url&width=800'),
          },
        },
      }}
    />
  </div>
);
