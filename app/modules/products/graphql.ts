import { gql } from "@apollo/client";

export const PRODUCTS_QUERY = gql`
  query GetProducts {
    products {
      id
      code
      barcode
      name
      stockMin
      stockMax
      available
      activeType
      ean
      weightInKilograms
      typeAffectation
      observation
      measurements
      length
      height
      width
      imageUrl
      subsidiaryId
      productCategoryId
      productClassId
      tariffs {
        id
        name
        unitId
        typePrice
        priceWithIgv
        priceWithoutIgv
        quantityMinimum
      }
      productStores {
        stock
      }
    }
  }
`;

export const WAREHOUSES_QUERY = gql`
  query GetWarehouses {
    warehouses {
      id
      name
      category
      subsidiaryId
    }
  }
`;

export const PRODUCT_STORES_QUERY = gql`
  query GetProductStores($productId: Int) {
    productStores(productId: $productId) {
      id
      productId
      warehouseId
      stock
    }
  }
`;

export const UNITS_QUERY = gql`
  query GetUnits {
    units {
      id
      shortName
      description
    }
  }
`;

export const SUBSIDIARIES_QUERY = gql`
  query GetSubsidiaries {
    subsidiaries {
      id
      name
    }
  }
`;

export const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct($name: String!, $tariffs: [TariffInput!], $subsidiaryId: Int, $measurements: String, $length: Float, $height: Float, $width: Float, $weight: Float, $available: Boolean, $observation: String, $code: String, $barcode: String, $stockMin: Int, $stockMax: Int, $activeType: String, $ean: String, $typeAffectation: String, $productCategoryId: Int, $productClassId: Int, $imageBase64: String) {
    createProduct(name: $name, tariffs: $tariffs, subsidiaryId: $subsidiaryId, measurements: $measurements, length: $length, height: $height, width: $width, weight: $weight, available: $available, observation: $observation, code: $code, barcode: $barcode, stockMin: $stockMin, stockMax: $stockMax, activeType: $activeType, ean: $ean, typeAffectation: $typeAffectation, productCategoryId: $productCategoryId, productClassId: $productClassId, imageBase64: $imageBase64) {
      success
      message
      id
    }
  }
`;

export const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct($id: Int!, $name: String, $tariffs: [TariffInput!], $subsidiaryId: Int, $measurements: String, $length: Float, $height: Float, $width: Float, $weight: Float, $available: Boolean, $observation: String, $code: String, $barcode: String, $stockMin: Int, $stockMax: Int, $activeType: String, $ean: String, $typeAffectation: String, $productCategoryId: Int, $productClassId: Int, $imageBase64: String) {
    updateProduct(id: $id, name: $name, tariffs: $tariffs, subsidiaryId: $subsidiaryId, measurements: $measurements, length: $length, height: $height, width: $width, weight: $weight, available: $available, observation: $observation, code: $code, barcode: $barcode, stockMin: $stockMin, stockMax: $stockMax, activeType: $activeType, ean: $ean, typeAffectation: $typeAffectation, productCategoryId: $productCategoryId, productClassId: $productClassId, imageBase64: $imageBase64) {
      success
      message
    }
  }
`;

export const CREATE_WAREHOUSE_MUTATION = gql`
  mutation CreateWarehouse($name: String!, $category: String, $subsidiaryId: Int) {
    createWarehouse(name: $name, category: $category, subsidiaryId: $subsidiaryId) {
      success
      message
      id
    }
  }
`;

export const UPDATE_WAREHOUSE_MUTATION = gql`
  mutation UpdateWarehouse($id: Int!, $name: String, $category: String, $subsidiaryId: Int) {
    updateWarehouse(id: $id, name: $name, category: $category, subsidiaryId: $subsidiaryId) {
      success
      message
    }
  }
`;

export const SET_STOCK_MUTATION = gql`
  mutation SetStock($productId: Int!, $warehouseId: Int!, $stock: Float!) {
    setStock(productId: $productId, warehouseId: $warehouseId, stock: $stock) {
      success
      message
    }
  }
`;
export const CREATE_CATEGORY_MUTATION = gql`
  mutation CreateCategory($name: String!, $isEnabled: Boolean) {
    createProductCategory(name: $name, isEnabled: $isEnabled) {
      success
      message
      id
    }
  }
`;

export const UPDATE_CATEGORY_MUTATION = gql`
  mutation UpdateCategory($id: Int!, $name: String, $isEnabled: Boolean) {
    updateProductCategory(id: $id, name: $name, isEnabled: $isEnabled) {
      success
      message
    }
  }
`;

export const CREATE_CLASS_MUTATION = gql`
  mutation CreateClass($name: String!, $isEnabled: Boolean) {
    createProductClass(name: $name, isEnabled: $isEnabled) {
      success
      message
      id
    }
  }
`;

export const UPDATE_CLASS_MUTATION = gql`
  mutation UpdateClass($id: Int!, $name: String, $isEnabled: Boolean) {
    updateProductClass(id: $id, name: $name, isEnabled: $isEnabled) {
      success
      message
    }
  }
`;

export const PRODUCT_CATEGORIES_QUERY = gql`
  query GetProductCategories {
    productCategories {
      id
      name
      isEnabled
    }
  }
`;

export const PRODUCT_CLASSES_QUERY = gql`
  query GetProductClasses {
    productClasses {
      id
      name
      isEnabled
    }
  }
`;
