"use strict";

module.exports = ({ strapi }) => {
  const generateBlurhash = async (event, eventType) => {
    console.info(`generating blurhash for ${eventType} event`);
    const { data, where } = event.params;

    const host =
      strapi.plugin("strapi-blurhash").config("host") ??
      strapi.config.get("server.host", "defaultHost");
    // We allow the port to be unset in case the user is using a CDN
    const port = strapi.plugin("strapi-blurhash").config("port");

    let size = "small";

    if (strapi.plugin("strapi-blurhash").config("size")) {
      const chosenSize = strapi.plugin("strapi-blurhash").config("size");

      if (
        chosenSize === "small" ||
        chosenSize === "medium" ||
        chosenSize === "large"
      ) {
        size = chosenSize;
      } else {
        strapi.log.warn(
          `invalid size config: ${chosenSize}, using default size: small`,
        );
      }
    } else {
      strapi.log.warn("no size config found, using default size: small");
    }

    strapi.log.info(`server config - host: ${host}, port: ${port ?? ""}`);

    // Use the largest file. Sharp can handle it
    // Formats: thumbnail | small | medium | large
    const stream = data.formats?.[size]?.getStream?.();

    console.log("stream", stream);

    if (data.mime && data.mime.startsWith("image/")) {
      console.info(`generating blurhash for image: ${data.url}`);
      data.blurhash = await strapi
        .plugin("strapi-blurhash")
        .service("blurhash")
        .generateBlurhash(stream);
      console.log(`blurhash generated successfully: ${data.blurhash}`);
    }

    if (eventType === "beforeUpdate") {
      const regenerateOnUpdate = strapi
        .plugin("strapi-blurhash")
        .config("regenerateOnUpdate");
      const forceRegenerateOnUpdate = strapi
        .plugin("strapi-blurhash")
        .config("forceRegenerateOnUpdate");
      console.log(
        `update config - regenerateOnUpdate: ${regenerateOnUpdate}, forceRegenerateOnUpdate: ${forceRegenerateOnUpdate}`,
      );

      const fullData = await strapi.db.query("plugin::upload.file").findOne({
        select: ["url", "blurhash", "name", "mime"],
        where,
      });
      console.log(`found existing file: ${fullData.name}`);

      if (
        fullData.mime.startsWith("image/") &&
        (forceRegenerateOnUpdate || (!fullData.blurhash && regenerateOnUpdate))
      ) {
        let fullDataUrl = "";
        if (fullData.url.startsWith("http")) {
          fullDataUrl = fullData.url;
        } else {
          fullDataUrl = `${"http://" + host + ":" + port}${fullData.url}`;
        }
        console.log(`regenerating blurhash for image: ${fullDataUrl}`);
        data.blurhash = await strapi
          .plugin("strapi-blurhash")
          .service("blurhash")
          .generateBlurhash(fullDataUrl);
        console.log(`blurhash regenerated successfully: ${data.blurhash}`);
      }
    }
  };

  strapi.db.lifecycles.subscribe({
    models: ["plugin::upload.file"],
    beforeCreate: (event) => generateBlurhash(event, "beforeCreate"),
    beforeUpdate: (event) => generateBlurhash(event, "beforeUpdate"),
  });
  console.log("strapi-blurhash plugin bootstrap completed");
};
