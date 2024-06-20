This is a template for a simple next.js project with typescript, eslint, prettier, utilizing the 
[Cornerstone3D](https://github.com/cornerstonejs/cornerstone3D-beta) library for rendering.

## NOTE
we are using cornerstone3D version 2.0.beta which is not yet released and is still in development.

## Getting Started

```
npm install

npm run dev 
```

there are two routes 

1. / which shows a volume viewport - to make sure the cornerstone3d is working 
2. /polySeg which shows the contour to labelmap conversion - to make sure the custom wasm , worker and the conversion is working


## Lib
The `lib` folder contains custom loading scripts to read data from the server. These scripts are boilerplate code for reading metadata, adding instances, and other related tasks.

Note that building an entire viewer is often much more complicated. You might want to explore the [OHIF project](https://github.com/OHIF/Viewers/) for a comprehensive solution.
