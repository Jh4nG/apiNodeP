import { getConnection } from "./../database/database";

const getLanguages = async (req,res)=>{
    try{
        const connection = await getConnection();
        const result = await connection.query("Select id, nombre, number FROM prueba");
        const resp = {
            status : 200,
            data : result
        }
        res.json(resp);
    }catch(error){
        res.json({status:500,msg:error.message});
    }
}

const getLanguage = async (req,res)=>{
    try{
        const { id } = req.params;
        const connection = await getConnection();
        const result = await connection.query("SELECT id, nombre, number FROM prueba WHERE id = ?", id);
        const resp = {
            status : 200,
            data : result
        }
        res.json(resp);
    }catch(error){
        res.json({status:500,msg:error.message});
    }
}

const addLanguage = async (req,res)=>{
    try{
        const { nombre, number } = req.body;
        if(nombre === undefined || number === undefined){
            res.status(400).json({status: 400, msg : 'Faltan campos obligatorios'});
            return;
        }
        const data = {nombre,number};
        const connection = await getConnection();
        const result = await connection.query("INSERT INTO prueba SET ?",data);
        const resp = {
            status : 200,
            msg : 'Lenguaje ingresado corretamente'
        }
        res.status(200).json(resp);
    }catch(error){
        res.status(500).json({status : 500,msg:error.message});
    }
}

const updateLanguage = async (req,res)=>{
    try{
        const { id } = req.params;
        const { nombre, number } = req.body;
        if(id === undefined || nombre === undefined || number === undefined){
            res.status(400).json({status: 400, msg : 'Faltan campos obligatorios'});
            return;
        }
        const data = {id,nombre,number};
        const connection = await getConnection();
        const result = await connection.query("UPDATE prueba SET ? WHERE id = ?", [data, id]);
        const resp = {
            status : 200,
            data : result
        }
        res.json(resp);
    }catch(error){
        res.json({status:500,msg:error.message});
    }
}

const deleteLanguage = async (req,res)=>{
    try{
        const { id } = req.params;
        const connection = await getConnection();
        const result = await connection.query("DELETE FROM prueba WHERE id = ?", id);
        const resp = {
            status : 200,
            data : result
        }
        res.json(resp);
    }catch(error){
        res.json({status:500,msg:error.message});
    }
}

export const methods = {
    getLanguages,
    addLanguage,
    getLanguage,
    deleteLanguage,
    updateLanguage
}