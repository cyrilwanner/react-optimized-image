import React from 'react';

const Img = require('react-optimized-image').default;

const ProxyImg = Img;
const Image = ProxyImg;

export default () => (
  <div>
    <Image src={require('./image.png')} sizes={[400, 800]} />
  </div>
);
