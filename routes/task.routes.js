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

const { v4: uuidv4 } = require("uuid");
router.post("/create", async (req, res) => {
  try {
    const { title, description, status } = req.body;

    if (!title || !status) {
      return res.status(400).json(errorResponse("Los campos son obligatorios: title, Status", 400));
    }

    const task_id = /* parseInt( */uuidv4()/* .replace(/-/g, '').substring(0, 12), 16); */

    //const task_id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    
    const created_at = new Date().toISOString();

    const params = {
      TableName: TABLE_NAME,
      Item: {
        task_id,
        title,
        description,
        status,
        created_at,
      },
    };

    await dynamoDb.put(params).promise();

    res.status(201).json(successResponse("Tarea creada", params.Item, 201));
  } catch (error) {
    res.status(500).json(errorResponse("Error al crear la tarea", 500, error.message));
  }
});

// Actualizar el estado de una tarea
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validación de que el campo `status` esté presente
    if (!status) {
      return res.status(400).json(errorResponse("El campo 'status' es requerido", 400));
    }

    const params = {
      TableName: TABLE_NAME,
      Key: {
        task_id: id,
      },
      UpdateExpression: "set #s = :status",
      ExpressionAttributeNames: {
        "#s": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
      },
      ReturnValues: "UPDATED_NEW",
    };

    const result = await dynamoDb.update(params).promise();

    res.status(200).json(successResponse("Estado de la tarea actualizado exitosamente", result.Attributes));
  } catch (error) {
    res.status(500).json(errorResponse("Error al actualizar el estado de la tarea", 500, error.message));
  }
});

module.exports = router;
