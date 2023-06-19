const { config } = require("dotenv");

config();

module.exports = {
    host : process.env.host,
    database : process.env.database,
    user : process.env.user,
    password : process.env.password,
    port : process.env.port,
    // hash de peticiones
    hash : process.env.hash,
    // Secrect key capcha
    secret_key : process.env.secret_key,
    // variables envío emails
    host_mail : process.env.host_mail,
    SMTPAuth_mail : process.env.SMTPAuth_mail,
    username_mail : process.env.Username_mail,
    password_mail : process.env.Password_mail,
    // Rutas locales
    autos : process.env.autos,
    excel : process.env.excel
}