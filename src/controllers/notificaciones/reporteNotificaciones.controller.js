const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry, msgSinInfo } = global_c;

const table = "adm_planillas";
const limit = "LIMIT ?, ?";
const sql = `SELECT SQL_CALC_FOUND_ROWS ap.idplanilla, ap.despacho, ap.radicacion, ap.notificacion, ap.proceso, ap.demandante, ap.demandado, ap.descripcion, ap.fechapublicacion, ap.departamento, ap.municipio, ap.corporacion, ap.despacho_a, REPLACE(ap.imagen,'Nota: ','') as nota, ap.ubicacion,ap.fechapublicacion as fechapublicacion
             ,am.municipio as name_ciudad
             ,ad.despacho as name_despacho
             ,ad.localizacion
             ,an.notificacion as name_notificacion
             ,IF(ap.imagen = '', false, true) as nota_status
             -- ,acm.etiqueta_suscriptor
             -- ,acm.expediente_digital
             FROM ${table} ap
             INNER JOIN adm_municipio am ON ap.municipio = am.IdMun
             INNER JOIN adm_despacho ad ON ap.despacho = ad.IdDes
             INNER JOIN adm_notificacion an ON ap.notificacion = an.id_notificacion
             LEFT JOIN acm ON (acm.radicacion = ap.radicacion AND acm.despacho = ap.despacho)`;

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
        let {status, count_rows, data, msg} = await getDataResp(username,fi,ff,from,rows,group_users,parent);
        return res.status(status).json({status, count_rows, data, msg});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const getDataResp = async (username,fi,ff,from,rows,group_users,parent, statusLimit = true, statusAuto = true) => {
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
            let whereAcm = [];
            result.forEach((i,e)=>{
                let {despacho,radicacion} = i;
                where.push(`(ap.despacho = '${despacho}' AND ap.radicacion = '${radicacion}')`);
                whereAcm.push(`(despacho = '${despacho}' AND radicacion = '${radicacion}')`);
            });
            
            let params = [/*group_users,*/fi,ff];
            if(statusLimit){
                params.push(from, rows);
            }
            console.log(`WITH
            acm as (SELECT radicacion,username,despacho,etiqueta_suscriptor,expediente_digital FROM adm_clientes_misprocesos WHERE (${whereAcm.join(' OR ')}))

            ${sql}
            WHERE (${where.join(' OR ')}) 
            AND DATE(ap.fechapublicacion) BETWEEN ? AND ? ORDER BY ${order} DESC
            ${(statusLimit) ? limit : ''}`);
            const query = await connection.query(`WITH
                                                acm as (SELECT radicacion,username,despacho,etiqueta_suscriptor,expediente_digital FROM adm_clientes_misprocesos WHERE (${whereAcm.join(' OR ')}))

                                                ${sql}
                                                WHERE (${where.join(' OR ')}) 
                                                AND DATE(ap.fechapublicacion) BETWEEN ? AND ? ORDER BY ${order} DESC
                                                ${(statusLimit) ? limit : ''}`,params);

            if(query.length > 0){
                const queryCount = await connection.query(`SELECT FOUND_ROWS() as cantidad`);
                let count_rows = queryCount[0].cantidad;
                if(statusAuto){
                    for(let i = 0; i < query.length; i++){
                        // Verifica existencia de auto
                        let {radicacion,idplanilla,fechapublicacion} = query[i];
                        let {status,ruta} = await global_c.verifyAuto(connection,parent,radicacion,idplanilla,fechapublicacion);
                        query[i].auto = status;
                        query[i].ruta_auto = ruta;
                    }
                }
                connection.end();
                return {status:200, count_rows, data : query, msg : ''};
            }
            connection.end();
            return {status:400, count_rows: 0, data : [], msg: msgSinInfo};
        }
        connection.end();
        return {status:400, count_rows: 0, data : [], msg: msgSinInfo};
    }
    return {status : 400, count_rows: 0, data : [], msg : valida.msg};
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

const exportExcel = async (req,res) =>{
    try{
        const { username,fi,ff, name_user, name_file } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        let {status, count_rows, data, msg} = await getDataResp(username,fi,ff,0,0,group_users,parent, false, false);
        res.json({status, count_rows, data, msg});
        return;
        if(status == 200){
            if(data.length > 0){
                const title_report = "Reporte Notificaciones";
                const heads = [
                    {name: "Ciudad", campo : 'name_ciudad', width : 15}, // Este tamaño debe ser fijo para poder respetar la imagen
                    {name: "Despacho", campo : 'name_despacho', width : 30},
                    {name: "Locaclización", campo : 'localizacion', width : 30},
                    {name: "Notificacion", campo : 'name_notificacion', width : 30},
                    {name: "Radicacion", campo : 'radicacion', width : 30},
                    {name: "Proceso", campo : 'proceso', width : 30},
                    {name: "Demandante", campo : 'demandante', width : 40},
                    {name: "Demandado", campo : 'demandado', width : 40},
                    {name: "Descripcion", campo : 'descripcion', width : 80},
                    {name: "Publicacion", campo : 'fechapublicacion', width : 30, type : 'Date'},
                    {name: "Ubicación", campo : 'ubicacion', width : 30},
                    {name: "Etiqueta", campo : 'etiqueta_suscriptor', width : 30},
                ];
                let {status, url, msg} = await global_c.generateExcel(username, name_user, title_report, name_file, heads, data);
                if(status == 200){
                    return res.status(status).json({status, url, msg});
                }
                return res.status(status).json({status, msg});
            }
            return res.status(status).json({status, msg});
        }
        return res.status(status).json({status, count_rows, data, msg});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message, url : '' });
    }
}

try{
    module.exports = {
        getData,
        insertData,
        updateData,
        deleteData,
        getDataId,
        getExpediente,
        exportExcel
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}