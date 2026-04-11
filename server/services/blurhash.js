const { encode } = require("blurhash");
const sharp = require("sharp");

module.exports = ({ strapi }) => ({
  async generateBlurhash(stream) {
    try {
      console.time("bufferCreation");

      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      console.timeEnd("bufferCreation");

      console.time("sharpDecode");

      // Decode via sharp
      const { data, info } = await sharp(buffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      console.timeEnd("sharpDecode");

      console.time("blurhashEncode");

      const blurhash = encode(data, info.width, info.height, 4, 4);

      console.timeEnd("blurhashEncode");

      return blurhash;
    } catch (error) {
      strapi.log.error(`Error generating blurhash: ${error.message}`);
      throw error;
    }
  },
});
