import { Product } from "@/types/product";
import smartwatchImg from "@/assets/smartwatch.jpg";
import speakerImg from "@/assets/speaker.jpg";
import shirtImg from "@/assets/shirt.jpg";
import sneakersImg from "@/assets/sneakers.jpg";
import lunchboxImg from "@/assets/lunchbox.jpg";
import watchImg from "@/assets/watch.jpg";
import earbudsImg from "@/assets/earbuds.jpg";
import handbagImg from "@/assets/handbag.jpg";

export const products: Product[] = [
  {
    id: 1,
    name: "Smart Fitness Watch",
    price: 45000,
    image: smartwatchImg,
    category: "Watches",
    description: "Track your fitness goals with this advanced smartwatch featuring heart rate monitoring, GPS, and 7-day battery life.",
    inStock: true,
    rating: 4.5,
  },
  {
    id: 2,
    name: "Portable Bluetooth Speaker",
    price: 28000,
    image: speakerImg,
    category: "Speakers",
    description: "Enjoy premium sound quality anywhere with this compact, waterproof speaker. 12-hour battery life.",
    inStock: true,
    rating: 4.7,
  },
  {
    id: 3,
    name: "Premium Casual Shirt",
    price: 15000,
    image: shirtImg,
    category: "Clothes",
    description: "Stay stylish with this comfortable cotton shirt. Available in multiple sizes. Perfect for any occasion.",
    inStock: true,
    rating: 4.3,
  },
  {
    id: 4,
    name: "Athletic Sneakers",
    price: 32000,
    image: sneakersImg,
    category: "Shoes",
    description: "Comfortable and durable sneakers with breathable mesh and cushioned sole. Perfect for sports and daily wear.",
    inStock: true,
    rating: 4.6,
  },
  {
    id: 5,
    name: "Premium Lunchbox",
    price: 8500,
    image: lunchboxImg,
    category: "Lunchboxes",
    description: "Keep your meals fresh with this stainless steel insulated lunchbox. Leak-proof and easy to clean.",
    inStock: true,
    rating: 4.4,
  },
  {
    id: 6,
    name: "Luxury Analog Watch",
    price: 65000,
    image: watchImg,
    category: "Watches",
    description: "Elegant timepiece with genuine leather strap and scratch-resistant glass. Water-resistant up to 50m.",
    inStock: true,
    rating: 4.8,
  },
  {
    id: 7,
    name: "Wireless Earbuds",
    price: 35000,
    image: earbudsImg,
    category: "Speakers",
    description: "True wireless earbuds with noise cancellation and 24-hour battery life with charging case.",
    inStock: false,
    rating: 4.5,
  },
  {
    id: 8,
    name: "Designer Handbag",
    price: 42000,
    image: handbagImg,
    category: "Clothes",
    description: "Stylish leather handbag with multiple compartments. Perfect for work or casual outings.",
    inStock: true,
    rating: 4.6,
  },
];

export const categories = ["All", "Watches", "Speakers", "Clothes", "Shoes", "Lunchboxes"];
