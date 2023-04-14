const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all } = global_c;

const getAudiencias = async (req, res) => {
    try{
        const connection = await getConnection();
        const { username,fi,ff } = req.body;

        const result = await connection.query(`SELECT * FROM adm_vencimiento_terminos 
                                                WHERE username = ? 
                                                AND DATE(fecha_vence_terminos) BETWEEN ? AND ? 
                                                ORDER BY despacho, radicacion, fecha_vence_terminos DESC`,[username,fi,ff]);
        if(result.length > 0){
            
        }
        return res.status(200).json({ status : 200, data : [] });
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

module.exports = {
    getAudiencias
}