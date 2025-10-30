// wesmo-app/src/types/mqtt-browser.d.ts
// Map the browser build to the regular mqtt typings (from @types/mqtt).

declare module "mqtt/dist/mqtt.js" {
  export * from "mqtt";      // re-export all named types (IClientOptions, MqttClient, etc.)
  import mqttDefault from "mqtt";
  export default mqttDefault; // default export has same shape as `import mqtt from "mqtt"`
}
