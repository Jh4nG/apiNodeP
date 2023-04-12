const { config } = require("dotenv");

config();

module.exports = {
    host : process.env.host,
    database : process.env.database,
    user : process.env.user,
    password : process.env.password,
    hash : process.env.hash,
    host_mail : process.env.host_mail,
    SMTPAuth_mail : process.env.SMTPAuth_mail,
    username_mail : process.env.Username_mail,
    password_mail : process.env.Password_mail
}