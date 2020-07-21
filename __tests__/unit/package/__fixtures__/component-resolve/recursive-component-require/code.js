import React from 'react';

const { Svg } = require('react-optimized-image');
const Img = require('react-optimized-image').default;

const ProxySvg = Svg;
const Icon = ProxySvg;

const ProxyImg = Img;
const Image = ProxyImg;

export default () => (
  <div>
    <Icon src={require('./image.svg')} />
    <Image src={require('./image.png')} webp />
  </div>
);
