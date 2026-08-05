/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("Facturas");

  // add unique index
  collection.indexes.push(
    "CREATE UNIQUE INDEX `idx_Numero_unique` ON `Facturas` (`Numero`)"
  );

  return dao.saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("Facturas");

  // remove unique index
  collection.indexes = collection.indexes.filter(
    (index) => !index.includes("idx_Numero_unique")
  );

  return dao.saveCollection(collection);
})
