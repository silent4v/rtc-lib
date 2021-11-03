const Color = {
  warning: "#977C00",
  info: "#0000E3",
  success: "#01814A",
  failed: "#CE0000",
  default: "#000000",
}

let debugState = false;

export function warning(title: string, body?: any) {
  print("warning", title, body);
}

export function info(title: string, body?: any) {
  print("info", title, body);
}

export function success(title: string, body?: any) {
  print("success", title, body);
}

export function failed(title: string, body?: any) {
  print("failed", title, body);
}

export function defineGroup(groupName: string, color: string) {
  Object.defineProperty(Color, groupName, { value: color });
}

export function debug(mode = true) {
  debugState = mode;
};
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
  
  if (debugState)
    console.log(`%c[${title}] %o`, `color: ${Color[group] ?? Color.default}`, body);
}