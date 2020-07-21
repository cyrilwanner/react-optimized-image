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
    <StyledSvg src={SvgImage} />
    <StyledImg src={JpgImage} webp />
  </div>
);
