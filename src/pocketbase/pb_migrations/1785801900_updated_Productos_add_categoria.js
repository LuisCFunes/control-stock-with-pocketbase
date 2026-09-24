/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("Productos") || dao.findCollectionByNameOrId("1dqe49bdra9zror");

  if (collection) {
    collection.schema.addField(new SchemaField({
      "system": false,
      "id": "fld_prod_cat",
      "name": "Categoria",
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
  }
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("Productos") || dao.findCollectionByNameOrId("1dqe49bdra9zror");

  if (collection) {
    collection.schema.removeField("fld_prod_cat");
    return dao.saveCollection(collection);
  }
});
