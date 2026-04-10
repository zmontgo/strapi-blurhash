const { encode } = require("blurhash");
const sharp = require("sharp");

module.exports = ({ strapi }) => ({
  async generateBlurhash(file_id) {
    try {
      const file = await strapi
        .plugin("upload")
        .service("upload")
        .findOne(file_id);

      if (!file) {
        throw new Error(`File not found`);
      }

      const buffer = Buffer.from(file.buffer);

      // Decode via sharp
      const { data, info } = await sharp(buffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const blurhash = encode(data, info.width, info.height, 4, 4);

      return blurhash;
    } catch (error) {
      strapi.log.error(`Error generating blurhash: ${error.message}`);
      throw error;
    }
  },
});
