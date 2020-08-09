import React, { ReactElement } from 'react';
import { ImgSrc } from './types';

export interface SvgProps extends React.SVGProps<SVGSVGElement> {
  src: ImgSrc;
}

interface SvgInnerProps extends React.SVGProps<SVGSVGElement> {
  rawSrc: { default: React.ElementType };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Svg = ({ src, ...props }: SvgProps): ReactElement => {
  const { rawSrc, ...innerProps } = (props as unknown) as SvgInnerProps;

  if (!rawSrc) {
    throw new Error(
      "Babel plugin 'react-optimized-image/plugin' not installed or this component could not be recognized by it.",
    );
  }

  const SvgComponent: React.ElementType = rawSrc.default || rawSrc;

  if (typeof SvgComponent !== 'function') {
    throw new Error(
      "No react component generated. Please set `includeStrategy` option of optimized-images-loader to 'react'",
    );
  }

  return <SvgComponent {...innerProps} />;
};

export default Svg;
