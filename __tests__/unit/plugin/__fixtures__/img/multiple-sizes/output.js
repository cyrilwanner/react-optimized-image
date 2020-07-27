import React from 'react';
import Img from 'react-optimized-image';
import Image from './image.png?original';
export default () => (
  <div>
    <Img
      src={Image}
      sizes={[400, 800]}
      rawSrc={{
        fallback: {
          400: {
            1: require('./image.png?original&url&width=400'),
          },
          800: {
            1: require('./image.png?original&url&width=800'),
          },
        },
      }}
    />
  </div>
);
