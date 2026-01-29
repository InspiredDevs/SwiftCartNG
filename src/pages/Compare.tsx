import { Link } from 'react-router-dom';
import { useCompare } from '@/contexts/CompareContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ShoppingCart, Star, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Compare = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();

  const formatPrice = (price: number) => `₦${price.toLocaleString()}`;

  if (compareItems.length === 0) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <h1 className="text-3xl font-bold mb-4">Product Comparison</h1>
            <p className="text-muted-foreground mb-8">
              No products to compare yet. Add products from the shop to compare them side by side.
            </p>
            <Link to="/shop">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse Products
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const attributes = [
    { label: 'Price', key: 'price', render: (p: any) => formatPrice(p.price) },
    { label: 'Category', key: 'category', render: (p: any) => p.category },
    { label: 'Rating', key: 'rating', render: (p: any) => (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-primary text-primary" />
        <span>{(p.rating || 0).toFixed(1)}</span>
      </div>
    )},
    { label: 'Availability', key: 'in_stock', render: (p: any) => (
      <span className={p.in_stock ? 'text-green-600' : 'text-destructive'}>
        {p.in_stock ? 'In Stock' : 'Out of Stock'}
      </span>
    )},
    { label: 'Stock Qty', key: 'stock_quantity', render: (p: any) => p.stock_quantity || 0 },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold">Compare Products</h1>
            <p className="text-muted-foreground">
              Comparing {compareItems.length} of 4 products
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/shop">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Add More
              </Button>
            </Link>
            <Button variant="destructive" onClick={clearCompare}>
              Clear All
            </Button>
          </div>
        </motion.div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 bg-secondary font-semibold min-w-[150px]">
                  Feature
                </th>
                <AnimatePresence>
                  {compareItems.map((product, index) => (
                    <motion.th
                      key={product.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-secondary min-w-[220px]"
                    >
                      <Card className="p-4 relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => removeFromCompare(product.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Link to={`/product/${product.id}`}>
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                          <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                      </Card>
                    </motion.th>
                  ))}
                </AnimatePresence>
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr, rowIndex) => (
                <motion.tr
                  key={attr.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + rowIndex * 0.05 }}
                  className="border-b"
                >
                  <td className="p-4 font-medium bg-muted/30">{attr.label}</td>
                  {compareItems.map(product => (
                    <td key={product.id} className="p-4 text-center">
                      {attr.render(product)}
                    </td>
                  ))}
                </motion.tr>
              ))}
              <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <td className="p-4 font-medium bg-muted/30">Description</td>
                {compareItems.map(product => (
                  <td key={product.id} className="p-4 text-sm text-muted-foreground">
                    <p className="line-clamp-3">{product.description || 'No description'}</p>
                  </td>
                ))}
              </motion.tr>
              <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <td className="p-4 font-medium bg-muted/30">Action</td>
                {compareItems.map(product => (
                  <td key={product.id} className="p-4">
                    <Button
                      className="w-full"
                      onClick={() => addToCart(product)}
                      disabled={!product.in_stock}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </td>
                ))}
              </motion.tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Compare;
