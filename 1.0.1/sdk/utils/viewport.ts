import { useDeviceDetection } from './device';
export function px2vw(px: number, designWidth = 375) {
    return `${(px / designWidth) * 100}vw`
  }


export function toUnit(value: number) {
  const { isPC } = useDeviceDetection();
  if (isPC) {
    // PC端用vw
    return `calc(${value} / 1920 * 100vw)`; // 或者用你的 pvw 函数
  } else {
    // H5端用px，交给 postcss-px-to-viewport 自动转换
    return `${value}px`;
  }
}