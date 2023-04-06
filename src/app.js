const express = require ("express");
const morgan = require ("morgan");

// Routes
const lenguageRoutes = require("./routes/language.routes");
const loginRoutes = require ("./routes/login.routes");

const app = express();

// Settings
app.set("port",4000);
// app.use(cors({
//     origin : 'http://localhost:4000'
// }));

// Middlewares
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api/language", lenguageRoutes);
app.use("/api/login", loginRoutes);

module.exports = app;