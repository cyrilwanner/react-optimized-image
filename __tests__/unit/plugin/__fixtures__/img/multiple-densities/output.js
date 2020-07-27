import React from 'react';
import Img from 'react-optimized-image';
import Image from './image.png';
export default () => (
  <div>
    <Img
      src={Image}
      sizes={[400, 800]}
      densities={[1, 2]}
      rawSrc={{
        fallback: {
          400: {
            1: require('./image.png?url&width=400'),
            2: require('./image.png?url&width=800'),
          },
          800: {
            1: require('./image.png?url&width=800'),
            2: require('./image.png?url&width=1600'),
          },
        },
      }}
    />
  </div>
);
