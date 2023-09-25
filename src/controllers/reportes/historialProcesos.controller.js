const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry, msgSinInfo } = global_c;

const table = "adm_clientes_misprocesos";
const query_base = `SELECT SQL_CALC_FOUND_ROWS acm.radicacion,acm.proceso,acm.demandante,acm.demandado,acm.codigo_23,acm.despacho as dp,ad.despacho,am.municipio,acm.despacho as idDesp, acm.expediente_digital, acm.etiqueta_suscriptor
                    FROM ${table} acm, adm_despacho ad,adm_municipio am
                    WHERE acm.despacho = ad.IdDes
                    AND SUBSTRING(ad.IdDes,1,5) = am.IdMun`;
const order = ` ORDER BY acm.despacho ASC, acm.fecha_registro DESC`;
const limit = "LIMIT ?, ?";

const query_actuacion = `SELECT SQL_CALC_FOUND_ROWS ap.idplanilla, ap.despacho as idDesp, ap.radicacion, ap.notificacion as idNot, ap.proceso, ap.demandante, ap.demandado, ap.descripcion, ap.fechapublicacion, ap.departamento, ap.municipio, ap.corporacion, ap.despacho_a, ap.imagen, ap.ubicacion 
                         ,ad.despacho
                         ,an.notificacion
                         FROM adm_planillas ap, adm_despacho ad, adm_notificacion an
                         WHERE ap.despacho = ad.IdDes
                         AND ap.notificacion = an.id_notificacion`;
const order_actuacion = `ORDER BY ap.fechapublicacion DESC, ap.idplanilla ASC`;

const getData = async (req,res) => {
    try{
        const { depto, municipio, corporacion, despacho, radicacion, from, rows } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        let {status, count_rows, data, msg} = await getDataResp(group_users, depto, municipio, corporacion, despacho, radicacion, from, rows);
        return res.status(status).json({status, count_rows, data, msg});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const getDataResp = async (group_users, depto = '', municipio = '', corporacion = '', despacho = '', radicacion = '', from = 0, rows = 0, statusLimit = true) =>{
    try{
        let params = [group_users];
        let sqlAdd = ``;
        if(depto){
            sqlAdd += ` AND am.depto_IdDep = ? `;
            params.push(depto);
        }
        if(municipio){
            sqlAdd += ` AND am.IdMun = ? `;
            params.push(municipio);
        }
        if(corporacion){
            sqlAdd += ` AND acm.despacho LIKE ?`;
            params.push(`${corporacion}%`);
        }
        if(despacho){
            sqlAdd += ` AND acm.despacho = ?`;
            params.push(despacho);
        }
        if(radicacion){
            sqlAdd += ` AND acm.radicacion = ?`;
            params.push(radicacion);
        }
        if(statusLimit){
            params.push(from, rows);
        }
        const connection = await getConnection();
        const result = await connection.query(`${query_base}
                                               AND acm.username IN (?) 
                                               ${sqlAdd}
                                               ${order}
                                               ${(statusLimit) && limit}`,params);
        const queryCount = await connection.query(`SELECT FOUND_ROWS() as cantidad`);
        let count_rows = queryCount[0].cantidad;
        let data = [];
        if(result.length > 0 ){
            connection.end();
            return {status:200, count_rows, data : result, msg : 'Generado correctamente'};
        }
        connection.end();
        return {status:400, count_rows, data, msg : msgSinInfo};
    }catch(error){
        return { status : 500, count_rows : 0, data : [], msg : error.message}
    }
}

const getActuacion = async (req,res) => {
    try{
        const { despacho, radicacion, fi, ff, demandante, demandado, from, rows  } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        const connection = await getConnection();
        let sqlAdd = ``;
        let params = [despacho,radicacion];
        if(fi && ff){
            sqlAdd += ` AND ap.fechapublicacion BETWEEN ? AND ? `;
            params.push(fi,ff);
        }
        if(demandante){
            sqlAdd += ` AND ap.demandante LIKE ? `;
            params.push(`%${demandante}%`);
        }
        if(demandado){
            sqlAdd += ` AND ap.demandado LIKE ? `;
            params.push(`%${demandado}%`);
        }
        params.push(from, rows);
        const result = await connection.query(`${query_actuacion}
                                                AND ap.despacho = ? AND ap.radicacion = ? 
                                                ${sqlAdd}
                                                ${order_actuacion}
                                                ${limit}`,params);
        const queryCount = await connection.query(`SELECT FOUND_ROWS() as cantidad`);
        let count_rows = queryCount[0].cantidad;
        let data = [];
        if(result.length > 0 ){
            for(let i = 0; i < result.length; i++){
                // Verifica existencia de auto
                let {radicacion,idplanilla,fechapublicacion} = result[i];
                let {status,ruta} = await global_c.verifyAuto(connection,parent,radicacion,idplanilla,fechapublicacion);
                result[i].auto = status;
                result[i].ruta_auto = ruta;
            }
            connection.end();
            return res.status(200).json({status:200, count_rows, data : result, msg : 'Generado correctamente'});
        }
        connection.end();
        return res.status(400).json({status:400, count_rows, data, msg : msgSinInfo});
    }catch(error){
        return res.status(500).json({ status : 500, count_rows : 0, data : [], msg : error.message});
    }
}

const insertData = async (req,res) => {
    try{
        const connection = await getConnection();
        const { id } = req.body;
        const result = await connection.query(`INSERT INTO ${table} VALUES()`, [id]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status:200, msg : `HistorialProcesos ${msgInsertOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgInsertErr} HistorialProcesos. ${msgTry}`});
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
            return res.status(200).json({status:200, msg : `HistorialProcesos ${msgUpdateOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgUpdateErr} HistorialProcesos. ${msgTry}`});
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
            return res.status(200).json({status : 200, msg : `HistorialProcesos ${msgDeleteOk}`});
        }
        connection.end();
        return res.status(400).json({status : 400, msg : `${msgDeleteErr} HistorialProcesos. ${msgTry}`});
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

const exportExcel = async (req,res) =>{
    try{
        const { username, name_user, name_file } = req.body;
        let { status, data } = await getData();
        if(status == 200){
            if(data.length > 0){
                const title_report = "HistorialProcesos";
                const heads = [
                    {name: "Prueba", campo : 'name_prueba', width : 15}, // Este tamaño debe ser fijo para poder respetar la imagen
                    {name: "fechas", campo : 'fechas', width : 30, type : 'Date'},
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
        getActuacion,
        insertData,
        updateData,
        deleteData,
        getDataId,
        exportExcel
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}