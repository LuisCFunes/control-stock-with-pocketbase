/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("Productos") || dao.findCollectionByNameOrId("1dqe49bdra9zror");

  if (collection) {
    collection.schema.addField(new SchemaField({
      "system": false,
      "id": "fld_prod_pcompra",
      "name": "Precio_Compra",
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

    collection.schema.addField(new SchemaField({
      "system": false,
      "id": "fld_prod_pventa",
      "name": "Precio_Venta",
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
  }
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("Productos") || dao.findCollectionByNameOrId("1dqe49bdra9zror");

  if (collection) {
    collection.schema.removeField("fld_prod_pcompra");
    collection.schema.removeField("fld_prod_pventa");
    return dao.saveCollection(collection);
  }
});
