import React from 'react';
import Img from 'react-optimized-image';
import Image from './image.png?width=1200';
export default () => (
  <div>
    <Img
      src={Image}
      sizes={[400, 800]}
      rawSrc={{
        fallback: {
          400: {
            1: require('./image.png?width=400&url'),
          },
          800: {
            1: require('./image.png?width=800&url'),
          },
        },
      }}
    />
  </div>
);
