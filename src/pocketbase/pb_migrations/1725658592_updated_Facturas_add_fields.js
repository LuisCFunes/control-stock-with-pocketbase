/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("05n8wvxpfbj7eqg");

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "payment_method",
    "name": "payment_method",
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
    "id": "discount_amount",
    "name": "discount_amount",
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
    "id": "exonerado_amount",
    "name": "exonerado_amount",
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
    "id": "exento_amount",
    "name": "exento_amount",
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
  const collection = dao.findCollectionByNameOrId("05n8wvxpfbj7eqg");

  // remove
  collection.schema.removeField("payment_method");

  // remove
  collection.schema.removeField("discount_amount");

  // remove
  collection.schema.removeField("exonerado_amount");

  // remove
  collection.schema.removeField("exento_amount");

  return dao.saveCollection(collection);
})