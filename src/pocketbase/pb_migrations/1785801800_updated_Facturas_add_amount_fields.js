/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("Facturas");

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "fld_disc",
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
    "id": "fld_exon",
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
    "id": "fld_exem",
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
  const collection = dao.findCollectionByNameOrId("Facturas");

  // remove
  collection.schema.removeField("discount_amount");
  collection.schema.removeField("exonerado_amount");
  collection.schema.removeField("exento_amount");

  return dao.saveCollection(collection);
})
