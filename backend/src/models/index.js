// models/index.js
const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");
const { sequelize } = require("../config/db");

const db = {};

// Log the directory where models are read from.
console.log(`Reading models from directory: ${__dirname}`);

fs.readdirSync(__dirname)
  .filter(file =>
    file.indexOf(".") !== 0 &&
    file !== "index.js" &&
    file.slice(-3) === ".js"
  )
  .forEach(file => {
    console.log(`Loading model: ${file}`);
    const modelDef = require(path.join(__dirname, file));

    let model;

    // Check if the exported module is a class.
    if (/^class\s/.test(modelDef.toString())) {
      // If it is a class, use it directly.
      model = modelDef;
      console.log(`Model ${model.name} loaded as a class.`);
    } else {
      // Otherwise, assume it's a factory function.
      model = modelDef(sequelize, Sequelize.DataTypes);
      console.log(`Model ${model.name} initialized via factory function.`);
    }
    db[model.name] = model;
  });

// Set up associations if any.
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.Sequelize = Sequelize;

console.log("Sequelize initialized successfully!");

module.exports = db;