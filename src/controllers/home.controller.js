const { getConnection } = require("./../database/database");
const global_c = require("./../assets/global.controller");
const { fecha_actual, fecha_actual_all } = global_c;

const getVencimientos = async (req,res) =>{
    try{
        const connection = await getConnection();
        const { user } = req.params;
        const result = connection.query(`SELECT * FROM adm_vencimiento_terminos WHERE 
                                        username= ? AND 
                                        DATE(fecha_vence_terminos) >= ? ORDER BY
                                        despacho, radicacion, fecha_vence_terminos DESC
                                        LIMIT 5`,[user,fecha_actual]);
        if(result.length > 0){
            return res.json({ status : 200, data : result[0]});
        }
        return res.json({ status : 200, data : [], msg : "Sin información"});
    }catch(error){
        res.json({ status : 500, msg : error.message});
    }
}

module.exports = {
    getVencimientos
}