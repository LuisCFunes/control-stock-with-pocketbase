/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "avebz59p68hmbng",
    "created": "2026-09-17 00:00:00.000Z",
    "updated": "2026-09-17 00:00:00.000Z",
    "name": "Clientes",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "cli_fld_nombre",
        "name": "Nombre",
        "type": "text",
        "required": true,
        "presentable": true,
        "unique": false,
        "options": {
          "min": 1,
          "max": 255,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "cli_fld_rtn",
        "name": "RTN",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 30,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "cli_fld_tel",
        "name": "Telefono",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 30,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "cli_fld_dir",
        "name": "Direccion",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 500,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "cli_fld_email",
        "name": "Email",
        "type": "email",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "exceptDomains": null,
          "onlyDomains": null
        }
      }
    ],
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": "",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("Clientes") || dao.findCollectionByNameOrId("avebz59p68hmbng");

  if (collection) {
    return dao.deleteCollection(collection);
  }
});
