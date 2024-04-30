// my-preset.ts
import { Preset, presetUno } from 'unocss'

export const myPreset: Preset = {
  name: 'my-preset',
  rules: [
    [/^m-(\d+)$/, ([_, num]) => ({ margin: `${num}px` })],
    [/^p-(\d+)$/, ([_, num]) => ({ padding: `${num}px` })]
  ],
  variants: [
    /* ... */
  ],
  shortcuts:[
    ["flex-col-center", "flex flex-col justify-center items-center"],
    ["flex-row-center", "flex flex-row justify-center items-center"],
    ["abs-center", "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"]
  ],
  // ...
}