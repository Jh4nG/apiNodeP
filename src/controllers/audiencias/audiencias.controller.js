const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry, msgSinInfo } = global_c;

const base_query = `SELECT 
                    vt.id_vencimiento,vt.username,vt.ciudad,vt.despacho,vt.radicacion,DATE(vt.fecha_registro) as fecha_registro,vt.usuario,vt.proceso,vt.demandante,vt.demandado,DATE(vt.fecha_vence_terminos) as fecha_vence_terminos,vt.descripcion_vence_terminos,vt.idplanilla,vt.idevents,
                    am.municipio as nameCiudad,
                    ad.despacho as nameDespacho
                    FROM adm_vencimiento_terminos vt
                    INNER JOIN adm_municipio am ON vt.ciudad = am.IdMun
                    INNER JOIN adm_despacho ad ON vt.despacho = ad.IdDes`;
const base_query_all = `${base_query} 
                        WHERE username = ? 
                        AND DATE(fecha_vence_terminos) BETWEEN ? AND ? 
                        ORDER BY vt.despacho, vt.radicacion, vt.fecha_vence_terminos DESC`;

const getVencimientos = async (req,res) =>{
    try{
        const connection = await getConnection();
        const { user } = req.params;
        const result = await connection.query(`${base_query}
                                                WHERE vt.username = ? 
                                                AND DATE(vt.fecha_vence_terminos) >= ?
                                                ORDER BY vt.despacho, vt.radicacion, vt.fecha_vence_terminos DESC
                                                LIMIT 5`,[user,fecha_actual]);
        if(result.length > 0){
            connection.end();
            return res.json({ status : 200, count_rows : result.length, data : result});
        }
        connection.end();
        return res.json({ status : 200, data : [], msg : msgSinInfo});
    }catch(error){
        res.json({ status : 500, msg : error.message});
    }
}

const getAudiencias = async (req, res) => {
    try{
        const connection = await getConnection();
        const { username,fi,ff } = req.body;

        const result = await connection.query(`${base_query_all}`,[username,fi,ff]);
        if(result.length > 0){
            connection.end();
            return res.json({ status : 200, count_rows : result.length, data : result});
        }
        connection.end();
        return res.status(200).json({ status : 200, data : [], msg : msgSinInfo});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const getAudienciasIdQuery = async (username = '',id = 0) =>{
    try{
        const connection = await getConnection();
        let query = await connection.query(`${base_query}
                                WHERE username = ? 
                                AND vt.id_vencimiento = ?`,[username,id]);
        connection.end();
        return query;
    }catch(error){
        return [];
    }
}

const getAudienciasId = async (req,res) =>{
    try{
        const { username,id } = req.params;
        const result = await getAudienciasIdQuery(username,id);
        if(result.length > 0){
            return res.status(200).json({ status : 200, data : result[0]});
        }
        return res.status(200).json({ status : 200, data : [], msg : msgSinInfo});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const insertAudiencias = async (req,res) => {
    try {
        const { username, ciudad, despacho, radicacion,  proceso, demandante, demandado, fecha_vence_terminos, descripcion_vence_terminos, idplanilla } = req.body;
        let dataValida = {
            'Usuario' : username,
            'Ciudad' : ciudad,
            'Despacho' : despacho,
            'Radicación' : radicacion,
            'Proceso' : proceso,
            'Demandante' : demandante, 
            'Demandado': demandado,
            'Fecha Audiencia / Vencimiento' : fecha_vence_terminos,
            'Detalle Audiencia Vencimiento' : descripcion_vence_terminos
        };
        let valida = global_c.validateParams(dataValida);
        if(valida.status){ // Se inserta
            const connection = await getConnection();
            let dataQuery = [
                username, ciudad, despacho, radicacion, fecha_actual, username, proceso, demandante, demandado, fecha_vence_terminos, descripcion_vence_terminos, idplanilla
            ];
            const result = await connection.query(`INSERT INTO adm_vencimiento_terminos( username, ciudad, despacho, radicacion, fecha_registro, usuario, proceso, demandante, demandado, fecha_vence_terminos, descripcion_vence_terminos, idplanilla, idevents)
                                                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,0)`,dataQuery);
            if(result.affectedRows > 0){
                let data = {
                    fecha_vence_terminos,
                    terminos: descripcion_vence_terminos,
                    username,
                    id_vencimiento : result.insertId,
                    color : "#0071C5"
                };
                let evento = await setDetalleEvento('Insert',data);
                if(evento){
                    await connection.query(`UPDATE adm_vencimiento_terminos SET idevents = ? WHERE id_vencimiento = ?`, [evento,result.insertId]);
                    connection.end();
                    return res.status(200).json({status : 200, msg : `Audiencia ${msgInsertOk}`, msgEvento : evento});
                }
                connection.end();
                return res.status(400).json({status : 400, msg : `${msgInsertErr} evento. ${msgTry}`});
            }
            connection.end();
            return res.status(400).json({status : 400, msg : `${msgInsertErr} audiencia. ${msgTry}`});
        }
        return res.status(400).json({status : 400, msg : valida.msg});
    } catch (error) {
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const updateAudiencias = async (req,res)=>{
    try{
        const { username,fecha_vence_terminos,descripcion_vence_terminos,id_vencimiento } = req.body;
        let dataValida = {
            'Usuario' : username,
            'Fecha Audiencia / Vencimiento' : fecha_vence_terminos,
            'Detalle Audiencia Vencimiento' : descripcion_vence_terminos,
            'Id vencimiento' : id_vencimiento
        };
        let valida = global_c.validateParams(dataValida);
        if(valida.status){ // Se actualiza
            const connection = await getConnection();
            if(fecha_vence_terminos < fecha_actual){
                connection.end();
                return res.status(400).json({status : 400, msg : 'La fecha de audiencia no puede ser menor a la fecha actual'});
            }
            const query = await connection.query(`UPDATE adm_vencimiento_terminos SET
                                                    fecha_vence_terminos = ?,
                                                    descripcion_vence_terminos = ?
                                                    WHERE username = ?
                                                    AND id_vencimiento = ?`,[fecha_vence_terminos,descripcion_vence_terminos,username,id_vencimiento]);
            if(query.affectedRows > 0){
                let data = {
                    fecha_vence_terminos,
                    terminos: descripcion_vence_terminos,
                    username,
                    id_vencimiento};
                let evento = await setDetalleEvento('Update',data);
                connection.end();
                return res.status(200).json({status : 200, msg : `Audiencia ${msgUpdateOk}`, msgEvento : evento});
            }
            connection.end();
            return res.status(400).json({status : 400, msg : `${msgUpdateErr} audiencia. ${msgTry}`, msgQuery : query.message});
        }
        return res.status(400).json({status : 400, msg : valida.msg});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const deleteAudiencias = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { username, id_vencimiento } = req.body;

        let data = {
            fecha_vence_terminos : '',
            terminos : '',
            username,
            id_vencimiento
        }
        let evento = await setDetalleEvento('Delete',data);
        const result = await connection.query(`DELETE FROM adm_vencimiento_terminos
                                                WHERE username = ?
                                                AND id_vencimiento = ?`,[username, id_vencimiento]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status : 200, msg : `Audiencia ${msgDeleteOk}`, msgEvento : evento});
        }
        connection.end();
        return res.status(400).json({status : 400, msg : `${msgDeleteErr} audiencia. ${msgTry}`});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const setDetalleEvento = async (type = '', data = {}) =>{
    try{
        const connection = await getConnection();
        const { fecha_vence_terminos, terminos, username, id_vencimiento } = data;
        const result = await getAudienciasIdQuery(username,id_vencimiento);
        if(result.length == 0){
            connection.end();
            return false;
        }
        const {nameCiudad, nameDespacho, idplanilla, radicacion, demandante, demandado, idevents} = result[0];

        let start = new Date(`${fecha_vence_terminos} 00:00:00`);
        let end = new Date(`${fecha_vence_terminos} 00:00:00`);
        end.setDate(start.getDate() + 1); // Se le suma un día a la fecha
        start = global_c.getFechaConvert(start).fecha_full;
        end = global_c.getFechaConvert(end).fecha_full;

        let title = `Despacho: ${nameDespacho}, Ciudad : ${nameCiudad}, Radicado: ${radicacion}, Demandante: ${demandante}, Demandado: ${demandado}, Detalle: ${terminos.substr(0,255)}`;
        title = title.substr(0,300);
        let sql = "";
        let dataQuery = [];
        switch(type){
            case 'Insert': // Insert
                var { color } = data;
                dataQuery = [title, color, start, end, username, idplanilla];
                sql = "INSERT INTO adm_events(title, color, start, end, username, idplanilla) VALUES(?,?,?,?,?,?)";
                break;
            case 'Update' : // Update
                dataQuery = [title, start, end, idplanilla, username];
                sql = "UPDATE adm_events SET title = ?, start = ?, end = ? WHERE idplanilla = ? AND username = ?";
                break;
            case 'Delete' : // Delete
                dataQuery = [idevents, username];
                sql = "DELETE FROM adm_events WHERE id = ? AND username = ?";
            default: 
                break;
        }
        const query = await connection.query(sql,dataQuery);
        if(query.affectedRows > 0){
            connection.end();
            if(type === 'Insert'){
                return query.insertId;
            }
            return true;
        }
        connection.end();
        return false;
    }catch(error){
        return false;
    }
}

const exportExcel = async (req,res) =>{
    try{
        const { username, fi, ff, name_user, name_file  } = req.body;
        const connection = await getConnection();
        const rows = await connection.query(`${base_query_all}`,[username,fi,ff]);
        if(rows.length > 0){
            const title_report = "Reporte Vencimientos de Terminos";
            const heads = [
                {name: "Ciudad", campo : 'nameCiudad', width : 15}, // Este tamaño debe ser fijo para poder respetar la imagen
                {name: "Despacho", campo : 'nameDespacho', width : 30},
                {name: "Radicacion", campo : 'radicacion', width : 30},
                {name: "Proceso", campo : 'proceso', width : 30},
                {name: "Demandante", campo : 'demandante', width : 40},
                {name: "Demandado", campo : 'demandado', width : 40},
                {name: "Fecha Vencimiento Terminos", campo : 'fecha_vence_terminos', width : 30, type : 'Date'},
                {name: "Descripcion Vencimiento de Terminos", campo : 'descripcion_vence_terminos', width : 50}
            ];
            let {status, url, msg} = await global_c.generateExcel(username, name_user, title_report, name_file, heads, rows);
            if(status == 200){
                return res.status(status).json({status, url, msg});
            }
            return res.status(status).json({status, msg});
        }else{
            return res.status(400).json({ status : 400, data : [], msg : msgSinInfo});
        }
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message, url : '' });
    }
}

try{
    module.exports = {
        getAudiencias,
        getVencimientos,
        getAudienciasId,
        updateAudiencias,
        deleteAudiencias,
        insertAudiencias,
        exportExcel
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}