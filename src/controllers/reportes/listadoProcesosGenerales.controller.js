const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry, msgSinInfo } = global_c;

const table = "adm_clientes_misprocesos acm";
const query_base = `SELECT SQL_CALC_FOUND_ROWS acm.username, acm.despacho, acm.radicacion, acm.fecha_registro, acm.usuario, acm.proceso, acm.demandante, acm.demandado, acm.codigo_23, acm.juzgado_origen, acm.etiqueta_suscriptor, acm.expediente_digital
                    ,am.municipio as name_ciudad
                    ,ad.despacho as name_despacho
                    FROM ${table} 
                    INNER JOIN adm_municipio am ON left(acm.despacho,5) = am.IdMun
                    INNER JOIN adm_despacho ad ON acm.despacho = ad.IdDes
                    WHERE username IN (?) `;
const order_by = `order by acm.despacho, acm.radicacion`;
const limit = "LIMIT ?, ?";

const getData = async (req,res) => {
    try{
        const { demandante_demandado, radicacion, etiqueta, from, rows } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        let {status, count_rows, data, msg} = await getDataResp(group_users, demandante_demandado, radicacion, etiqueta, from, rows)
        return res.status(status).json({status, count_rows, data, msg});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const getDataResp = async (group_users, demandante_demandado, radicacion, etiqueta, from, rows, statusLimit = true) => {
    try{
        let params = [group_users];
        let sqlAdd = ``;
        if(demandante_demandado != ''){
            sqlAdd += ` AND (demandante LIKE ? OR demandado LIKE ?) `;
            params.push(`%${demandante_demandado}%`,`%${demandante_demandado}%`);
        }
        if(radicacion != ''){
            sqlAdd += ` AND radicacion = ? `;
            params.push(radicacion);
        }
        if(etiqueta != ''){
            sqlAdd += ` AND etiqueta_suscriptor LIKE ? `;
            params.push(`%${etiqueta}%`);
        }
        if(statusLimit){
            params.push(from, rows);
        }

        const connection = await getConnection();
        console.log(`${query_base}
        ${sqlAdd}
        ${order_by}
        ${(statusLimit) ? limit : ''}`,params);
        const result = await connection.query(`${query_base}
                                                ${sqlAdd}
                                                ${order_by}
                                                ${(statusLimit) ? limit : ''}`,params);
        const queryCount = await connection.query(`SELECT FOUND_ROWS() as cantidad`);
        let count_rows = queryCount[0].cantidad;
        let data = [];
        if(result.length > 0 ){
            data = result;
            connection.end();
            return {status:200, count_rows, data : data, msg : 'Generado correctamente'};
        }
        connection.end();
        return {status:400, count_rows : 0, data : [], msg : msgSinInfo};
    }catch(error){
        return { status : 500, count_rows : 0, data : [], msg : error.message}
    }
}

const insertData = async (req,res) => {
    try{
        const connection = await getConnection();
        const { id } = req.body;
        const result = await connection.query(`INSERT INTO ${table} VALUES()`, [id]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status:200, msg : `Proceso ${msgInsertOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgInsertErr} Proceso. ${msgTry}`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const updateData = async (req,res) => {
    try{
        const { expediente_digital, username, despacho, radicacion, codigo_23 } = req.body;
        let { demandante, demandado, etiqueta_suscriptor }  = req.body;
        let dataValida = {
            "Usuario" : username, 
            "Despacho" : despacho, 
            "Radicado" : radicacion, 
            "Radicado 23" : codigo_23,
            "Demandante" : demandante,
            "Demandado" : demandado
        }
        let valida = global_c.validateParams(dataValida);
        if(valida.status){ // Se actualiza
            demandante = demandante.toUpperCase().replace('/','');
            demandado = demandado.toUpperCase().replace('/','');
            etiqueta_suscriptor = (etiqueta_suscriptor != null && etiqueta_suscriptor != undefined) ? etiqueta_suscriptor.replace('/','') : etiqueta_suscriptor;
            const connection = await getConnection();
            const result = await connection.query(`UPDATE ${table}
                                                    SET demandante = ?,
                                                    demandado = ?,
                                                    etiqueta_suscriptor = ?,
                                                    expediente_digital = ?
                                                    WHERE username = ?
                                                    AND despacho = ?
                                                    AND radicacion = ?
                                                    AND codigo_23 = ?`, [demandante, demandado, etiqueta_suscriptor, expediente_digital, username, despacho, radicacion, codigo_23]);
            if(result.affectedRows > 0){
                connection.end();
                return res.status(200).json({status:200, msg : `Proceso ${msgUpdateOk}`});
            }
            connection.end();
            return res.status(400).json({status:400, msg : `${msgUpdateErr} Proceso. ${msgTry}`});
        }
        return res.status(400).json({status : 400, msg : valida.msg});
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
            return res.status(200).json({status : 200, msg : `Proceso ${msgDeleteOk}`});
        }
        connection.end();
        return res.status(400).json({status : 400, msg : `${msgDeleteErr} Proceso. ${msgTry}`});
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
        const { demandante_demandado, radicacion, etiqueta } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        let {status, count_rows, data, msg} = await getDataResp(group_users, demandante_demandado, radicacion, etiqueta, 0, 0, false)
        if(status == 200){
            if(data.length > 0){
                const title_report = "Reporte Listado General";
                const heads = [
                    {name: "Ciudad", campo : 'name_ciudad', width : 15}, // Este tamaño debe ser fijo para poder respetar la imagen
                    {name: "Despacho", campo : 'name_despacho', width : 30},
                    {name: "Radicación", campo : 'radicacion', width : 15},
                    {name: "Tipo Proceso", campo : 'proceso', width : 25},
                    {name: "Demandante", campo : 'demandante', width : 30},
                    {name: "Demandado", campo : 'demandado', width : 33},
                    {name: "Fecha de Registro", campo : 'fecha_registro', width : 25, type : 'Datetime'},
                    {name: "Radicacion 23 digitos", campo : 'codigo_23', width : 35},
                    {name: "Etiqueta", campo : 'etiqueta_suscriptor', width : 25, type : 'object'},
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
        exportExcel
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}