const { encode } = require("blurhash");
const sharp = require("sharp");

module.exports = ({ strapi }) => ({
  async generateBlurhash(stream) {
    try {
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

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
