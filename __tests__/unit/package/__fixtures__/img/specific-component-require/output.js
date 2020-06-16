import React from 'react';

const { default: Image } = require('react-optimized-image/lib/components/Img');

export default () => (
  <div>
    <Image
      src={require('./image.jpg')}
      webp
      rawSrc={{
        fallback: {
          original: {
            1: require('./image.jpg'),
          },
        },
        webp: {
          original: {
            1: require('./image.jpg?webp'),
          },
        },
      }}
    />
  </div>
);
