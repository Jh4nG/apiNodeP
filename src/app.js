const express = require ("express");
const morgan = require ("morgan");

// import express from "express";
// import morgan from "morgan";

// Routes
const lenguageRoutes = require("./routes/language.routes");
const loginRoutes = require ("./routes/login.routes");

// import lenguageRoutes from "./routes/language.routes";
// import loginRoutes from "./routes/login.routes";

const app = express();

// Settings
app.set("port",4000);
app.use(cors({
    origin : 'http://localhost:4000'
}));

// Middlewares
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api/language", lenguageRoutes);
app.use("/api/login", loginRoutes);

module.exports = app;