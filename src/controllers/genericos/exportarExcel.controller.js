// const xl = require('exel4node');
const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry } = global_c;

const exportar = async (req,res) => {
    try{
        const { name_user, name_file, heads, rows } = req.body;
        // Libro
        let wb = new xl.Workbook();
        // Hoja
        let ws = wb.addWorksheet('Reporte');

        // Estilos
        let style = wb.createStyle({
            font: {
                color : '#000',
                size : 12
            }
        });

        // const connection = await getConnection();
        // const result = await connection.query(`SELECT * FROM ${table}`);
        
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

try{
    module.exports = {
        exportar
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}