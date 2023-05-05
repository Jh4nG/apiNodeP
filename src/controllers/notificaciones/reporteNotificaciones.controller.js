const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry } = global_c;

const table = "adm_planillas";
const sqlPreview = `SELECT * FROM adm_clientes_misprocesos WHERE username IN (?)
                    AND radicacion IN (SELECT radicacion FROM ${table} WHERE DATE(fechapublicacion) BETWEEN ? AND ?)
                    AND despacho IN (SELECT despacho FROM ${table} WHERE DATE(fechapublicacion) BETWEEN ? AND ?)`;
const order = "despacho, radicacion, fechapublicacion";

const getData = async (req,res) => {
    try{
        const { username,fi,ff } = req.body;
        let dataValida = {
            'Usuario' : username,
            'Fecha inicial' : fi,
            'Fecha final' : ff
        }
        let valida = global_c.validateParams(dataValida);
        if(valida.status){ // Se inserta
            const {status,data,msg} = await global_c.getParentUser(username);
            if(status==200){
                const { cc } = data;
                const connection = await getConnection();
                const result = await connection.query(sqlPreview,[cc,fi,ff,fi,ff]);
                if(result.length > 0 ){
                    let where = [];
                    result.forEach((i,e)=>{
                        let {despacho,radicacion} = i;
                        where.push(`(despacho = '${despacho}' AND radicacion = '${radicacion}')`);
                    });
                    const query = await connection.query(`SELECT *,DATE_FORMAT(fechapublicacion, '%Y-%m-%d') as fechapublicacion FROM ${table} WHERE (${where.join(' OR ')}) 
                                                        AND DATE(fechapublicacion) BETWEEN ? AND ? ORDER BY ${order} DESC`,[fi,ff]);
                    if(query.length > 0){
                        connection.end();
                        return res.status(200).json({status:200, data : query});
                    }
                    connection.end();
                    return res.status(400).json({status:400, data : [], msg: 'Sin información'});
                }
                connection.end();
                return res.status(400).json({status:400, data : [], msg: 'Sin información'});
            }
            return res.status(400).json({status : 400, msg : msg});
        }
        return res.status(400).json({status : 400, msg : valida.msg});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const insertData = async (req,res) => {
    try{
        const connection = await getConnection();
        const { id } = req.body;
        const result = await connection.query(`INSERT INTO ${table} VALUES()`, [id]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status:200, msg : `ReporteNotificaciones ${msgInsertOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgInsertErr} ReporteNotificaciones. ${msgTry}`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const updateData = async (req,res) => {
    try{
        const connection = await getConnection();
        const { id } = req.body;
        const result = await connection.query(`UPDATE ${table} SET , WHERE id = ? `, [id]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status:200, msg : `ReporteNotificaciones ${msgUpdateOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgUpdateErr} ReporteNotificaciones. ${msgTry}`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const deleteData = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { id } = req.body;
        const result = await connection.query(`DELETE FROM ${table} WHERE id = ?`,[id]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status : 200, msg : `ReporteNotificaciones ${msgDeleteOk}`});
        }
        connection.end();
        return res.status(400).json({status : 400, msg : `${msgDeleteErr} ReporteNotificaciones. ${msgTry}`});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const getDataId = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { id } = req.params;
        const result = await connection.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        let data = []
        if(result.length > 0 ){
            data = result[0];
        }
        connection.end();
        return res.status(200).json({status:200, data : data});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

try{
    module.exports = {
        getData,
        insertData,
        updateData,
        deleteData,
        getDataId
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}