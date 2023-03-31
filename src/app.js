import express  from "express";
import morgan from "morgan";

// Routes
import lenguageRoutes from "./routes/language.routes";
import loginRoutes from "./routes/login.routes";


const app = express();

// Settings
app.set("port",4000);

// Middlewares
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api/language", lenguageRoutes);
app.use("/api/login", loginRoutes);

export default app;