import React from 'react';

const { Img: Image } = require('react-optimized-image');

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
