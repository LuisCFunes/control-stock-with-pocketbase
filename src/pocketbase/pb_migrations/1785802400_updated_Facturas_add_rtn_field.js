/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("Facturas") || dao.findCollectionByNameOrId("05n8wvxpfbj7eqg");

  if (collection) {
    const existingField = collection.schema.getFieldByName("RTN");
    if (!existingField) {
      collection.schema.addField(new SchemaField({
        "system": false,
        "id": "fac_fld_rtn",
        "name": "RTN",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 50,
          "pattern": ""
        }
      }));
      return dao.saveCollection(collection);
    }
  }
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("Facturas") || dao.findCollectionByNameOrId("05n8wvxpfbj7eqg");

  if (collection) {
    collection.schema.removeField("fac_fld_rtn");
    return dao.saveCollection(collection);
  }
});
