const mysql =  require("promise-mysql");
const config =  require("./../config");


const getConnection = () =>{
    try{
        const connection=mysql.createConnection({
            host: config.host,
            database: config.database,
            user: config.user,
            password: config.password
        });
        return connection;
    }catch(error){
        return error.message;
    }
}

module.exports = {
    getConnection
}