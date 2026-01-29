import { Link } from 'react-router-dom';
import { useCompare } from '@/contexts/CompareContext';
import { Button } from '@/components/ui/button';
import { GitCompare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CompareFloatingButton = () => {
  const { compareItems } = useCompare();

  if (compareItems.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Link to="/compare">
          <Button size="lg" className="rounded-full shadow-lg gap-2">
            <GitCompare className="h-5 w-5" />
            Compare ({compareItems.length})
          </Button>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompareFloatingButton;
