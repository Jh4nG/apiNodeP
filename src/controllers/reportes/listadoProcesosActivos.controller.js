const request = require('request');
const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { correo_corporativo, fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry, msgSinInfo, secret_key_captcha } = global_c;

const table = "adm_operativos_misprocesos";
const query_base = `SELECT SQL_CALC_FOUND_ROWS aom.id_userope, aom.user_operativo, aom.despacho, aom.radicacion, aom.fecha_registro, aom.usuario, aom.proceso, aom.demandante, aom.demandado, aom.codigo_23 
                    ,left(aom.despacho,5) as municipio
                    ,am.municipio as name_ciudad
                    ,ad.despacho as name_despacho
                    ,adp.departamento as name_departamento
                    ,(SELECT etiqueta_suscriptor FROM adm_clientes_misprocesos WHERE radicacion = aom.radicacion AND username IN (?) AND despacho = aom.despacho AND etiqueta_suscriptor <> '' LIMIT 1) as etiqueta_suscriptor
                    ,(SELECT expediente_digital FROM adm_clientes_misprocesos WHERE radicacion = aom.radicacion AND despacho = aom.despacho LIMIT 1) as expediente_digital
                    FROM ${table} aom
                    INNER JOIN adm_municipio am ON left(aom.despacho,5) = am.IdMun
                    INNER JOIN adm_despacho ad ON aom.despacho = ad.IdDes
                    INNER JOIN adm_depto adp ON left(aom.despacho,2) = adp.IdDep
                    WHERE aom.usuario IN (?) `;
const order_by = `order by aom.despacho, aom.radicacion`;
const limit = "LIMIT ?, ?";

const getData = async (req,res) => {
    try{
        const { demandante_demandado, radicacion, from, rows } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        let statusLimit = true;
        if(from == undefined || rows == undefined){
            statusLimit = false;
        }
        let {status, count_rows, data, msg} = await getDataResp(group_users, demandante_demandado, radicacion, from, rows, statusLimit);
        return res.status(status).json({status, count_rows, data, msg});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const getDataResp = async (group_users, demandante_demandado, radicacion, from, rows, statusLimit = true) =>{
    try{
        let params = [group_users,group_users];
        let sqlAdd = ``;
        if(demandante_demandado != ''){
            sqlAdd += ` AND (demandante LIKE ? OR demandado LIKE ?) `;
            params.push(`%${demandante_demandado}%`,`%${demandante_demandado}%`);
        }
        if(radicacion != ''){
            sqlAdd += ` AND radicacion = ? `;
            params.push(radicacion);
        }
        if(statusLimit){
            params.push(from, rows);
        }
        const connection = await getConnection();
        const result = await connection.query(`${query_base}
                                                ${sqlAdd}
                                                ${order_by}
                                                ${(statusLimit) ? limit : ''}`, params);
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

const insertData = async (req,res) => {
    try{
        const connection = await getConnection();
        const { id } = req.body;
        const result = await connection.query(`INSERT INTO ${table} VALUES()`, [id]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status:200, msg : `ListadoProcesosActivos ${msgInsertOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgInsertErr} ListadoProcesosActivos. ${msgTry}`});
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
            return res.status(200).json({status:200, msg : `ListadoProcesosActivos ${msgUpdateOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgUpdateErr} ListadoProcesosActivos. ${msgTry}`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const deleteData = async (req,res)=>{
    try{
        const { id, name_user, username, captcha } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        let {statusCaptcha, msg_captcha} = await global_c.verifyCaptcha(req.connection.remoteAddress, captcha);
        if(statusCaptcha){ // pendiente terminar el llamara a la funcion global 
            const connection = await getConnection();
            let dataEmail = await global_c.getDataEmailDeleteActivos(connection, [group_users,id]);
            let { status, msg } = await global_c.deleteActivos(connection,id);
            if(status == 200){
                const { valor:correo_comercial } = await global_c.getParameter(connection,5);
                const { valor:web_master } = await global_c.getParameter(connection,14);
                if(dataEmail.status){
                    let html = `
                            <p style="color: #000 !important;"><b>Suscriptor:</b> ${name_user} </p>
                            <p style="color: #000 !important;"><b>Despacho:</b> ${dataEmail.despacho} </p>
                            <p style="color: #000 !important;"><b>Ciudad:</b> ${dataEmail.municipio} </p>
                            <p style="color: #000 !important;"><b>Departamento:</b> ${dataEmail.departamento} </p>
                            <p style="color: #000 !important;"><b>Radicado (9 digitos):</b> ${dataEmail.radicado} </p>
                            <p style="color: #000 !important;"><b>Radicado (23 digitos):</b> ${dataEmail.codigo_23} </p>
                            <p style="color: #000 !important;"><b>Tipo de Proceso:</b> ${dataEmail.proceso} </p>
                            <p style="color: #000 !important;"><b>Demandante:</b> ${dataEmail.demandante} </p>
                            <p style="color: #000 !important;"><b>Demandado:</b> ${dataEmail.demandado} </p>
                        `;
                    let icono = "b_drop.png";
                    await global_c.sendEmail(correo_corporativo, dataEmail.emails, "Eliminación de Vigilancia Judicial", html, `${correo_comercial},${web_master}`,icono);
                }
                connection.end();
                return res.status(200).json({status : 200, msg : `Procesos ${msgDeleteOk}`});
            }
            connection.end();
            return res.status(400).json({status : 400, msg, msgExtra : 'Error en inserción activos eliminados.'});
        }else{
            return res.status(400).json({status : 400, msg : msg_captcha});
        }
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
        const { username, name_user, name_file, demandante_demandado, radicacion } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        let {status, count_rows, data, msg} = await getDataResp(group_users, demandante_demandado, radicacion, 0, 0, false);
        if(status == 200){
            if(data.length > 0){
                const title_report = "Listado Procesos Activos";
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

const getDataInformeProcesal = async (req,res) => {
    try{
        const { username, despacho, radicacion } = req.body;
        const connection = await getConnection();

        const resultCmpInfoProcesal = await connection.query(`SELECT * FROM adm_cmp_informe_procesal WHERE activo = 1`);
        if(resultCmpInfoProcesal.length > 0){
            let cmpInfoProcesal = resultCmpInfoProcesal;
            let data = null;
            let multiData = [];
            const resultData = await connection.query(`SELECT * FROM adm_informe_procesal WHERE despacho = ? AND radicacion = ?`,[despacho,radicacion]);
            if(resultData.length > 0){
                data = resultData[0];
                const resultDataMultiple = await connection.query(`SELECT * FROM adm_informe_procesal_multidata WHERE id_informe_procesal = ?`, data.id);
                if(resultData.length > 0){
                    multiData = resultDataMultiple;
                }
            }
            connection.end();
            return res.status(200).json({ status : 200, cmpInfoProcesal, data, multiData});
        }
        return res.status(400).json({ status : 400, msg : 'Error en obtener data, vuevla a generar el proceso.'});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message});
    }
}

const getDataCmpTypeInformeProcesal = async (req,res) => {
    try{
        const connection = await getConnection();
        const data = await connection.query(`SELECT * FROM adm_cmp_type WHERE activo = 1`);
        if(data.length > 0){
            connection.end();
            return res.status(200).json({ status : 200, data});
        }
        connection.end();
        return res.status(400).json({ status : 400, msg : 'Error en obtener data, vuevla a generar la consulta.'});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message});
    }
}

const insertInformeProcesal = async (req,res)=>{
    try{
        const { cmpInfoProcesal, data, multiData } = req.body;
        // if(data.length > 0 && )
        res.status(200).json({status : 200, msg : `Proceso ${msgInsertOk}`});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message});
    }
}

try{
    module.exports = {
        getData,
        insertData,
        updateData,
        deleteData,
        getDataId,
        exportExcel,
        getDataInformeProcesal,
        getDataCmpTypeInformeProcesal,
        insertInformeProcesal
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}