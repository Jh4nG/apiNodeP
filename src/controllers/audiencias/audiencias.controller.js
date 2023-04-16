const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry } = global_c;

const base_query = `SELECT 
                    vt.id_vencimiento,vt.username,vt.ciudad,vt.despacho,vt.radicacion,DATE_FORMAT(vt.fecha_registro, '%Y-%m-%d') as fecha_registro,vt.usuario,vt.proceso,vt.demandante,vt.demandado,DATE_FORMAT(vt.fecha_vence_terminos, '%Y-%m-%d') as fecha_vence_terminos,vt.descripcion_vence_terminos,vt.idplanilla,vt.idevents,
                    am.municipio as nameCiudad,
                    ad.despacho as nameDespacho
                    FROM adm_vencimiento_terminos vt
                    INNER JOIN adm_municipio am ON vt.ciudad = am.IdMun
                    INNER JOIN adm_despacho ad ON vt.despacho = ad.IdDes`;

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
            return res.json({ status : 200, data : result[0]});
        }
        return res.json({ status : 200, data : [], msg : "Sin información"});
    }catch(error){
        res.json({ status : 500, msg : error.message});
    }
}

const getAudiencias = async (req, res) => {
    try{
        const connection = await getConnection();
        const { username,fi,ff } = req.body;

        const result = await connection.query(`${base_query}
                                                WHERE username = ? 
                                                AND DATE(fecha_vence_terminos) BETWEEN ? AND ? 
                                                ORDER BY vt.despacho, vt.radicacion, vt.fecha_vence_terminos DESC`,[username,fi,ff]);
        if(result.length > 0){
            return res.json({ status : 200, data : result[0]});
        }
        return res.status(200).json({ status : 200, data : [], msg : "Sin información"});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const getAudienciasIdQuery = async (username = '',id = 0) =>{
    try{
        const connection = await getConnection();
        return await connection.query(`${base_query}
                                WHERE username = ? 
                                AND vt.id_vencimiento = ?`,[username,id]);
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
        return res.status(200).json({ status : 200, data : [], msg : "Sin información"});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const updateAudiencias = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { username,fecha_vence_terminos,descripcion_vence_terminos,id_vencimiento } = req.body;
        let dataValida = {
            'Usuario' : username,
            'Fecha Audiencia / Vencimiento' : fecha_vence_terminos,
            'Detalle Audiencia Vencimiento' : descripcion_vence_terminos,
            'Id vencimiento' : id_vencimiento
        };
        let valida = global_c.validateParams(dataValida);
        if(valida.status){ // Se actualiza
            if(fecha_vence_terminos < fecha_actual){
                return res.status(400).json({status : 400, msg : 'La fecha de audiencia no puede ser menor a la fecha actual'});
            }
            const query = await connection.query(`UPDATE adm_vencimiento_terminos SET
                                                    fecha_vence_terminos = ?,
                                                    descripcion_vence_terminos = ?
                                                    WHERE username = ?
                                                    AND id_vencimiento = ?`,[fecha_vence_terminos,descripcion_vence_terminos,username,id_vencimiento]);
            if(query.affectedRows > 0){
                let data = {
                    terminos: descripcion_vence_terminos,
                    username,
                    id_vencimiento};
                let evento = await setDetalleEvento(2,data);
                return res.status(200).json({status : 200, msg : `Audiencia ${msgUpdateOk}`, msgEvento : evento});
            }
            return res.status(400).json({status : 400, msg : `${msgUpdateErr} audiencia. ${msgTry}`, msgQuery : query.message});
        }
        return res.status(400).json({status : 400, msg : valida.msg});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const setDetalleEvento = async (type = 0, data = {}) =>{
    try{
        const connection = await getConnection();
        const { fecha_vence_terminos, terminos, username, id_vencimiento } = data;
        const result = await getAudienciasIdQuery(username,id_vencimiento);
        if(result.length == 0){
            console.log(`Error en obtener data de getAudienciasIdQuery, parametros : ${data.toString()}`);
            return false;
        }
        const {nameCiudad, nameDespacho, idplanilla, radicacion, demandante, demandado} = result[0];

        let start = new Date(`${fecha_vence_terminos} 00:00:00`);
        let end = new Date(`${fecha_vence_terminos} 00:00:00`);
        end.setDate(d.getDate() + 1); // se le suma un día a la fecha
        start = global_c.getFechaConvert(start);
        end = global_c.getFechaConvert(end);

        let title = `Despacho: ${nameDespacho}, Ciudad : ${nameCiudad}, Radicado: ${radicacion}, Demandante: ${demandante}, Demandado: ${demandado}, Detalle: ${terminos.substr(0,255)}`;
        title = string.substr(0,300);
        let sql = "";
        let dataQuery = [];
        switch(type){
            case 1: // Insert
                var { color } = data;
                sql = "INSERT INTO adm_events";
                break;
            case 2 : // Update
                dataQuery = [title, start, end, idplanilla, username];
                sql = "UPDATE adm_events SET title = ?, start = ?, end = ? WHERE idplanilla = ? AND username = ?";
                break;
            case 3 : // Delete
                dataQuery = [idplanilla, username];
                sql = "DELETE FROM adm_events WHERE idplanilla = ? AND username = ?";
            default: 
                break;
        }
        const query = await connection.query(sql,dataQuery);
        if(query.affectedRows > 0){
            return true;
        }else{
            console.log(`Error ejecución de query en tabla adm_events para parametros ${dataQuery.toString()} desde los parámetros ${data.toString()}`);
            return false;
        }
    }catch(error){
        console.log(`Error ejecución ERROR: ${error.message}`);
        return false;
    }
}

try{
    module.exports = {
        getAudiencias,
        getVencimientos,
        getAudienciasId,
        updateAudiencias
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}