import React from 'react';
import Img from 'react-optimized-image';
import Image from './image.png';
export default () => (
  <div>
    <Img
      src={Image}
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
