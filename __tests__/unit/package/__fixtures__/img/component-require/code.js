import React from 'react';

const Img = require('react-optimized-image').default;

export default () => (
  <div>
    <Img src={require('./image.png')} sizes={[400, 800]} />
  </div>
);
