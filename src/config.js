const { config } = require("dotenv");

config();

module.exports = {
    // Rutas locales
    autos : process.env.autos,
    excel : process.env.excel,
    images : process.env.images
}