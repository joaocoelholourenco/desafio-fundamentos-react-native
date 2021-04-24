import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStorage = await AsyncStorage.getItem('@GoMarketplace');
      if (productsStorage) {
        setProducts(JSON.parse(productsStorage));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const hasThisProduct = products.find(item => item.id === product.id);

      if (!hasThisProduct) {
        const newProduct = { ...product, quantity: 1 };
        setProducts(state => [...state, newProduct]);
      } else {
        const newQuantity = {
          ...hasThisProduct,
          quantity: hasThisProduct.quantity + 1,
        };
        setProducts(state =>
          state.map(item =>
            item.id === hasThisProduct.id ? newQuantity : item,
          ),
        );
      }
      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(products));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const product = products.find(item => item.id === id);
      if (product) {
        const newQuantity = {
          ...product,
          quantity: product.quantity + 1,
        };
        setProducts(state =>
          state.map(item => (item.id === id ? newQuantity : item)),
        );
      }
      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(item => item.id === id);
      if (product && product.quantity > 0) {
        const newQuantity = {
          ...product,
          quantity: product.quantity - 1,
        };
        setProducts(state =>
          state.map(item => (item.id === id ? newQuantity : item)),
        );
      }
      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(products));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
