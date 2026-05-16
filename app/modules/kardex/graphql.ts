import { gql } from "@apollo/client";

export const KARDEX_LIST_QUERY = gql`
  query GetKardexList($productId: Int, $warehouseId: Int) {
    kardexList(productId: $productId, warehouseId: $warehouseId) {
      id
      operation
      typeDocument
      typeOperation
      quantity
      priceUnit
      priceTotal
      remainingQuantity
      remainingPrice
      remainingPriceTotal
      createAt
      productName
      warehouseName
      documentSerialCorrelative
    }
  }
`;
