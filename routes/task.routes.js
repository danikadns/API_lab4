// routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const AWS = require("aws-sdk");

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || "Task";

// Respuesta de éxito
const successResponse = (message, data = null, statusCode = 200) => {
  return {
    success: true,
    statusCode,
    message,
    data,
  };
};

// Respuesta de error
const errorResponse = (message = "Ocurrió un error", statusCode = 500, errorData = null) => {
  return {
    success: false,
    statusCode,
    message,
    errorData,
  };
};

// Obtener todos los elementos
router.get("/", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
    };

    let items = [];
    let data;

    do {
      data = await dynamoDb.scan(params).promise();
      items = items.concat(data.Items);
      params.ExclusiveStartKey = data.LastEvaluatedKey;
    } while (data.LastEvaluatedKey);

    res.status(200).json(successResponse("Tareas obtenidas exitosamente", items));
  } catch (error) {
    res.status(500).json(errorResponse("Error al obtener tareas", 500, error.message));
  }
});

// Obtener un elemento
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const params = {
      TableName: TABLE_NAME,
      Key: {
        task_id: id,
      },
    };

    const data = await dynamoDb.get(params).promise();
    
    if (!data.Item) {
      return res.status(404).json(errorResponse("Tarea no encontrada", 404));
    }

    res.status(200).json(successResponse("Tarea obtenida exitosamente", data.Item));
  } catch (error) {
    res.status(500).json(errorResponse("Error al obtener la tarea", 500, error.message));
  }
});

module.exports = router;
