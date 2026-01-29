import { Package, Zap, Globe } from "lucide-react";
import deliveryPerson from "@/assets/delivery-person.jpg";

const About = () => {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
            About SwiftCart NG
          </h1>
          
          <p className="text-xl text-muted-foreground text-center mb-12">
            Nigeria's premier destination for fast, affordable tech gadgets and fashion accessories
          </p>

          {/* Delivery Person Image */}
          <div className="mb-12">
            <img
              src={deliveryPerson}
              alt="SwiftCart NG delivery person in branded uniform"
              className="w-full h-64 md:h-80 object-cover rounded-xl shadow-lg"
            />
          </div>

          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-lg leading-relaxed text-muted-foreground">
              SwiftCart NG is a fast and affordable Nigerian online store dedicated to bringing you the latest tech gadgets and fashion accessories from around the globe. We source high-quality products internationally to ensure you get the best value for your money, delivered right to your doorstep.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center p-6 bg-card rounded-lg border">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground">
                Swift and reliable delivery across Nigeria
              </p>
            </div>

            <div className="text-center p-6 bg-card rounded-lg border">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Affordable Prices</h3>
              <p className="text-muted-foreground">
                Quality products at competitive prices
              </p>
            </div>

            <div className="text-center p-6 bg-card rounded-lg border">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Global Sourcing</h3>
              <p className="text-muted-foreground">
                Premium products sourced from around the world
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
