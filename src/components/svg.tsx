import React, { ReactElement } from 'react';

export interface SvgProps {
  src: string;
  className?: string;
}

/* eslint-disable react/no-danger */
const Svg = ({ src, className }: SvgProps): ReactElement => {
  if (className) {
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: src.toString().replace(/<svg([\s|>])/, `<svg class=${JSON.stringify(className)}$1`),
        }}
      />
    );
  }

  return <span dangerouslySetInnerHTML={{ __html: src }} />;
};

export default Svg;
