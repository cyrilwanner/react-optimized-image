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
          1: {
            400: require('./image.png?original&width=400'),
            800: require('./image.png?original&width=800'),
          },
        },
      }}
    />
  </div>
);
