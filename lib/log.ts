const Color = {
  warning: "#977C00",
  info: "#0000E3",
  success: "#01814A",
  failed: "#CE0000",
  default: "#000000",
}

export function warning(title: string, body?: any) {
  console.log(`%c[${title}] %o`, `color: ${Color.warning}`, body);
}

export function info(title: string, body?: any) {
  console.log(`%c[${title}] %o`, `color: ${Color.info}`, body);
}

export function success(title: string, body?: any) {
  console.log(`%c[${title}] %o`, `color: ${Color.success}`, body);
}

export function failed(title: string, body?: any) {
  console.log(`%c[${title}] %o`, `color: ${Color.failed}`, body);
}

export function defineGroup(groupName: string, color: string) {
  Object.defineProperty(Color, groupName, { value: color });
}

/**
 * use developer define group & print to console
 * @example
 * import { defineGroup, output } from "log.js"
 * defineGroup("test", "red");
 * output("test", "test::group", { message: "useful info"});
 * //console print
 * [test::group] {
 *   message: "useful info",
 * };
 */
export function print(group: string, title: string, body?: any) {
  console.log(`%c[${title}] %o`, `color: ${Color[group] ?? Color.default}`, body);
}