// app.js
require("dotenv").config();
const express = require("express");
const AWS = require("aws-sdk");
const morgan = require("morgan");
const taskRoutes = require("./routes/task.routes");

const app = express();
const port = process.env.PORT || 3000;

AWS.config.update({
  region: process.env.AWS_REGION || "us-east-1",
/*   accessKeyId: process.env.AWS_ACCESS_ID,
  secretAccessKey: process.env.AWS_ACCESS_KEY, */
});

app.use(express.json());
app.use(morgan("dev"));

// Rutas de tareas
app.use("/tasks", taskRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Ocurrió un error en el servidor.",
    error: err.message,
  });
});

app.listen(port, () => {
  console.log(`Escuchando en el puerto ${port}`);
});
