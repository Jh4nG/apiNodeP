const { config } = require("dotenv");

const d = new Date();
const fecha_actual= `${d.getFullYear()}-${(d.getMonth()+1 < 10)? `0${d.getMonth()+1}` : d.getMonth()}-${(d.getDate() < 10)? `0${d.getDate()}`:d.getDate()}`;
const fecha_actual_all = `${d} ${(d.getHours() < 10)? `0${d.getHours()}`:d.getHours()}:${(d.getMinutes() < 10)? `0${d.getMinutes()}`:d.getMinutes()}:${(d.getSeconds() < 10)? `0${d.getSeconds()}`:d.getSeconds()}`;

const sendEmail = () => {

}

module.exports = {
    sendEmail,
    fecha_actual,
    fecha_actual_all
}