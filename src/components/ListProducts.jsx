/* eslint-disable react/prop-types */
export const ListProducts = ({
  list,
  showButtons,
  handleSendProductData,
  scopeName = "Agregar a la venta",
  btnName = "Vender",
}) => {
  if (!list || list.length === 0) {
    return <h1 className="text-center">No hay Productos en la lista</h1>;
  }
  return (
    <>
      <table className="table table-striped table-hover mt-4">
        <thead className="table-dark">
          <tr className="text-center">
            <th scope="col">Nombre</th>
            <th scope="col">Cantidad</th>
            <th scope="col">Precio</th>
            {showButtons && <th scope="col">{scopeName}</th>}
          </tr>
        </thead>
        <tbody>
          {list.map((product) => (
            <tr className="text-center" key={product.id}>
              <td>{product.Nombre}</td>
              <td>{product.Cantidad}</td>
              <td>{product.Precio}</td>
              {showButtons && (
                <td>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSendProductData(product)}
                  >
                    {btnName}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
