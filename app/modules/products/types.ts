export interface Tariff {
  unitId: number | string;
  typePrice: number;
  priceWithIgv: number;
  priceWithoutIgv: number;
  quantityMinimum: number;
}

export interface ProductBrand {
  id: string;
  name: string;
  isEnabled: boolean;
}

export interface Product {
  id: string;
  code: string | null;
  name: string;
  subsidiaryId?: number | null;
  stockMin: number;
  stockMax: number;
  available: boolean;
  activeType: string;
  typeAffectation: string;
  observation: string | null;
  length: number;
  height: number;
  width: number;
  imageUrl: string | null;
  productCategoryId?: number | null;
  productClassId?: number | null;
  productBrandId?: number | null;
  productBrand?: ProductBrand | null;
  tariffs: Tariff[];
  productStores?: { stock: number }[];
}

export interface ProductCategory {
  id: string;
  name: string;
  isEnabled: boolean;
}

export interface ProductClass {
  id: string;
  name: string;
  isEnabled: boolean;
}

export interface Unit {
  id: string;
  shortName: string;
  description: string;
}

export interface Warehouse {
  id: string;
  name: string;
  category: string;
  subsidiaryId: number | null;
}

export interface Subsidiary {
  id: string;
  name: string;
}

export interface ProductStoreEntry {
  id: string;
  productId: number;
  warehouseId: number;
  warehouse_id?: number;
  stock: number;
}

export interface CreateProductData {
  createProduct?: {
    success: boolean;
    message: string;
    id?: number;
  };
  create_product?: {
    success: boolean;
    message: string;
    id?: number;
  };
}

export interface UpdateProductData {
  updateProduct?: {
    success: boolean;
    message: string;
  };
  update_product?: {
    success: boolean;
    message: string;
  };
}

export interface CreateWarehouseData {
  createWarehouse: {
    success: boolean;
    message: string;
    id?: number;
  };
}

export interface UpdateWarehouseData {
  updateWarehouse: {
    success: boolean;
    message: string;
  };
}

export interface SetStockData {
  setStock?: {
    success: boolean;
    message: string;
  };
  set_stock?: {
    success: boolean;
    message: string;
  };
}

export interface ProductsData {
  products: Product[];
}

export interface UnitsData {
  units: Unit[];
}

export interface WarehousesData {
  warehouses: Warehouse[];
}

export interface SubsidiariesData {
  subsidiaries: Subsidiary[];
}

export interface ProductStoresData {
  productStores?: ProductStoreEntry[];
  product_stores?: ProductStoreEntry[];
}

export interface ProductCategoriesData {
  productCategories: ProductCategory[];
}

export interface ProductClassesData {
  productClasses: ProductClass[];
}

export interface ProductBrandsData {
  productBrands: ProductBrand[];
}

export interface CreateCategoryData {
  createProductCategory: {
    success: boolean;
    message: string;
    id?: number;
  };
}

export interface UpdateCategoryData {
  updateProductCategory: {
    success: boolean;
    message: string;
  };
}

export interface CreateClassData {
  createProductClass: {
    success: boolean;
    message: string;
    id?: number;
  };
}

export interface UpdateClassData {
  updateProductClass: {
    success: boolean;
    message: string;
  };
}
