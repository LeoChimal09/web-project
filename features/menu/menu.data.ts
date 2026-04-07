import type { MenuItem } from "@/components/customer/MenuCard";

// Menu categories — easily extensible
export const MENU_CATEGORIES = [
  "Appetizers",
  "Mains",
  "Seafood",
  "Vegetarian",
  "Desserts",
  "Drinks",
] as const;

export type MenuCategory = (typeof MENU_CATEGORIES)[number];

// Mock menu data — will be replaced by database queries in server/repositories/menu.repository.ts
export const menuItems: MenuItem[] = [
  // ===== APPETIZERS =====
  {
    id: "1",
    name: "Heirloom Tomato Salad",
    description: "Burrata, basil oil, balsamic reduction, and crispy bread",
    price: 14.99,
    category: "Appetizers",
    available: true,
  },
  {
    id: "2",
    name: "Charcuterie Board",
    description: "Selection of cured meats, artisan cheeses, and house pickles",
    price: 28.99,
    category: "Appetizers",
    available: true,
  },
  {
    id: "3",
    name: "Crispy Calamari",
    description: "Golden-fried squid with spicy aioli and lemon",
    price: 16.99,
    category: "Appetizers",
    available: true,
  },
  {
    id: "4",
    name: "Shrimp Saganaki",
    description: "Sauted shrimp with feta cheese, tomato, and ouzo",
    price: 18.99,
    category: "Appetizers",
    available: true,
  },
  {
    id: "5",
    name: "Bruschetta Trio",
    description: "Three variations: tomato, olive tapenade, and roasted garlic",
    price: 12.99,
    category: "Appetizers",
    available: true,
  },

  // ===== MAINS =====
  {
    id: "6",
    name: "Fire-Grilled Ribeye",
    description: "Prime cut ribeye with herb butter and roasted root vegetables",
    price: 42.99,
    category: "Mains",
    available: true,
  },
  {
    id: "7",
    name: "Pan-Seared Duck Breast",
    description: "Crispy skin duck with cherry gastrique and wild mushrooms",
    price: 38.99,
    category: "Mains",
    available: true,
  },
  {
    id: "8",
    name: "Wild Mushroom Risotto",
    description: "Creamy arborio rice with porcini, truffle oil, and parmesan",
    price: 22.99,
    category: "Mains",
    available: true,
  },

  // ===== SEAFOOD =====
  {
    id: "9",
    name: "Citrus Sea Bass",
    description: "Fresh sea bass with lemon emulsion and charred broccolini",
    price: 38.99,
    category: "Seafood",
    available: true,
  },
  {
    id: "10",
    name: "Pan-Seared Scallops",
    description: "Diver scallops with brown butter, asparagus, and crispy pancetta",
    price: 44.99,
    category: "Seafood",
    available: true,
  },
  {
    id: "11",
    name: "Grilled Salmon",
    description: "Atlantic salmon fillet with lemon glaze and seasonal vegetables",
    price: 35.99,
    category: "Seafood",
    available: false,
  },
  {
    id: "12",
    name: "Lobster Thermidor",
    description: "Classic preparation with cream sauce, cognac, and gruyère",
    price: 52.99,
    category: "Seafood",
    available: true,
  },

  // ===== VEGETARIAN =====
  {
    id: "13",
    name: "Garden Harvest Bowl",
    description: "Seasonal greens, wild rice, tahini drizzle, and house vinaigrette",
    price: 18.99,
    category: "Vegetarian",
    available: true,
  },
  {
    id: "14",
    name: "Eggplant Parmesan",
    description: "Layers of breaded eggplant, tomato sauce, and melted mozzarella",
    price: 20.99,
    category: "Vegetarian",
    available: true,
  },
  {
    id: "15",
    name: "Vegetable Tart",
    description: "Puff pastry with roasted seasonal vegetables and goat cheese",
    price: 19.99,
    category: "Vegetarian",
    available: true,
  },

  // ===== DESSERTS =====
  {
    id: "16",
    name: "Chocolate Lava Cake",
    description: "Warm dark chocolate cake with vanilla bean ice cream and berries",
    price: 12.99,
    category: "Desserts",
    available: true,
  },
  {
    id: "17",
    name: "Crème Brûlée",
    description: "Classic silky custard with caramelized sugar top",
    price: 11.99,
    category: "Desserts",
    available: true,
  },
  {
    id: "18",
    name: "Tiramisu",
    description: "Layers of mascarpone, espresso, and ladyfingers",
    price: 10.99,
    category: "Desserts",
    available: true,
  },
  {
    id: "19",
    name: "Lemon Panna Cotta",
    description: "Silky panna cotta with fresh lemon curd and shortbread",
    price: 11.99,
    category: "Desserts",
    available: true,
  },

  // ===== DRINKS =====
  {
    id: "20",
    name: "House Wine Red",
    description: "Cabernet Sauvignon blend by the glass",
    price: 9.99,
    category: "Drinks",
    available: true,
  },
  {
    id: "21",
    name: "House Wine White",
    description: "Pinot Grigio blend by the glass",
    price: 8.99,
    category: "Drinks",
    available: true,
  },
  {
    id: "22",
    name: "Espresso Martini",
    description: "Vodka, coffee liqueur, fresh espresso, and a foam top",
    price: 14.99,
    category: "Drinks",
    available: true,
  },
  {
    id: "23",
    name: "Craft Cocktail - The Garden",
    description: "Gin, basil, lime, cucumber, and soda water",
    price: 13.99,
    category: "Drinks",
    available: true,
  },
  {
    id: "24",
    name: "Old Fashioned",
    description: "Bourbon, bitters, sugar, and a cherry",
    price: 12.99,
    category: "Drinks",
    available: true,
  },
  {
    id: "25",
    name: "Sparkling Water",
    description: "Locally sourced sparkling water with optional fruit",
    price: 3.99,
    category: "Drinks",
    available: true,
  },
  {
    id: "26",
    name: "Fresh Pressed Juice",
    description: "Daily rotating selection of organic juices",
    price: 8.99,
    category: "Drinks",
    available: true,
  },
];
