# react-optimized-image [![npm version](https://badgen.net/npm/v/react-optimized-image)](https://www.npmjs.com/package/react-optimized-image) [![license](https://badgen.net/github/license/cyrilwanner/react-optimized-image)](https://github.com/cyrilwanner/react-optimized-image/blob/master/LICENSE) [![downloads](https://badgen.net/npm/dt/react-optimized-image)](https://www.npmjs.com/package/react-optimized-image)

Features:
- **Optimize** images on the fly using WebAssembly (runs in every environment)
- **React components** for different use-cases (responsive images, WebP conversion, lazy loading placeholders, image manipulation, ...)
- **Build cache for images** for faster builds
- **Convert to WebP** on the fly
- **Inline** small images automatically
- ...

## Table of contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
  - [Image components](#image-components)
- [Global image config](#global-image-config)
- [License](#license)

## Requirements

This image components requires [optimized-images-loader](https://github.com/cyrilwanner/optimized-images-loader) to already be installed and configured.

If you are using Next.js, you can use the [next-optimized-images](https://github.com/cyrilwanner/next-optimized-images) plugin instead for easier configuration.

## Installation

```
npm install react-optimized-image
```

Add the `react-optimized-image/plugin` babel plugin to your `.babelrc` file.
If you don't yet have a `.babelrc` file, create one with the following content:

```json
{
  "plugins": ["react-optimized-image/plugin"]
}
```

## Usage

You can now import or require your images directly in your react components:

```javascript
import React from 'react';
import Img from 'react-optimized-image';
import Header from './images/header.jpg';

export default () => (
  <div>
    {/* with import statement ..*/}
    <Img src={Header} />

    {/* ..or an inline require */}
    <Img src={require('./images/my-small-image.png')} />
  </div>
);

/**
 * Results in:
 *
 * <div>
 *   <img src="/_next/static/chunks/images/my-image-5216de428a8e8bd01a4aa3673d2d1391.jpg" />
 *   <img src="data:image/png;base64,..." />
 * </div>
 */
```

### Image components

For easier use and full typescript support, this plugin provides some image components.

* [`Img`](#img)
* [`Svg`](#svg)

#### Img

The `Img` component can be used to include a normal image. Additionally, it can create a WebP fallback and provide different sizes for different viewports.

##### Usage

```javascript
import Img from 'react-optimized-image';
import MyImage from './images/my-image.jpg';

export default () => (
  <>
    <h1>Normal optimized image</h1>
    <Img src={MyImage} />

    <h1>Image will be resized to 400px width</h1>
    <Img src={MyImage} sizes={[400]} />

    <h1>A WebP image will be served in two sizes: 400px and 800px</h1>
    <h2>As a fallback, a jpeg image will be provided (also in both sizes)</h2>
    <Img src={MyImage} webp sizes={[400, 800]} />
  </>
);

/**
 * Results in:
 *
 * <h1>Normal optimized image</h1>
 * <img src="/_next/static/chunks/images/my-image-5216de428a8e8bd01a4aa3673d2d1391.jpg" />
 *
 * <h1>Image will be resized to 400px width</h1>
 * <img src="/_next/static/chunks/images/my-image-572812a2b04ed76f93f05bf57563c35d.jpg" />
 *
 * <h1>A WebP image will be served in two sizes: 400px and 800px</h1>
 * <h2>As a fallback, a jpeg image will be provided (also in both sizes)</h2>
 * <picture>
 *  <source type="image/webp" srcset="/_next/static/chunks/images/image-0cc3dc9faff2e36867d4db3de15a7b32.webp" media="(max-width: 400px)">
 *  <source type="image/webp" srcset="/_next/static/chunks/images/image-08ce4cc7914a4d75ca48e9ba0d5c65da.webp" media="(min-width: 401px)">
 *  <source type="image/jpeg" srcset="/_next/static/chunks/images/image-132d7f8860bcb758e97e54686fa0e240.jpg" media="(max-width: 400px)">
 *  <source type="image/jpeg" srcset="/_next/static/chunks/images/image-9df4a476716a33461114a459e64301df.jpg" media="(min-width: 401px)">
 *  <img src="/_next/static/chunks/images/image-0f5726efb3915365a877921f93f004cd.jpg"></picture>
 * </picture>
 */
```

##### Properties

| Prop | Required | Type | Description |
| :--- | :------: | :--: | :---------- |
| src | **yes** | `string` | Source image. |
| webp | | `boolean` | If true, the image will get converted to WebP. For browsers which don't support WebP, an image in the original format will be served. |
| sizes | | `number[]` | Resize the image to the given width. If only one size is present, an `<img>` tag will get generated, otherwise a `<picture>` tag for multiple sizes. |
| densities | | `number[]` | **Default:** `[1]`<br>Specifies the supported pixel densities. For example, to generate images for retina displays, set this value to `[1, 2]`. |
| breakpoints | | `number[]` | Specifies the breakpoints used to decide which image size to use (when the `size` property is present). If no breakpoints are specified, they will automatically be set to match the image sizes which is good for full-width images but result in too big images in other cases.<br>The breakpoints should have the same order as the image sizes.<br>Example for this query: ```sizes={[400, 800, 1200]} breakpoints={[600, 1000]}```<br>For widths 0px-600px the 400px image will be used, for 601px-1000px the 800px image will be used and for everything larger than 1001px, the 1200px image will be used. |
| inline | | `boolean` | If true, the image will get forced to an inline data-uri (e.g. `data:image/png;base64,...`). |
| url | | `boolean` | If true, the image will get forced to be referenced with an url, even if it is a small image and would get inlined by default. |
| original | | `boolean` | If true, the image will not get optimized (but still resized if the `sizes` property is present). |
| type | | `string` | So you don't have to repeat yourself by setting the same sizes or other properties on many images, specify the image type which equals to one in your [global image config](#global-image-config). |
| *anything else* | | `ImgHTMLAttributes` | All other properties will be directly passed to the `<img>` tag. So it would for example be possible to use native lazy-loading with `loading="lazy"`. |

#### Svg

The `Svg` includes an svg file directly into the HTML so it can be styled by CSS. If you don't want to include them directly in the HTML, you can also use svg images together with the [`Img`](#img) component which will reference it by the URL.

##### Usage

```javascript
import { Svg } from 'react-optimized-image';
import Icon from './icons/my-icon.svg';

export default () => (
  <>
    <h1>SVG will be directly included in the HTML</h1>
    <Svg src={Icon} className="fill-red" />
  </>
);

/**
 * Results in:
 *
 * <span><svg class="fill-red" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="280" height="330"><g><path>...</path></g></svg></span>
 */
```

##### Properties

| Prop | Required | Type | Description |
| :--- | :------: | :--: | :---------- |
| src | **yes** | `string` | Source image. |
| className | | `string` | Class to apply to the `<svg>` tag. |

## Global image config

The `images.config.js` file contains default image optimization options and is located in the **root** of your project.

Available options:
| Option | Type | Description |
| :--- | :------: | :---------- |
| default | `ImgProps` | Properties specified within the `default` key will get applied to **all** usages of the [`Img`](#img) components.<br>All properties of the [`Img`](#img) component can be set. For example, to convert **all** your images to WebP, set `{ webp: true }`. |
| types | `Record<string, ImgProps>` | Instead of specifying options for **all** images with the `default` key, you can create as many image `types` as you want. Those can also contain all properties of the [`Img`](#img) component. The options specified in the `default` key will also get applied here if they are not overwritten. |

#### Example

```javascript
// images.config.js

module.exports = {
  default: {
    webp: true,
  },
  types: {
    thumbnail: {
      sizes: [200, 400],
      breakpoints: [800],
      webp: false,
    },
  },
};
```

This will convert **all images** to WebP. The images with the `thumbnail` type will be generated in two sizes (200, 400) but not converted to WebP. If `webp: false` would not be present, it would get inherited from the `default` key.

```javascript
import React from 'react';
import Img from 'react-optimized-image';
import MyImage from './images/my-image.jpg';

export default () => (
  <div>
    {/* This will get converted into a WebP image (while still providing a fallback image). */}
    <Img src={MyImage} />

    {/* This will be provided in to sizes (200, 400) but not get converted to WebP. */}
    <Img src={MyImage} type="thumbnail" />
  </div>
);
```

## License

Licensed under the [MIT](https://github.com/cyrilwanner/react-optimized-image/blob/master/LICENSE) license.

© Copyright Cyril Wanner
