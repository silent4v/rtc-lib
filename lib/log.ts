const Color = {
  warning: "#977C00",
  info: "#0000E3",
  success: "#01814A",
  failed: "#CE0000",
  default: "#000000",
}

let debugPattern: RegExp[] = [];

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

/**
 * @description
 * Accept a string as the regex rule, when using print(), if the `title` matches the rule, the message will be printed
 * 
 * @example
 * debug("Event::onmessage")
 * print("info", "Event::onmessage", "debug message."); // It's will print
 * 
 * print("info", "Connector", "debug message."); // It's won't print
 * debug("Event::onmessage", false) // use second argument to disable this rule.
 * print("info", "Event::onmessage", "debug message."); // It's won't print
 */
export function debug(pattern: string, trace = true) {
  if (trace) {
    const traceTag = pattern === "*" ? ".*" : pattern;
    if (debugPattern.every(e => e.source !== traceTag))
      debugPattern.push(new RegExp(traceTag, "i"));
  } else {
    const reg = new RegExp(`.*${pattern}.*`);
    debugPattern = debugPattern.filter(e => !reg.test(e.source));
    console.log(debugPattern);
  }
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
  if (debugPattern.some(regex => regex.test(title)))
    console.log(`%c[${title}] %o`, `color: ${Color[group] ?? Color.default}`, body);
}