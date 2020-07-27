import React from 'react';

const { default: Icon } = require('react-optimized-image/lib/components/Svg');

const { default: Image } = require('react-optimized-image/lib/components/Img');

export default () => (
  <div>
    <Icon src={require('./image.svg?include')} />
    <Image
      src={require('./image.jpg')}
      webp
      rawSrc={{
        fallback: {
          original: {
            1: require('./image.jpg?url'),
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
