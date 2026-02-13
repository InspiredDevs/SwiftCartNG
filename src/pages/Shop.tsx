import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { ProductGridSkeleton } from "@/components/skeletons/ProductCardSkeleton";
import PageTransition from "@/components/PageTransition";
import { motion } from "framer-motion";

const Shop = () => {
  const { products, loading } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "All"
  );
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const maxPrice = 100000;
  
  // Get unique categories from products
  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesCategory && matchesPrice;
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category !== "All") {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  return (
    <PageTransition>
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Shop All Products</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Filters</h2>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Category</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleCategoryChange(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="font-medium mb-3">Price Range</h3>
                
                {/* Quick Budget Presets */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { label: "Under ₦5K", range: [0, 5000] },
                    { label: "₦5K - ₦20K", range: [5000, 20000] },
                    { label: "₦20K - ₦50K", range: [20000, 50000] },
                    { label: "Above ₦50K", range: [50000, maxPrice] },
                  ].map((preset) => {
                    const isActive = priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1];
                    return (
                      <button
                        key={preset.label}
                        onClick={() => setPriceRange(preset.range as [number, number])}
                        className={`
                          px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                          border-2 text-center
                          ${isActive 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'bg-card border-border hover:border-primary/50 hover:bg-muted'
                          }
                        `}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Range Inputs */}
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Or set custom range:</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Min</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                        <input
                          type="number"
                          value={priceRange[0]}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(Number(e.target.value), priceRange[1]));
                            setPriceRange([val, priceRange[1]]);
                          }}
                          className="w-full pl-6 pr-2 py-2 rounded-md border border-input bg-background text-sm"
                          min={0}
                          max={priceRange[1]}
                        />
                      </div>
                    </div>
                    <span className="text-muted-foreground mt-5">—</span>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Max</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                        <input
                          type="number"
                          value={priceRange[1]}
                          onChange={(e) => {
                            const val = Math.min(maxPrice, Math.max(Number(e.target.value), priceRange[0]));
                            setPriceRange([priceRange[0], val]);
                          }}
                          className="w-full pl-6 pr-2 py-2 rounded-md border border-input bg-background text-sm"
                          min={priceRange[0]}
                          max={maxPrice}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                {(priceRange[0] !== 0 || priceRange[1] !== maxPrice) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-muted-foreground"
                    onClick={() => setPriceRange([0, maxPrice])}
                  >
                    Reset price filter
                  </Button>
                )}
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <p className="text-muted-foreground">
                Showing {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
              </p>
            </div>

            {loading ? (
              <ProductGridSkeleton count={6} />
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground">
                  No products found matching your filters
                </p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setSelectedCategory("All");
                    setPriceRange([0, maxPrice]);
                    setSearchParams({});
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default Shop;
