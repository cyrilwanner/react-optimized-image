import React from 'react';
import Img from 'react-optimized-image';
import Image from './image.png';
export default () => (
  <div>
    <Img
      src={require('./image.png?url&original')}
      original
      url
      sizes={[400, 800]}
      rawSrc={{
        fallback: {
          400: {
            1: require('./image.png?url&original&width=400'),
          },
          800: {
            1: require('./image.png?url&original&width=800'),
          },
        },
      }}
    />
  </div>
);
