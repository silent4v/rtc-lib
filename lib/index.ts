/**
 * @file
 * 
 * @description
 * Connector is the most important Class for dev RTC Appliction
 * 
 * @example 
 * // Text-chat application
 * cosnt client = new Connector(socketURL);
 * await client.register();
 * client.subscribe("channel-1");
 * client.talk("channel-1", someMessage);
 * 
 * @example 
 * // Video-chat application
 * cosnt client = new Connector(socketURL);
 * await client.register();
 * client.subscribe("channel-1");
 * client.talk("channel-1", someMessage);
 */

export * from "./config.js";
export * from "./connector.js";
export * from "./events.js";
export * from "./log.js";
export * from "./messenger.js";
export * from "./streamings.js";
export * from "./types.js";
export * from "./utils.js";