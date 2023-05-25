const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry, msgSinInfo } = global_c;

const table = "adm_planillas";
const limit = "LIMIT ?, ?";
const sqlcount = `SELECT ap.idplanilla FROM ${table} ap`;
const sql = `SELECT SQL_CALC_FOUND_ROWS ap.idplanilla, ap.despacho, ap.radicacion, ap.notificacion, ap.proceso, ap.demandante, ap.demandado, ap.descripcion, ap.fechapublicacion, ap.departamento, ap.municipio, ap.corporacion, ap.despacho_a, REPLACE(ap.imagen,'Nota: ','') as nota, ap.ubicacion,ap.fechapublicacion as fechapublicacion
             ,am.municipio as name_ciudad
             ,ad.despacho as name_despacho
             ,an.notificacion as name_notificacion
             ,IF(ap.imagen = '', false, true) as nota_status
             ,(SELECT etiqueta_suscriptor FROM adm_clientes_misprocesos WHERE radicacion = ap.radicacion AND username IN (?) AND despacho = ap.despacho AND etiqueta_suscriptor <> '' LIMIT 1) as etiqueta_suscriptor
             ,(SELECT expediente_digital FROM adm_clientes_misprocesos WHERE radicacion = ap.radicacion AND despacho = ap.despacho LIMIT 1) as expediente_digital
             FROM ${table} ap
             INNER JOIN adm_municipio am ON ap.municipio = am.IdMun
             INNER JOIN adm_despacho ad ON ap.despacho = ad.IdDes
             INNER JOIN adm_notificacion an ON ap.notificacion = an.id_notificacion`;

const sqlPreview = `SELECT radicacion,despacho FROM adm_clientes_misprocesos WHERE username IN (?)
                    AND radicacion IN (SELECT radicacion FROM ${table} WHERE DATE(fechapublicacion) BETWEEN ? AND ?)
                    AND despacho IN (SELECT despacho FROM ${table} WHERE DATE(fechapublicacion) BETWEEN ? AND ?)`;
const order = "ap.despacho, ap.radicacion, ap.fechapublicacion";

const getData = async (req,res) => {
    try{
        const { username,fi,ff,from,rows } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        let dataValida = {
            'Usuario' : username,
            'Fecha inicial' : fi,
            'Fecha final' : ff
        }
        let valida = global_c.validateParams(dataValida);
        if(valida.status){ // Se inserta
            const connection = await getConnection();
            const result = await connection.query(sqlPreview,[group_users,fi,ff,fi,ff]);
            
            if(result.length > 0 ){
                let where = [];
                result.forEach((i,e)=>{
                    let {despacho,radicacion} = i;
                    where.push(`(ap.despacho = '${despacho}' AND ap.radicacion = '${radicacion}')`);
                });
                
                const query = await connection.query(`${sql}
                                                    WHERE (${where.join(' OR ')}) 
                                                    AND DATE(ap.fechapublicacion) BETWEEN ? AND ? ORDER BY ${order} DESC
                                                    ${limit}`,[group_users,fi,ff, from, rows]);
                if(query.length > 0){
                    const queryCount = await connection.query(`SELECT FOUND_ROWS() as cantidad`);
                    let count_rows = queryCount[0].cantidad;
                    for(let i = 0; i < query.length; i++){
                        // Verifica existencia de auto
                        let {radicacion,idplanilla,fechapublicacion} = query[i];
                        let {status,ruta} = await global_c.verifyAuto(connection,parent,radicacion,idplanilla,fechapublicacion);
                        query[i].auto = status;
                        query[i].ruta_auto = ruta;
                    }
                    connection.end();
                    return res.status(200).json({status:200, count_rows, data : query});
                }
                connection.end();
                return res.status(400).json({status:400, data : [], msg: msgSinInfo});
            }
            connection.end();
            return res.status(400).json({status:400, data : [], msg: msgSinInfo});
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

const getExpediente = async(req,res)=>{
    try{
        const { username,radicacion,despacho } = req.body;
        let dataValida = {
            'Usuario' : username,
            'Radicado' : radicacion,
            'Despacho' : despacho
        }
        let valida = global_c.validateParams(dataValida);
        if(valida.status){ // Se ejectua
            const connection = await getConnection();
            const { statusExpediente, url } = await global_c.getExpediente(connection,despacho,radicacion);
            if(statusExpediente){
                connection.end();
                return res.status(200).json({status:200, url});
            }
            connection.end();
            return res.status(200).json({status:400,url:''});
        }
        return res.status(400).json({status : 400, msg : valida.msg});
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
        getDataId,
        getExpediente
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}