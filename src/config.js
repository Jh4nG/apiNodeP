import { config } from "dotenv";

config();

export default {
    host : process.env.host,
    database : process.env.database,
    user : process.env.user,
    password : process.env.password
}