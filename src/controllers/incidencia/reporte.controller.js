const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry, msgSinInfo } = global_c;

const table = "Reporte";
const query_base = `SELECT SQL_CALC_FOUND_ROWS * FROM ${table}`;

const reportIncidencia = async (req, res) => {
    try{
        const { username, asunto, descripcion, file } = req.body;
        console.log(file);        
    }catch(error){
        return { status : 500, count_rows : 0, data : [], msg : error.message}
    }
}

try{
    module.exports = {
        reportIncidencia
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}