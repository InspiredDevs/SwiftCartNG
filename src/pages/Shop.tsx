import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

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
                
                {/* Preset Price Range Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { label: "Under ₦5K", range: [0, 5000] },
                    { label: "₦5K-₦20K", range: [5000, 20000] },
                    { label: "₦20K-₦50K", range: [20000, 50000] },
                    { label: "₦50K+", range: [50000, maxPrice] },
                  ].map((preset) => (
                    <Button
                      key={preset.label}
                      variant={
                        priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1]
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="text-xs"
                      onClick={() => setPriceRange(preset.range as [number, number])}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>

                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={maxPrice}
                  step={5000}
                  className="mb-4"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
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
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground">Loading products...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
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
  );
};

export default Shop;
