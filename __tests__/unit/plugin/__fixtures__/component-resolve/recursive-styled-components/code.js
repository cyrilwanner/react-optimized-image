import React from 'react';
import Img, { Svg } from 'react-optimized-image';
import styled from 'styled-components';
import SvgImage from './image.svg';
import JpgImage from './image.jpg';

const StyledSvg = styled(Svg)`
  background-color: red;
`;

const StyledIcon = styled(StyledSvg)`
  font-size: 16px;
`;

const StyledImg = styled(Img)`
  background-color: red;
`;

const StyledImage = styled(StyledImg)`
  font-size: 16px;
`;

export default () => (
  <div>
    <StyledIcon src={SvgImage} />
    <StyledImage src={JpgImage} webp />
  </div>
);
