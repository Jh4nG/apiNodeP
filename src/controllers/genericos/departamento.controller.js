const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry } = global_c;

const getData = async (req,res) => {
    try{
        const connection = await getConnection();
        connection.end();
        return res.status(200).json({status:200, msg : "Petición GetData"});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

try{
    module.exports = {
        getData
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}