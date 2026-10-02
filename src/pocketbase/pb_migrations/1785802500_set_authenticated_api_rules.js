/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const authRule = "@request.auth.id != ''";
  const collections = ["Productos", "Facturas", "Clientes"];

  for (const name of collections) {
    const collection = dao.findCollectionByNameOrId(name);
    if (collection) {
      collection.listRule = authRule;
      collection.viewRule = authRule;
      collection.createRule = authRule;
      collection.updateRule = authRule;
      collection.deleteRule = authRule;
      dao.saveCollection(collection);
    }
  }

  const users = dao.findCollectionByNameOrId("users");
  if (users) {
    users.createRule = null;
    dao.saveCollection(users);
  }
}, (db) => {
  const dao = new Dao(db);
  const collections = ["Productos", "Facturas"];
  for (const name of collections) {
    const collection = dao.findCollectionByNameOrId(name);
    if (collection) {
      collection.listRule = null;
      collection.viewRule = null;
      collection.createRule = null;
      collection.updateRule = null;
      collection.deleteRule = null;
      dao.saveCollection(collection);
    }
  }
});
