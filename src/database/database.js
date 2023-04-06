const mysql =  require("promise-mysql");
const config =  require("./../config");

const connection=mysql.createConnection({
    host: config.host,
    database: config.database,
    user: config.user,
    password: config.password
});

const getConnection = () =>{
    return connection;
}

module.exports = {
    getConnection
}