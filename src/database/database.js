const mysql =  require("promise-mysql");
const config =  require("./../config");


const getConnection = () =>{
    try{
        const connection=mysql.createConnection({
            host: config.host,
            database: config.database,
            user: config.user,
            password: config.password,
            port : config.port,
            multipleStatements: true,
            connectionLimit: 1000 // set the maximum number of connections
        });
        return connection;
    }catch(error){
        console.log(error.message);
        return error.message;
    }
}

module.exports = {
    getConnection
}