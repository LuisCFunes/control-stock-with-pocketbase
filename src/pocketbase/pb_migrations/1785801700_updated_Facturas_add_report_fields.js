/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("Facturas");

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "fld_condi",
    "name": "condicion",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }));

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "fld_forma",
    "name": "formapago",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }));

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "fld_deta",
    "name": "detalle",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }));

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "fld_obser",
    "name": "observacion",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }));

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "fld_sub15",
    "name": "subtotal15",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "noDecimal": false
    }
  }));

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "fld_isv15",
    "name": "isv15",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "noDecimal": false
    }
  }));

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "fld_sub18",
    "name": "subtotal18",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "noDecimal": false
    }
  }));

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "fld_isv18",
    "name": "isv18",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "noDecimal": false
    }
  }));

  return dao.saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("Facturas");

  // remove
  collection.schema.removeField("condicion");
  collection.schema.removeField("formapago");
  collection.schema.removeField("detalle");
  collection.schema.removeField("observacion");
  collection.schema.removeField("subtotal15");
  collection.schema.removeField("isv15");
  collection.schema.removeField("subtotal18");
  collection.schema.removeField("isv18");

  return dao.saveCollection(collection);
})
