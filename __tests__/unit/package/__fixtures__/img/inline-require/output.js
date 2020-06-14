import React from 'react';
import Img from 'react-optimized-image';
export default () => (
  <div>
    <Img
      src={require('./image.png')}
      sizes={[400, 800]}
      rawSrc={{
        fallback: {
          400: {
            1: require('./image.png?width=400'),
          },
          800: {
            1: require('./image.png?width=800'),
          },
        },
      }}
    />
  </div>
);
