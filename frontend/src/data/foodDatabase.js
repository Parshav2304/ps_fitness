export const FOOD_DATABASE = [
    // Proteins
    { name: 'Chicken Breast (Grilled)', serving: '100g', calories: 165, protein: 31, carbs: 0, fats: 3.6, category: 'Protein' },
    { name: 'Salmon (Grilled)', serving: '100g', calories: 206, protein: 22, carbs: 0, fats: 13, category: 'Protein' },
    { name: 'Tuna (Canned)', serving: '1 can', calories: 179, protein: 39, carbs: 0, fats: 1.3, category: 'Protein' },
    { name: 'Eggs (Whole)', serving: '1 large', calories: 72, protein: 6.3, carbs: 0.4, fats: 4.8, category: 'Protein' },
    { name: 'Beef (Lean Ground)', serving: '100g', calories: 250, protein: 26, carbs: 0, fats: 15, category: 'Protein' },
    { name: 'Turkey Breast', serving: '100g', calories: 135, protein: 30, carbs: 0, fats: 0.7, category: 'Protein' },
    { name: 'Pork Chop (Lean)', serving: '100g', calories: 206, protein: 28, carbs: 0, fats: 9, category: 'Protein' },
    { name: 'Shrimp', serving: '100g', calories: 99, protein: 24, carbs: 0.2, fats: 0.3, category: 'Protein' },
    { name: 'Tilapia', serving: '100g', calories: 128, protein: 26, carbs: 0, fats: 2.7, category: 'Protein' },
    { name: 'Tofu (Firm)', serving: '100g', calories: 144, protein: 17, carbs: 3, fats: 9, category: 'Protein' },

    // Carbs
    { name: 'Brown Rice (Cooked)', serving: '1 cup', calories: 216, protein: 5, carbs: 45, fats: 1.8, category: 'Carbs' },
    { name: 'White Rice (Cooked)', serving: '1 cup', calories: 205, protein: 4.2, carbs: 45, fats: 0.4, category: 'Carbs' },
    { name: 'Quinoa (Cooked)', serving: '1 cup', calories: 222, protein: 8, carbs: 39, fats: 3.6, category: 'Carbs' },
    { name: 'Oatmeal (Cooked)', serving: '1 cup', calories: 154, protein: 6, carbs: 27, fats: 3, category: 'Carbs' },
    { name: 'Sweet Potato (Baked)', serving: '1 medium', calories: 103, protein: 2.3, carbs: 24, fats: 0.2, category: 'Carbs' },
    { name: 'Pasta (Cooked)', serving: '1 cup', calories: 220, protein: 8, carbs: 43, fats: 1.3, category: 'Carbs' },
    { name: 'Whole Wheat Bread', serving: '1 slice', calories: 69, protein: 3.6, carbs: 12, fats: 0.9, category: 'Carbs' },
    { name: 'Bagel (Plain)', serving: '1 medium', calories: 289, protein: 11, carbs: 56, fats: 2, category: 'Carbs' },
    { name: 'Tortilla (Whole Wheat)', serving: '1 medium', calories: 130, protein: 4, carbs: 22, fats: 3, category: 'Carbs' },
    { name: 'Couscous (Cooked)', serving: '1 cup', calories: 176, protein: 6, carbs: 36, fats: 0.3, category: 'Carbs' },

    // Vegetables
    { name: 'Broccoli (Steamed)', serving: '1 cup', calories: 55, protein: 3.7, carbs: 11, fats: 0.6, category: 'Vegetables' },
    { name: 'Spinach (Cooked)', serving: '1 cup', calories: 41, protein: 5, carbs: 7, fats: 0.5, category: 'Vegetables' },
    { name: 'Carrots (Raw)', serving: '1 medium', calories: 25, protein: 0.6, carbs: 6, fats: 0.1, category: 'Vegetables' },
    { name: 'Bell Pepper (Raw)', serving: '1 medium', calories: 37, protein: 1.2, carbs: 9, fats: 0.3, category: 'Vegetables' },
    { name: 'Tomato (Raw)', serving: '1 medium', calories: 22, protein: 1, carbs: 5, fats: 0.2, category: 'Vegetables' },
    { name: 'Cucumber (Raw)', serving: '1 cup', calories: 16, protein: 0.7, carbs: 4, fats: 0.1, category: 'Vegetables' },
    { name: 'Lettuce (Romaine)', serving: '1 cup', calories: 8, protein: 0.6, carbs: 1.5, fats: 0.1, category: 'Vegetables' },
    { name: 'Asparagus (Cooked)', serving: '1 cup', calories: 40, protein: 4.3, carbs: 7.6, fats: 0.4, category: 'Vegetables' },
    { name: 'Green Beans', serving: '1 cup', calories: 44, protein: 2.4, carbs: 10, fats: 0.4, category: 'Vegetables' },
    { name: 'Cauliflower (Cooked)', serving: '1 cup', calories: 29, protein: 2.3, carbs: 5.7, fats: 0.6, category: 'Vegetables' },

    // Fruits
    { name: 'Banana', serving: '1 medium', calories: 105, protein: 1.3, carbs: 27, fats: 0.4, category: 'Fruits' },
    { name: 'Apple', serving: '1 medium', calories: 95, protein: 0.5, carbs: 25, fats: 0.3, category: 'Fruits' },
    { name: 'Orange', serving: '1 medium', calories: 62, protein: 1.2, carbs: 15, fats: 0.2, category: 'Fruits' },
    { name: 'Strawberries', serving: '1 cup', calories: 49, protein: 1, carbs: 12, fats: 0.5, category: 'Fruits' },
    { name: 'Blueberries', serving: '1 cup', calories: 84, protein: 1.1, carbs: 21, fats: 0.5, category: 'Fruits' },
    { name: 'Grapes', serving: '1 cup', calories: 104, protein: 1.1, carbs: 27, fats: 0.2, category: 'Fruits' },
    { name: 'Watermelon', serving: '1 cup', calories: 46, protein: 0.9, carbs: 12, fats: 0.2, category: 'Fruits' },
    { name: 'Pineapple', serving: '1 cup', calories: 82, protein: 0.9, carbs: 22, fats: 0.2, category: 'Fruits' },
    { name: 'Mango', serving: '1 cup', calories: 99, protein: 1.4, carbs: 25, fats: 0.6, category: 'Fruits' },
    { name: 'Avocado', serving: '1/2 medium', calories: 120, protein: 1.5, carbs: 6, fats: 11, category: 'Fruits' },

    // Dairy
    { name: 'Greek Yogurt (Plain)', serving: '1 cup', calories: 130, protein: 22, carbs: 9, fats: 0.7, category: 'Dairy' },
    { name: 'Milk (2%)', serving: '1 cup', calories: 122, protein: 8, carbs: 12, fats: 4.8, category: 'Dairy' },
    { name: 'Cottage Cheese', serving: '1 cup', calories: 163, protein: 28, carbs: 6, fats: 2.3, category: 'Dairy' },
    { name: 'Cheddar Cheese', serving: '1 oz', calories: 114, protein: 7, carbs: 0.4, fats: 9, category: 'Dairy' },
    { name: 'Mozzarella Cheese', serving: '1 oz', calories: 85, protein: 6, carbs: 1, fats: 6, category: 'Dairy' },
    { name: 'Yogurt (Low-Fat)', serving: '1 cup', calories: 154, protein: 13, carbs: 17, fats: 3.8, category: 'Dairy' },

    // Snacks & Others
    { name: 'Almonds', serving: '1 oz (28g)', calories: 164, protein: 6, carbs: 6, fats: 14, category: 'Snacks' },
    { name: 'Peanut Butter', serving: '2 tbsp', calories: 188, protein: 8, carbs: 7, fats: 16, category: 'Snacks' },
    { name: 'Cashews', serving: '1 oz', calories: 157, protein: 5, carbs: 9, fats: 12, category: 'Snacks' },
    { name: 'Walnuts', serving: '1 oz', calories: 185, protein: 4.3, carbs: 4, fats: 18, category: 'Snacks' },
    { name: 'Protein Bar', serving: '1 bar', calories: 200, protein: 20, carbs: 22, fats: 7, category: 'Snacks' },
    { name: 'Whey Protein Powder', serving: '1 scoop', calories: 120, protein: 24, carbs: 3, fats: 1.5, category: 'Snacks' },
    { name: 'Dark Chocolate', serving: '1 oz', calories: 170, protein: 2, carbs: 13, fats: 12, category: 'Snacks' },
    { name: 'Granola', serving: '1/2 cup', calories: 210, protein: 5, carbs: 38, fats: 6, category: 'Snacks' },

    // Indian Cuisine - Curries & Gravies
    { name: 'Chicken Curry', serving: '1 cup', calories: 280, protein: 25, carbs: 12, fats: 15, category: 'Indian' },
    { name: 'Butter Chicken', serving: '1 cup', calories: 438, protein: 30, carbs: 14, fats: 31, category: 'Indian' },
    { name: 'Tandoori Chicken', serving: '100g', calories: 150, protein: 28, carbs: 2, fats: 3, category: 'Indian' },
    { name: 'Chicken Tikka Masala', serving: '1 cup', calories: 350, protein: 28, carbs: 15, fats: 20, category: 'Indian' },
    { name: 'Mutton Curry', serving: '1 cup', calories: 380, protein: 30, carbs: 10, fats: 25, category: 'Indian' },
    { name: 'Fish Curry', serving: '1 cup', calories: 220, protein: 25, carbs: 8, fats: 10, category: 'Indian' },
    { name: 'Egg Curry', serving: '1 cup', calories: 250, protein: 18, carbs: 12, fats: 15, category: 'Indian' },

    // Indian - Lentils & Beans
    { name: 'Dal Tadka', serving: '1 cup', calories: 184, protein: 12, carbs: 30, fats: 2, category: 'Indian' },
    { name: 'Dal Makhani', serving: '1 cup', calories: 290, protein: 14, carbs: 32, fats: 12, category: 'Indian' },
    { name: 'Dal Fry', serving: '1 cup', calories: 180, protein: 11, carbs: 28, fats: 3, category: 'Indian' },
    { name: 'Chana Masala', serving: '1 cup', calories: 240, protein: 12, carbs: 38, fats: 6, category: 'Indian' },
    { name: 'Rajma (Kidney Beans)', serving: '1 cup', calories: 225, protein: 15, carbs: 40, fats: 1, category: 'Indian' },
    { name: 'Sambhar', serving: '1 cup', calories: 150, protein: 8, carbs: 25, fats: 3, category: 'Indian' },
    { name: 'Rasam', serving: '1 cup', calories: 50, protein: 2, carbs: 10, fats: 1, category: 'Indian' },

    // Indian - Paneer Dishes
    { name: 'Paneer Tikka', serving: '100g', calories: 265, protein: 14, carbs: 6, fats: 21, category: 'Indian' },
    { name: 'Palak Paneer', serving: '1 cup', calories: 270, protein: 12, carbs: 10, fats: 20, category: 'Indian' },
    { name: 'Paneer Butter Masala', serving: '1 cup', calories: 380, protein: 15, carbs: 18, fats: 28, category: 'Indian' },
    { name: 'Kadai Paneer', serving: '1 cup', calories: 320, protein: 14, carbs: 15, fats: 23, category: 'Indian' },
    { name: 'Matar Paneer', serving: '1 cup', calories: 300, protein: 13, carbs: 20, fats: 18, category: 'Indian' },
    { name: 'Shahi Paneer', serving: '1 cup', calories: 400, protein: 16, carbs: 20, fats: 30, category: 'Indian' },

    // Indian - Breads
    { name: 'Roti (Whole Wheat)', serving: '1 piece', calories: 71, protein: 3, carbs: 15, fats: 0.4, category: 'Indian' },
    { name: 'Chapati', serving: '1 piece', calories: 70, protein: 2.5, carbs: 15, fats: 0.5, category: 'Indian' },
    { name: 'Naan', serving: '1 piece', calories: 262, protein: 9, carbs: 45, fats: 5, category: 'Indian' },
    { name: 'Garlic Naan', serving: '1 piece', calories: 280, protein: 9, carbs: 46, fats: 6, category: 'Indian' },
    { name: 'Butter Naan', serving: '1 piece', calories: 310, protein: 9, carbs: 47, fats: 9, category: 'Indian' },
    { name: 'Paratha (Plain)', serving: '1 piece', calories: 126, protein: 3, carbs: 18, fats: 5, category: 'Indian' },
    { name: 'Aloo Paratha', serving: '1 piece', calories: 180, protein: 4, carbs: 25, fats: 7, category: 'Indian' },
    { name: 'Gobi Paratha', serving: '1 piece', calories: 170, protein: 4, carbs: 24, fats: 6, category: 'Indian' },
    { name: 'Paneer Paratha', serving: '1 piece', calories: 200, protein: 7, carbs: 22, fats: 9, category: 'Indian' },
    { name: 'Puri', serving: '1 piece', calories: 80, protein: 2, carbs: 10, fats: 4, category: 'Indian' },
    { name: 'Bhatura', serving: '1 piece', calories: 250, protein: 6, carbs: 35, fats: 10, category: 'Indian' },

    // Indian - Rice Dishes
    { name: 'Biryani (Chicken)', serving: '1 cup', calories: 418, protein: 23, carbs: 52, fats: 14, category: 'Indian' },
    { name: 'Biryani (Mutton)', serving: '1 cup', calories: 450, protein: 25, carbs: 50, fats: 18, category: 'Indian' },
    { name: 'Biryani (Veg)', serving: '1 cup', calories: 340, protein: 8, carbs: 58, fats: 9, category: 'Indian' },
    { name: 'Pulao (Veg)', serving: '1 cup', calories: 250, protein: 5, carbs: 45, fats: 6, category: 'Indian' },
    { name: 'Jeera Rice', serving: '1 cup', calories: 210, protein: 4, carbs: 42, fats: 3, category: 'Indian' },
    { name: 'Lemon Rice', serving: '1 cup', calories: 230, protein: 4, carbs: 44, fats: 5, category: 'Indian' },
    { name: 'Curd Rice', serving: '1 cup', calories: 200, protein: 6, carbs: 38, fats: 3, category: 'Indian' },
    { name: 'Tamarind Rice', serving: '1 cup', calories: 240, protein: 4, carbs: 46, fats: 5, category: 'Indian' },

    // Indian - Snacks & Street Food
    { name: 'Samosa', serving: '1 piece', calories: 262, protein: 5, carbs: 32, fats: 13, category: 'Indian' },
    { name: 'Pakora (Mixed Veg)', serving: '100g', calories: 280, protein: 6, carbs: 28, fats: 16, category: 'Indian' },
    { name: 'Kachori', serving: '1 piece', calories: 180, protein: 4, carbs: 22, fats: 9, category: 'Indian' },
    { name: 'Vada Pav', serving: '1 piece', calories: 290, protein: 6, carbs: 40, fats: 12, category: 'Indian' },
    { name: 'Pani Puri', serving: '6 pieces', calories: 150, protein: 3, carbs: 30, fats: 2, category: 'Indian' },
    { name: 'Bhel Puri', serving: '1 cup', calories: 180, protein: 4, carbs: 32, fats: 4, category: 'Indian' },
    { name: 'Sev Puri', serving: '1 serving', calories: 220, protein: 5, carbs: 35, fats: 7, category: 'Indian' },
    { name: 'Dahi Puri', serving: '6 pieces', calories: 200, protein: 5, carbs: 28, fats: 7, category: 'Indian' },
    { name: 'Pav Bhaji', serving: '1 serving', calories: 400, protein: 10, carbs: 55, fats: 16, category: 'Indian' },
    { name: 'Chole Bhature', serving: '1 serving', calories: 550, protein: 18, carbs: 75, fats: 20, category: 'Indian' },
    { name: 'Aloo Tikki', serving: '1 piece', calories: 150, protein: 3, carbs: 20, fats: 7, category: 'Indian' },
    { name: 'Dhokla', serving: '1 piece', calories: 80, protein: 3, carbs: 14, fats: 2, category: 'Indian' },
    { name: 'Khandvi', serving: '100g', calories: 120, protein: 5, carbs: 18, fats: 3, category: 'Indian' },

    // Indian - South Indian
    { name: 'Dosa (Plain)', serving: '1 piece', calories: 133, protein: 4, carbs: 25, fats: 2, category: 'Indian' },
    { name: 'Masala Dosa', serving: '1 piece', calories: 220, protein: 6, carbs: 38, fats: 5, category: 'Indian' },
    { name: 'Rava Dosa', serving: '1 piece', calories: 180, protein: 5, carbs: 30, fats: 4, category: 'Indian' },
    { name: 'Idli', serving: '2 pieces', calories: 78, protein: 3, carbs: 16, fats: 0.5, category: 'Indian' },
    { name: 'Vada (Medu)', serving: '1 piece', calories: 150, protein: 4, carbs: 18, fats: 7, category: 'Indian' },
    { name: 'Upma', serving: '1 cup', calories: 200, protein: 5, carbs: 35, fats: 5, category: 'Indian' },
    { name: 'Pongal', serving: '1 cup', calories: 250, protein: 8, carbs: 40, fats: 7, category: 'Indian' },
    { name: 'Uttapam', serving: '1 piece', calories: 180, protein: 5, carbs: 32, fats: 4, category: 'Indian' },

    // Indian - Breakfast
    { name: 'Poha', serving: '1 cup', calories: 180, protein: 4, carbs: 32, fats: 4, category: 'Indian' },
    { name: 'Upma', serving: '1 cup', calories: 200, protein: 5, carbs: 35, fats: 5, category: 'Indian' },
    { name: 'Khichdi', serving: '1 cup', calories: 215, protein: 8, carbs: 40, fats: 3, category: 'Indian' },
    { name: 'Sabudana Khichdi', serving: '1 cup', calories: 300, protein: 2, carbs: 60, fats: 5, category: 'Indian' },
    { name: 'Paratha with Curd', serving: '1 serving', calories: 250, protein: 8, carbs: 30, fats: 10, category: 'Indian' },

    // Indian - Vegetables
    { name: 'Aloo Gobi', serving: '1 cup', calories: 150, protein: 4, carbs: 22, fats: 6, category: 'Indian' },
    { name: 'Baingan Bharta', serving: '1 cup', calories: 180, protein: 3, carbs: 15, fats: 12, category: 'Indian' },
    { name: 'Bhindi Masala', serving: '1 cup', calories: 90, protein: 3, carbs: 12, fats: 4, category: 'Indian' },
    { name: 'Mix Veg Curry', serving: '1 cup', calories: 120, protein: 4, carbs: 18, fats: 4, category: 'Indian' },
    { name: 'Cabbage Sabzi', serving: '1 cup', calories: 80, protein: 2, carbs: 12, fats: 3, category: 'Indian' },
    { name: 'Beans Poriyal', serving: '1 cup', calories: 90, protein: 3, carbs: 14, fats: 3, category: 'Indian' },
    { name: 'Carrot Poriyal', serving: '1 cup', calories: 85, protein: 2, carbs: 13, fats: 3, category: 'Indian' },

    // Indian - Accompaniments
    { name: 'Raita (Cucumber)', serving: '1 cup', calories: 80, protein: 4, carbs: 8, fats: 3, category: 'Indian' },
    { name: 'Raita (Boondi)', serving: '1 cup', calories: 120, protein: 5, carbs: 15, fats: 4, category: 'Indian' },
    { name: 'Pickle (Mixed)', serving: '1 tbsp', calories: 15, protein: 0.5, carbs: 2, fats: 0.5, category: 'Indian' },
    { name: 'Papad', serving: '1 piece', calories: 50, protein: 2, carbs: 8, fats: 1, category: 'Indian' },
    { name: 'Chutney (Coconut)', serving: '2 tbsp', calories: 40, protein: 1, carbs: 5, fats: 2, category: 'Indian' },
    { name: 'Chutney (Mint)', serving: '2 tbsp', calories: 20, protein: 0.5, carbs: 4, fats: 0.5, category: 'Indian' },
    { name: 'Chutney (Tamarind)', serving: '2 tbsp', calories: 50, protein: 0.5, carbs: 12, fats: 0.2, category: 'Indian' },

    // Indian - Sweets
    { name: 'Gulab Jamun', serving: '1 piece', calories: 175, protein: 3, carbs: 28, fats: 6, category: 'Indian' },
    { name: 'Jalebi', serving: '100g', calories: 450, protein: 4, carbs: 70, fats: 18, category: 'Indian' },
    { name: 'Rasgulla', serving: '1 piece', calories: 106, protein: 2, carbs: 20, fats: 2, category: 'Indian' },
    { name: 'Kheer', serving: '1 cup', calories: 200, protein: 6, carbs: 32, fats: 5, category: 'Indian' },
    { name: 'Halwa (Carrot)', serving: '1 cup', calories: 300, protein: 5, carbs: 45, fats: 12, category: 'Indian' },
    { name: 'Halwa (Sooji)', serving: '1 cup', calories: 350, protein: 6, carbs: 50, fats: 15, category: 'Indian' },
    { name: 'Ladoo (Besan)', serving: '1 piece', calories: 150, protein: 3, carbs: 20, fats: 7, category: 'Indian' },
    { name: 'Barfi (Milk)', serving: '1 piece', calories: 120, protein: 3, carbs: 18, fats: 4, category: 'Indian' },
    { name: 'Mysore Pak', serving: '1 piece', calories: 180, protein: 2, carbs: 22, fats: 10, category: 'Indian' },
    { name: 'Peda', serving: '1 piece', calories: 100, protein: 2, carbs: 16, fats: 3, category: 'Indian' },

    // Indian - Beverages
    { name: 'Lassi (Sweet)', serving: '1 glass', calories: 150, protein: 6, carbs: 24, fats: 3, category: 'Indian' },
    { name: 'Lassi (Salted)', serving: '1 glass', calories: 90, protein: 5, carbs: 10, fats: 3, category: 'Indian' },
    { name: 'Mango Lassi', serving: '1 glass', calories: 180, protein: 6, carbs: 30, fats: 3, category: 'Indian' },
    { name: 'Buttermilk (Chaas)', serving: '1 glass', calories: 40, protein: 2, carbs: 5, fats: 1, category: 'Indian' },
    { name: 'Masala Chai', serving: '1 cup', calories: 80, protein: 3, carbs: 12, fats: 2, category: 'Indian' },
    { name: 'Filter Coffee', serving: '1 cup', calories: 60, protein: 2, carbs: 8, fats: 2, category: 'Indian' },

    // More International Proteins
    { name: 'Lamb Chop', serving: '100g', calories: 294, protein: 25, carbs: 0, fats: 21, category: 'Protein' },
    { name: 'Duck Breast', serving: '100g', calories: 337, protein: 19, carbs: 0, fats: 28, category: 'Protein' },
    { name: 'Cod Fish', serving: '100g', calories: 82, protein: 18, carbs: 0, fats: 0.7, category: 'Protein' },
    { name: 'Mackerel', serving: '100g', calories: 205, protein: 19, carbs: 0, fats: 14, category: 'Protein' },
    { name: 'Prawns', serving: '100g', calories: 99, protein: 24, carbs: 0.2, fats: 0.3, category: 'Protein' },
    { name: 'Crab Meat', serving: '100g', calories: 97, protein: 19, carbs: 0, fats: 1.5, category: 'Protein' },
    { name: 'Tempeh', serving: '100g', calories: 193, protein: 19, carbs: 9, fats: 11, category: 'Protein' },
    { name: 'Seitan', serving: '100g', calories: 370, protein: 75, carbs: 14, fats: 2, category: 'Protein' },

    // More Carbs
    { name: 'Barley (Cooked)', serving: '1 cup', calories: 193, protein: 3.5, carbs: 44, fats: 0.7, category: 'Carbs' },
    { name: 'Buckwheat', serving: '1 cup', calories: 155, protein: 6, carbs: 33, fats: 1, category: 'Carbs' },
    { name: 'Millet', serving: '1 cup', calories: 207, protein: 6, carbs: 41, fats: 1.7, category: 'Carbs' },
    { name: 'Rye Bread', serving: '1 slice', calories: 83, protein: 3, carbs: 16, fats: 1, category: 'Carbs' },
    { name: 'Sourdough Bread', serving: '1 slice', calories: 93, protein: 4, carbs: 18, fats: 0.6, category: 'Carbs' },
    { name: 'Pita Bread', serving: '1 piece', calories: 165, protein: 5.5, carbs: 33, fats: 0.7, category: 'Carbs' },

    // More Fruits
    { name: 'Kiwi', serving: '1 medium', calories: 42, protein: 0.8, carbs: 10, fats: 0.4, category: 'Fruits' },
    { name: 'Papaya', serving: '1 cup', calories: 62, protein: 0.7, carbs: 16, fats: 0.4, category: 'Fruits' },
    { name: 'Pomegranate', serving: '1/2 cup', calories: 72, protein: 1.5, carbs: 16, fats: 1, category: 'Fruits' },
    { name: 'Guava', serving: '1 medium', calories: 37, protein: 1.4, carbs: 8, fats: 0.5, category: 'Fruits' },
    { name: 'Lychee', serving: '1 cup', calories: 125, protein: 1.6, carbs: 31, fats: 0.8, category: 'Fruits' },
    { name: 'Dragon Fruit', serving: '1 cup', calories: 136, protein: 3, carbs: 29, fats: 0, category: 'Fruits' },

    // More Vegetables
    { name: 'Kale', serving: '1 cup', calories: 33, protein: 2.9, carbs: 6, fats: 0.6, category: 'Vegetables' },
    { name: 'Brussels Sprouts', serving: '1 cup', calories: 38, protein: 3, carbs: 8, fats: 0.3, category: 'Vegetables' },
    { name: 'Zucchini', serving: '1 cup', calories: 20, protein: 1.5, carbs: 4, fats: 0.4, category: 'Vegetables' },
    { name: 'Eggplant', serving: '1 cup', calories: 20, protein: 0.8, carbs: 5, fats: 0.1, category: 'Vegetables' },
    { name: 'Mushrooms', serving: '1 cup', calories: 15, protein: 2.2, carbs: 2.3, fats: 0.2, category: 'Vegetables' },
    { name: 'Onion', serving: '1 medium', calories: 44, protein: 1.2, carbs: 10, fats: 0.1, category: 'Vegetables' },
    { name: 'Garlic', serving: '3 cloves', calories: 13, protein: 0.6, carbs: 3, fats: 0, category: 'Vegetables' }
];
