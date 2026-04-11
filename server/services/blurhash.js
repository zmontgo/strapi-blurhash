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

      return new Promise((resolve, reject) => {
        sharp(buffer)
          .raw()
          .ensureAlpha()
          .resize(32, 32, { fit: "inside" })
          .toBuffer((err, buffer, { width, height }) => {
            if (err) return reject(err);
            resolve(encode(new Uint8ClampedArray(buffer), width, height, 4, 4));
          });
      });
    } catch (error) {
      strapi.log.error(`Error generating blurhash: ${error.message}`);
      throw error;
    }
  },
});
