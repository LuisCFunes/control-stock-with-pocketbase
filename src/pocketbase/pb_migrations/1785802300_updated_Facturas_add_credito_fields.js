/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("Facturas") || dao.findCollectionByNameOrId("05n8wvxpfbj7eqg");

  if (collection) {
    collection.schema.addField(new SchemaField({
      "system": false,
      "id": "fac_fld_estpago",
      "name": "estado_pago",
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

    collection.schema.addField(new SchemaField({
      "system": false,
      "id": "fac_fld_saldopend",
      "name": "saldo_pendiente",
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
      "id": "fac_fld_diascred",
      "name": "dias_credito",
      "type": "number",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": null,
        "max": null,
        "noDecimal": true
      }
    }));

    collection.schema.addField(new SchemaField({
      "system": false,
      "id": "fac_fld_fechavenc",
      "name": "fecha_vencimiento",
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

    collection.schema.addField(new SchemaField({
      "system": false,
      "id": "fac_fld_abonos",
      "name": "abonos",
      "type": "json",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "maxSize": 2000000
      }
    }));

    return dao.saveCollection(collection);
  }
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("Facturas") || dao.findCollectionByNameOrId("05n8wvxpfbj7eqg");

  if (collection) {
    collection.schema.removeField("fac_fld_estpago");
    collection.schema.removeField("fac_fld_saldopend");
    collection.schema.removeField("fac_fld_diascred");
    collection.schema.removeField("fac_fld_fechavenc");
    collection.schema.removeField("fac_fld_abonos");
    return dao.saveCollection(collection);
  }
});
