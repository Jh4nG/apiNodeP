const mysql =  require("promise-mysql");
const config =  require("./../config");


const getConnection = () =>{
    try{
        const connection=mysql.createConnection({
            host: config.host,
            database: config.database,
            user: config.user,
            password: config.password,
            multipleStatements: true,
            connectionLimit: 1000 // set the maximum number of connections
        });
        return connection;
    }catch(error){
        return error.message;
    }
}

module.exports = {
    getConnection
}