/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("05n8wvxpfbj7eqg");

  // remove
  collection.schema.removeField("payment_method");

  return dao.saveCollection(collection);
}, (db) => {
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

  return dao.saveCollection(collection);
})