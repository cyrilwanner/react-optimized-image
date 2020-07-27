import React from 'react';
import Img, { Svg } from 'react-optimized-image';
import styled from '@emotion/styled';
import SvgImage from './image.svg';
import JpgImage from './image.jpg';
const StyledSvg = styled(Svg)({
  backgroundColor: 'red',
});
const StyledImg = styled(Img)({
  backgroundColor: 'red',
});
export default () => (
  <div>
    <StyledSvg src={require('./image.svg?include')} />
    <StyledImg
      src={JpgImage}
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
