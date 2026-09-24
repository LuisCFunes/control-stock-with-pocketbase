/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("Clientes") || dao.findCollectionByNameOrId("avebz59p68hmbng");

  if (collection) {
    collection.schema.addField(new SchemaField({
      "system": false,
      "id": "cli_fld_contacto",
      "name": "Contacto",
      "type": "text",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": null,
        "max": 255,
        "pattern": ""
      }
    }));

    return dao.saveCollection(collection);
  }
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("Clientes") || dao.findCollectionByNameOrId("avebz59p68hmbng");

  if (collection) {
    collection.schema.removeField("cli_fld_contacto");
    return dao.saveCollection(collection);
  }
});
