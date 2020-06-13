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
          1: {
            400: require('./image.png?width=400'),
            800: require('./image.png?width=800'),
          },
          2: {
            400: require('./image.png?width=800'),
            800: require('./image.png?width=1600'),
          },
        },
      }}
    />
  </div>
);
